import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateProfilePortrait } from '../services/profilePortrait';

const prisma = new PrismaClient();

const publicProfile = (user: any) => ({
  id: user.id,
  displayName: user.default_display_name || 'Investigador',
  bio: user.bio || '',
  active: user.profile_active,
  photo: user.generated_profile_photo_data || user.profile_photo_data || null,
  hasGeneratedPortrait: Boolean(user.generated_profile_photo_data),
  hasProfile: Boolean(user.default_display_name) || Boolean(user.bio) || Boolean(user.profile_photo_data) || Boolean(user.generated_profile_photo_data),
  photoUpdatedAt: user.profile_photo_updated_at
});

export const getProfile = async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const user = await prisma.anonymous_users.findUnique({ where: { id: userId } });
  if (!user || user.deleted_at) return res.status(404).json({ success: false, error: 'Profile not found' });
  res.json({ success: true, data: publicProfile(user) });
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
      generatedPortrait = await generateProfilePortrait(String(photoData));
      portraitStatus = 'READY';
      // Update the DB with the generated portrait
      await prisma.anonymous_users.update({
        where: { id: current.id },
        data: { generated_profile_photo_data: generatedPortrait }
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
