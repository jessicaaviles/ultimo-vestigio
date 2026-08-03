import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { generateProfilePortrait } from '../services/profilePortrait';
import { hashToken } from '../security/secrets';

const prisma = new PrismaClient();

const MAX_PORTRAIT_GENERATIONS = 3;
const PORTRAIT_RESET_EMAILS = (process.env.PORTRAIT_RESET_EMAILS || 'jessica.aviles16@gmail.com')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const publicProfile = (user: any, stats?: any) => ({
  id: user.id,
  displayName: user.default_display_name || 'Investigador',
  bio: user.bio || '',
  active: user.profile_active,
  photo: user.generated_profile_photo_data || user.profile_photo_data || null,
  hasGeneratedPortrait: Boolean(user.generated_profile_photo_data),
  hasProfile: Boolean(user.default_display_name) || Boolean(user.bio) || Boolean(user.profile_photo_data) || Boolean(user.generated_profile_photo_data),
  onboardingCompleted: Boolean(user.onboarding_completed),
  photoUpdatedAt: user.profile_photo_updated_at,
  portraitGenerations: user.portrait_generations ?? 0,
  portraitGenerationsRemaining: Math.max(0, MAX_PORTRAIT_GENERATIONS - (user.portrait_generations ?? 0)),
  stats: stats || { hostedRoomsCount: 0, playedRoomsCount: 0, theoriesCount: 0, correctTheoriesCount: 0 }
});

