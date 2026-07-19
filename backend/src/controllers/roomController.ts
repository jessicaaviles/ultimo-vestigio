import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { hashToken } from '../security/secrets';
import { generateCaseImage } from '../services/caseImageGenerator';

const prisma = new PrismaClient();

// Helper to generate a 6 character code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const listCases = async (_req: Request, res: Response) => {
  try {
    const cases = await prisma.cases.findMany({ where: { status: { in: ['PUBLISHED', 'published'] }, deleted_at: null }, orderBy: { created_at: 'asc' } });
    cases.sort((a, b) => Number(b.slug === 'o-quarto-7') - Number(a.slug === 'o-quarto-7'));
    res.json({ success: true, data: cases });
  } catch { res.status(500).json({ success: false, error: 'Could not load cases' }); }
};

export const handleGenerateCaseImage = async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug);
    if (!slug) return res.status(400).json({ success: false, error: 'Case slug is required' });

    const c = await prisma.cases.findUnique({ where: { slug } });
    if (!c) return res.status(404).json({ success: false, error: 'Case not found' });

    if (c.cover_image_data) {
      return res.json({ success: true, data: { cover_image_data: c.cover_image_data } });
    }

    const imageData = await generateCaseImage(c.title, c.short_synopsis);
    await prisma.cases.update({ where: { slug }, data: { cover_image_data: imageData } });

    res.json({ success: true, data: { cover_image_data: imageData } });
  } catch (error) {
    console.error('[handleGenerateCaseImage]', error);
    res.status(500).json({ success: false, error: 'Failed to generate case image' });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { caseId, hostUserId, hostDisplayName, settings: requestedSettings } = req.body;
    if (!hostUserId || !String(hostDisplayName || '').trim()) {
      return res.status(400).json({ success: false, error: 'Host identity is required' });
    }
    const host = await prisma.anonymous_users.findUnique({ where: { id: hostUserId } });
    if (!host || host.deleted_at) {
      return res.status(401).json({ success: false, error: 'Invalid anonymous identity' });
    }
    
    // Buscar o caso pelo slug
    const selectedCase = await prisma.cases.findUnique({ where: { slug: caseId } });
    if (!selectedCase) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const caseVersion = await prisma.case_versions.findFirst({
      where: { case_id: selectedCase.id },
      orderBy: { version_number: 'desc' }
    });

    if (!caseVersion) {
      return res.status(404).json({ success: false, error: 'Case version not found' });
    }

    const publicCode = generateRoomCode();
    const recoveryCode = crypto.randomBytes(4).toString('hex');
    const recoveryCodeHash = crypto.createHash('sha256').update(recoveryCode).digest('hex');

    // Cria a sala e o jogador (anfitrião) em uma transação
    const room = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.rooms.create({
        data: {
          public_code: publicCode,
          recovery_code_hash: recoveryCodeHash,
          host_user_id: hostUserId,
          case_version_id: caseVersion.id,
          status: 'LOBBY',
           settings: JSON.stringify({
             turn_order_mode: "random_fixed",
             vote_rule: "simple_majority",
             turn_timer_seconds: [null, 30, 60, 90].includes(requestedSettings?.turn_timer_seconds) ? requestedSettings.turn_timer_seconds : null,
             hint_mode: 'progressive'
           }),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      await tx.room_players.create({
        data: {
          room_id: newRoom.id,
          anonymous_user_id: hostUserId,
          display_name: host.default_display_name || String(hostDisplayName).trim().slice(0, 32) || 'Anfitrião',
          is_host: true,
          connection_status: 'CONNECTED',
          ready_status: 'READY'
        }
      });

      return newRoom;
    });

    res.json({
      success: true,
      roomId: room.id,
      publicCode: room.public_code,
      recoveryCode,
      inviteUrl: `/join?room=${room.public_code}`
    });
    await prisma.analytics_events.create({ data: { event_name: 'room_created', room_id: room.id, anonymous_hash: hashToken(hostUserId), payload: '{}' } }).catch(() => undefined);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { publicCode, userId, displayName } = req.body;
    const cleanCode = String(publicCode || '').replace(/\s/g, '').toUpperCase();
    const cleanName = String(displayName || '').trim().slice(0, 32);
    if (!userId || !cleanName || !/^[A-Z0-9]{6}$/.test(cleanCode)) {
      return res.status(400).json({ success: false, error: 'Invalid room code or player name' });
    }
    const user = await prisma.anonymous_users.findUnique({ where: { id: userId } });
    if (!user || user.deleted_at) return res.status(401).json({ success: false, error: 'Invalid anonymous identity' });

    const room = await prisma.rooms.findUnique({
      where: { public_code: cleanCode }
    });

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    if (room.status !== 'LOBBY') {
      return res.status(400).json({ success: false, error: 'Game already started' });
    }
    if (room.expires_at <= new Date()) {
      return res.status(410).json({ success: false, error: 'Room expired' });
    }

    // Check player count
    const playerCount = await prisma.room_players.count({
      where: { room_id: room.id, removed_at: null }
    });

    if (playerCount >= room.max_players) {
      return res.status(400).json({ success: false, error: 'Room is full' });
    }

    // Upsert player
    const player = await prisma.room_players.upsert({
      where: {
        room_id_anonymous_user_id: {
          room_id: room.id,
          anonymous_user_id: userId
        }
      },
      update: {
        display_name: user.default_display_name || cleanName,
        connection_status: 'CONNECTED',
        last_seen_at: new Date()
      },
      create: {
        room_id: room.id,
        anonymous_user_id: userId,
        display_name: user.default_display_name || cleanName,
        is_host: room.host_user_id === userId,
        connection_status: 'CONNECTED',
        ready_status: 'NOT_READY'
      }
    });

    res.json({
      success: true,
      data: {
        roomId: room.id,
        playerId: player.id,
        isHost: player.is_host
      }
    });
    await prisma.analytics_events.create({ data: { event_name: 'room_joined', room_id: room.id, anonymous_hash: hashToken(userId), payload: '{}' } }).catch(() => undefined);
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const recoverRoom = async (req: Request, res: Response) => {
  const { roomId, recoveryCode, userId } = req.body;
  if (!roomId || !recoveryCode || !userId) return res.status(400).json({ success: false, error: 'Recovery data is required' });
  try {
    const room = await prisma.rooms.findUnique({ where: { id: roomId } });
    const user = await prisma.anonymous_users.findUnique({ where: { id: userId } });
    if (!room || !user || room.deleted_at || room.expires_at <= new Date()) return res.status(404).json({ success: false, error: 'Room not found or expired' });
    const candidate = crypto.createHash('sha256').update(String(recoveryCode).trim()).digest('hex');
    if (candidate !== room.recovery_code_hash) return res.status(403).json({ success: false, error: 'Invalid recovery code' });
    await prisma.$transaction([
      prisma.rooms.update({ where: { id: roomId }, data: { host_user_id: userId } }),
      prisma.room_players.updateMany({ where: { room_id: roomId, is_host: true }, data: { is_host: false } }),
      prisma.room_players.upsert({ where: { room_id_anonymous_user_id: { room_id: roomId, anonymous_user_id: userId } }, update: { is_host: true, connection_status: 'CONNECTED' }, create: { room_id: roomId, anonymous_user_id: userId, display_name: user.default_display_name || 'Anfitrião', is_host: true, connection_status: 'CONNECTED', ready_status: 'READY' } })
    ]);
    res.json({ success: true, data: { roomId, isHost: true } });
  } catch { res.status(500).json({ success: false, error: 'Could not recover room' }); }
};
