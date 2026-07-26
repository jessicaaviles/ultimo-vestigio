import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { hashToken } from '../security/secrets';
import { generateCaseImage } from '../services/caseImageGenerator';

const prisma = new PrismaClient();

const caseListSelect = {
  id: true,
  slug: true,
  title: true,
  short_synopsis: true,
  case_type: true,
  difficulty: true,
  estimated_duration_minutes: true,
  min_players: true,
  max_players: true,
  tension_level: true,
  status: true,
  created_at: true,
  updated_at: true
};

// Helper to generate a 6 character code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const listCases = async (req: Request, res: Response) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const userId = req.query.userId as string;
    const cases = await prisma.cases.findMany({
      where: { status: { in: ['PUBLISHED', 'published'] }, deleted_at: null },
      orderBy: { created_at: 'asc' },
      select: caseListSelect
    });
    cases.sort((a, b) => Number(b.slug === 'o-guarda-chuva-molhado') - Number(a.slug === 'o-guarda-chuva-molhado'));
    
    let solvedSlugs: string[] = [];
    let activeRoom: {
      roomId: string;
      status: string;
      case: typeof cases[number];
    } | null = null;

    if (userId) {
      const [solvedRooms, activeRoomRecord] = await Promise.all([
        prisma.room_players.findMany({
          where: {
            anonymous_user_id: userId,
            removed_at: null,
            room: {
              status: { in: ['COMPLETED', 'GAME_OVER'] },
              deleted_at: null
            }
          },
          select: {
            room: {
              select: {
                case_version: {
                  select: {
                    case_ref: { select: { slug: true } }
                  }
                }
              }
            }
          }
        }),
        prisma.rooms.findFirst({
          where: {
            status: { in: ['IN_PROGRESS', 'PAUSED', 'SOLVING', 'REVEAL'] },
            deleted_at: null,
            expires_at: { gt: new Date() },
            players: {
              some: {
                anonymous_user_id: userId,
                removed_at: null
              }
            }
          },
          select: {
            id: true,
            status: true,
            case_version: {
              select: {
                case_ref: { select: caseListSelect }
              }
            }
          },
          orderBy: { updated_at: 'desc' }
        })
      ]);

      solvedSlugs = Array.from(new Set(solvedRooms.map(rp => rp.room.case_version.case_ref.slug)));

      if (activeRoomRecord) {
        activeRoom = {
          roomId: activeRoomRecord.id,
          status: activeRoomRecord.status,
          case: activeRoomRecord.case_version.case_ref
        };
      }
    }

    res.json({ success: true, data: cases, solvedSlugs, activeRoom });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ success: false, error: 'Could not load cases' }); 
  }
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
             hint_mode: 'progressive',
             unlockedLocations: ['living_room'],
             unlockedClues: [],
             readReceipts: {},
             boardItems: [],
             connections: [],
             groups: [],
             timeline: [],
             finalVotes: {},
             version: 1
           }),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      await tx.room_players.create({
        data: {
          room_id: newRoom.id,
          anonymous_user_id: hostUserId,
          display_name: String(hostDisplayName).trim().slice(0, 32) || host.default_display_name || 'Anfitrião',
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
      where: { public_code: cleanCode },
      include: { players: { where: { removed_at: null }, select: { id: true, anonymous_user_id: true, turn_order: true } } }
    });

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const joinableStatuses = new Set(['LOBBY', 'IN_PROGRESS', 'PAUSED', 'SOLVING', 'REVEAL']);
    if (!joinableStatuses.has(room.status)) {
      return res.status(400).json({ success: false, error: 'Esta sala já foi encerrada.' });
    }
    if (room.expires_at <= new Date()) {
      return res.status(410).json({ success: false, error: 'Room expired' });
    }

    const existingActivePlayer = room.players.find((item) => item.anonymous_user_id === userId);
    if (!existingActivePlayer && room.players.length >= room.max_players) {
      return res.status(400).json({ success: false, error: 'Room is full' });
    }

    const isLobby = room.status === 'LOBBY';
    const nextTurnOrder = isLobby
      ? null
      : Math.max(-1, ...room.players.map((item) => item.turn_order ?? -1)) + 1;
    const existingPlayerRecord = await prisma.room_players.findUnique({
      where: {
        room_id_anonymous_user_id: {
          room_id: room.id,
          anonymous_user_id: userId
        }
      },
      select: { turn_order: true, removed_at: true }
    });
    const shouldAssignTurnOrder = !isLobby && (
      !existingPlayerRecord ||
      Boolean(existingPlayerRecord.removed_at) ||
      existingPlayerRecord.turn_order === null ||
      existingPlayerRecord.turn_order === undefined
    );

    const player = await prisma.room_players.upsert({
      where: {
        room_id_anonymous_user_id: {
          room_id: room.id,
          anonymous_user_id: userId
        }
      },
      update: {
        display_name: cleanName || user.default_display_name || 'Investigador',
        connection_status: 'CONNECTED',
        ready_status: isLobby && room.host_user_id !== userId ? 'NOT_READY' : 'READY',
        ...(shouldAssignTurnOrder ? { turn_order: nextTurnOrder } : {}),
        removed_at: null,
        left_at: null,
        last_seen_at: new Date()
      },
      create: {
        room_id: room.id,
        anonymous_user_id: userId,
        display_name: cleanName || user.default_display_name || 'Investigador',
        is_host: room.host_user_id === userId,
        connection_status: 'CONNECTED',
        ready_status: isLobby && room.host_user_id !== userId ? 'NOT_READY' : 'READY',
        turn_order: nextTurnOrder
      }
    });

    res.json({
      success: true,
      data: {
        roomId: room.id,
        playerId: player.id,
        isHost: player.is_host,
        status: room.status
      }
    });
    await prisma.analytics_events.create({ data: { event_name: 'room_joined', room_id: room.id, anonymous_hash: hashToken(userId), payload: '{}' } }).catch(() => undefined);
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const leaveRoom = async (req: Request, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
    const { userId } = req.body;
    if (!roomId || !userId) return res.status(400).json({ success: false, error: 'Room and user are required' });

    const room = await prisma.rooms.findUnique({
      where: { id: roomId },
      include: { players: { where: { removed_at: null }, orderBy: { joined_at: 'asc' } } },
    });
    if (!room || room.deleted_at) return res.status(404).json({ success: false, error: 'Room not found' });
    if (room.status !== 'LOBBY') return res.status(400).json({ success: false, error: 'Só é possível sair de uma sala antes da investigação começar.' });

    const player = room.players.find((item) => item.anonymous_user_id === String(userId));
    if (!player) return res.status(404).json({ success: false, error: 'Jogador não está nesta sala.' });

    const now = new Date();
    const remainingPlayers = room.players.filter((item) => item.id !== player.id);
    await prisma.$transaction(async (tx) => {
      await tx.room_players.update({
        where: { id: player.id },
        data: {
          is_host: false,
          ready_status: 'NOT_READY',
          connection_status: 'DISCONNECTED',
          left_at: now,
          removed_at: now,
          last_seen_at: now,
        },
      });

      if (remainingPlayers.length === 0) {
        await tx.rooms.update({ where: { id: room.id }, data: { status: 'CANCELLED', deleted_at: now } });
        return;
      }

      if (room.host_user_id === String(userId)) {
        const successor = remainingPlayers[0];
        await tx.rooms.update({ where: { id: room.id }, data: { host_user_id: successor.anonymous_user_id } });
        await tx.room_players.update({ where: { id: successor.id }, data: { is_host: true, ready_status: 'READY' } });
      }
    });

    await prisma.analytics_events.create({ data: { event_name: 'room_left', room_id: room.id, anonymous_hash: hashToken(String(userId)), payload: '{}' } }).catch(() => undefined);
    res.json({ success: true, roomClosed: remainingPlayers.length === 0 });
  } catch (error) {
    console.error('Error leaving room:', error);
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