export const getProfile = async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const user = await prisma.anonymous_users.findUnique({ where: { id: userId } });
  if (!user || user.deleted_at) return res.status(404).json({ success: false, error: 'Profile not found' });
  
  // Calculate Stats
  const hostedRoomsCount = await prisma.room_players.count({
    where: {
      anonymous_user_id: userId,
      is_host: true,
      room: { status: { in: ['COMPLETED', 'GAME_OVER'] }, deleted_at: null }
    }
  });
  
  const playedRooms = await prisma.room_players.findMany({ 
    where: { anonymous_user_id: userId },
    include: { room: true }
  });
  const playedRoomsCount = playedRooms.filter((rp: any) => ['COMPLETED', 'GAME_OVER'].includes(rp.room.status) && !rp.room.deleted_at).length;

  const theoriesCount = await prisma.theories.count({
    where: { player: { anonymous_user_id: userId }, room: { deleted_at: null } }
  });

  const correctTheoriesCount = await prisma.theory_evaluations.count({
    where: { 
      theory: { player: { anonymous_user_id: userId }, room: { deleted_at: null } },
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

export const resetPortraitGenerations = async (req: Request, res: Response) => {
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

    const email = String(user.email || '').trim().toLowerCase();
    if (!PORTRAIT_RESET_EMAILS.includes(email)) {
      return res.status(403).json({ success: false, error: 'Reset de retratos indisponível para esta conta.' });
    }

    const updated = await prisma.anonymous_users.update({
      where: { id: user.id },
      data: {
        portrait_generations: 0,
        generated_profile_photo_data: null,
      },
    });

    res.json({ success: true, data: publicProfile(updated) });
  } catch (error) {
    console.error('Error resetting portrait generations:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao resetar gerações de retrato.' });
  }
};

export const resetCaseProgress = async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const caseSlug = String(Array.isArray(req.params.caseSlug) ? req.params.caseSlug[0] : req.params.caseSlug || '').trim();
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

    const resetAllCases = caseSlug.toLowerCase() === 'all';
    if (!resetAllCases) {
      const caseRecord = await prisma.cases.findUnique({ where: { slug: caseSlug } });
      if (!caseRecord) {
        return res.status(404).json({ success: false, error: 'Caso não encontrado.' });
      }
    }

    const roomPlayers = await prisma.room_players.findMany({
      where: {
        anonymous_user_id: user.id,
        ...(resetAllCases
          ? {}
          : { room: { case_version: { case_ref: { slug: caseSlug } } } }),
      },
      include: { room: { include: { players: { where: { removed_at: null }, orderBy: { joined_at: 'asc' } } } } },
    });

    const roomIds = Array.from(new Set(roomPlayers.map((player) => player.room_id)));
    const playerIds = roomPlayers.map((player) => player.id);
    const now = new Date();

    if (roomIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        const userQuestions = await tx.questions.findMany({
          where: { room_id: { in: roomIds }, player_id: { in: playerIds } },
          select: { id: true },
        });
        const questionIds = userQuestions.map((question) => question.id);

        if (questionIds.length > 0) {
          const answers = await tx.master_answers.findMany({ where: { question_id: { in: questionIds } }, select: { id: true } });
          const answerIds = answers.map((answer) => answer.id);
          if (answerIds.length > 0) {
            await tx.master_answers.updateMany({ where: { corrected_answer_id: { in: answerIds } }, data: { corrected_answer_id: null } });
          }
          await tx.answer_contestations.deleteMany({ where: { question_id: { in: questionIds } } });
          await tx.question_clarifications.deleteMany({ where: { question_id: { in: questionIds } } });
          await tx.master_answers.deleteMany({ where: { question_id: { in: questionIds } } });
          await tx.question_interpretations.deleteMany({ where: { question_id: { in: questionIds } } });
          await tx.questions.updateMany({ where: { repeated_question_id: { in: questionIds } }, data: { repeated_question_id: null } });
          await tx.questions.deleteMany({ where: { id: { in: questionIds } } });
        }

        const userTheories = await tx.theories.findMany({
          where: { room_id: { in: roomIds }, player_id: { in: playerIds } },
          select: { id: true },
        });
        const theoryIds = userTheories.map((theory) => theory.id);
        if (theoryIds.length > 0) {
          await tx.theory_evaluations.deleteMany({ where: { theory_id: { in: theoryIds } } });
          await tx.theories.deleteMany({ where: { id: { in: theoryIds } } });
        }

        await tx.vote_responses.deleteMany({ where: { player_id: { in: playerIds } } });
        await tx.turns.deleteMany({ where: { room_id: { in: roomIds }, player_id: { in: playerIds } } });
        await tx.hint_usages.deleteMany({ where: { room_id: { in: roomIds }, requested_by: user.id } });
        await tx.feedback.deleteMany({ where: { room_id: { in: roomIds }, anonymous_player_hash: hashToken(user.id) } });
        await tx.room_players.updateMany({
          where: { id: { in: playerIds } },
          data: {
            is_host: false,
            ready_status: 'NOT_READY',
            connection_status: 'DISCONNECTED',
            left_at: now,
            removed_at: now,
            last_seen_at: now,
          },
        });

        for (const roomPlayer of roomPlayers) {
          const remainingPlayers = roomPlayer.room.players.filter((player) => player.anonymous_user_id !== user.id);
          if (remainingPlayers.length === 0) {
            await tx.game_results.deleteMany({ where: { room_id: roomPlayer.room_id } });
            await tx.rooms.update({
              where: { id: roomPlayer.room_id },
              data: {
                status: 'CANCELLED',
                current_round: 0,
                current_turn_id: null,
                completed_at: null,
                cancelled_at: now,
                deleted_at: now,
                last_activity_at: now,
              },
            });
          } else if (roomPlayer.room.host_user_id === user.id) {
            const successor = remainingPlayers[0];
            await tx.rooms.update({
              where: { id: roomPlayer.room_id },
              data: { host_user_id: successor.anonymous_user_id, last_activity_at: now },
            });
            await tx.room_players.update({
              where: { id: successor.id },
              data: { is_host: true, ready_status: 'READY' },
            });
          }
        }
      });
    }

    res.json({ success: true, data: { caseSlug, resetAllCases, resetRoomsCount: roomIds.length } });
  } catch (error) {
    console.error('Error resetting case progress:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao resetar progresso do caso.' });
  }
};

export const completeOnboarding = async (req: Request, res: Response) => {
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

    const updated = await prisma.anonymous_users.update({
      where: { id: user.id },
      data: { onboarding_completed: true },
    });

    res.json({ success: true, data: publicProfile(updated) });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao concluir onboarding.' });
  }
};
