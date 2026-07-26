import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { generateProfilePortrait } from '../services/profilePortrait';

const prisma = new PrismaClient();

const MAX_PORTRAIT_GENERATIONS = 3;

const publicProfile = (user: any, stats?: any) => ({
  id: user.id,
  displayName: user.default_display_name || 'Investigador',
  bio: user.bio || '',
  active: user.profile_active,
  photo: user.generated_profile_photo_data || user.profile_photo_data || null,
  hasGeneratedPortrait: Boolean(user.generated_profile_photo_data),
  hasProfile: Boolean(user.default_display_name) || Boolean(user.bio) || Boolean(user.profile_photo_data) || Boolean(user.generated_profile_photo_data),
  photoUpdatedAt: user.profile_photo_updated_at,
  portraitGenerations: user.portrait_generations ?? 0,
  portraitGenerationsRemaining: Math.max(0, MAX_PORTRAIT_GENERATIONS - (user.portrait_generations ?? 0)),
  stats: stats || { hostedRoomsCount: 0, playedRoomsCount: 0, theoriesCount: 0, correctTheoriesCount: 0 }
});

export const getProfile = async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const user = await prisma.anonymous_users.findUnique({ where: { id: userId } });
  if (!user || user.deleted_at) return res.status(404).json({ success: false, error: 'Profile not found' });
  
  // Calculate Stats
  const hostedRoomsCount = await prisma.rooms.count({ where: { host_user_id: userId, status: 'COMPLETED' } });
  
  const playedRooms = await prisma.room_players.findMany({ 
    where: { anonymous_user_id: userId },
    include: { room: true }
  });
  const playedRoomsCount = playedRooms.filter((rp: any) => rp.room.status === 'COMPLETED').length;

  const theoriesCount = await prisma.theories.count({
    where: { player: { anonymous_user_id: userId } }
  });

  const correctTheoriesCount = await prisma.theory_evaluations.count({
    where: { 
      theory: { player: { anonymous_user_id: userId } },
      result: 'CORRECT'
    }
  });

  const stats = {
    hostedRoomsCount,
    playedRoomsCount,
    theoriesCount,
    correctTheoriesCount
  };

  res.json({ success: true, data: publicProfile(user, stats) });
};

export const updateProfile = async (req: Request, res: Response) => {
  const { displayName, bio, active, photoData, generatePortrait = true } = req.body;
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const current = await prisma.anonymous_users.findUnique({ where: { id: userId } });
  if (!current || current.deleted_at) return res.status(404).json({ success: false, error: 'Profile not found' });
  const cleanName = String(displayName ?? current.default_display_name ?? 'Investigador').trim().slice(0, 32);
  if (!cleanName) return res.status(400).json({ success: false, error: 'Display name is required' });
  if (bio !== undefined && String(bio).length > 280) return res.status(400).json({ success: false, error: 'Bio is too long' });

  if (photoData) {
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(String(photoData)) || Buffer.byteLength(String(photoData).split(',')[1], 'base64') > 4 * 1024 * 1024)
      return res.status(400).json({ success: false, error: 'Invalid profile image' });
    const gensUsed = current.portrait_generations ?? 0;
    if (generatePortrait !== false && gensUsed >= MAX_PORTRAIT_GENERATIONS) {
      return res.status(400).json({ success: false, error: 'Limite de retratos atingido (máximo 3). Remova a foto ou use uma foto já existente.', portraitLimitReached: true });
    }
  }

  let generatedPortrait: string | null | undefined;
  let portraitStatus: string;
  if (current.generated_profile_photo_data) {
    portraitStatus = 'READY';
  } else if (photoData && generatePortrait) {
    portraitStatus = 'GENERATING';
  } else {
    portraitStatus = 'NOT_REQUESTED';
  }

  // Save profile data immediately
  const user = await prisma.anonymous_users.update({
    where: { id: current.id },
    data: {
      default_display_name: cleanName,
      bio: String(bio ?? current.bio ?? '').trim().slice(0, 280),
      profile_active: active !== false,
      profile_photo_data: photoData ? String(photoData) : undefined,
      generated_profile_photo_data: photoData ? null : undefined,
      profile_photo_updated_at: photoData ? new Date() : undefined,
    }
  });

  // Generate portrait synchronously so it's ready in the response
  if (photoData && generatePortrait) {
    try {
      generatedPortrait = await generateProfilePortrait(String(photoData), current.id);
      portraitStatus = 'READY';
      await prisma.anonymous_users.update({
        where: { id: current.id },
        data: {
          generated_profile_photo_data: generatedPortrait,
          portrait_generations: { increment: 1 },
        }
      });
    } catch (error) {
      portraitStatus = 'UNAVAILABLE';
      console.error('Profile portrait generation failed:', error);
    }
  }

  // Re-fetch to return updated data
  const updated = generatedPortrait
    ? await prisma.anonymous_users.findUnique({ where: { id: current.id } })
    : user;

  res.json({ success: true, portraitStatus, data: publicProfile(updated ?? user) });
};

export const deleteProfile = async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token não fornecido.' });
    }

    const token = authHeader.slice(7);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.anonymous_users.findFirst({
      where: { id: userId, auth_token_hash: tokenHash, deleted_at: null },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Perfil não encontrado ou token inválido.' });
    }

    await prisma.anonymous_users.update({
      where: { id: user.id },
      data: {
        email: null,
        password_hash: null,
        auth_token_hash: null,
        default_display_name: 'Conta excluída',
        bio: null,
        profile_active: false,
        profile_photo_data: null,
        generated_profile_photo_data: null,
        portrait_generations: 0,
        profile_photo_updated_at: null,
        deleted_at: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao excluir conta.' });
  }
};
