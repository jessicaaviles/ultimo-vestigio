import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeLookup = (value: unknown) => String(value || '').trim().toLowerCase();

const publicFriend = async (viewerId: string, friend: any, friendship: any) => {
  const [playedRoomsCount, correctTheoriesCount] = await Promise.all([
    prisma.room_players.count({
      where: {
        anonymous_user_id: friend.id,
        room: { status: { in: ['COMPLETED', 'GAME_OVER'] }, deleted_at: null }
      }
    }),
    prisma.theory_evaluations.count({
      where: {
        theory: { player: { anonymous_user_id: friend.id }, room: { deleted_at: null } },
        result: 'CORRECT'
      }
    })
  ]);

  return {
    id: friendship.id,
    userId: friend.id,
    name: friend.default_display_name || 'Investigador',
    email: friend.email || '',
    handle: friend.email ? `@${friend.email.split('@')[0]}` : `@${String(friend.default_display_name || 'investigador').toLowerCase().replace(/\s+/g, '')}`,
    avatar: friend.generated_profile_photo_data || friend.profile_photo_data || null,
    status: 'online',
    isRequester: friendship.requester_id === viewerId,
    stats: {
      casesSolved: playedRoomsCount,
      correctTheories: correctTheoriesCount
    },
    achievements: [
      ...(playedRoomsCount > 0 ? ['Primeiro caso'] : []),
      ...(correctTheoriesCount > 0 ? ['Dedução correta'] : [])
    ],
    createdAt: friendship.created_at
  };
};

export const listFriends = async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).json({ success: false, error: 'User is required' });

    const user = await prisma.anonymous_users.findUnique({ where: { id: userId } });
    if (!user || user.deleted_at) return res.status(404).json({ success: false, error: 'User not found' });

    const friendships = await prisma.anonymous_user_friendships.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requester_id: userId }, { addressee_id: userId }],
        requester: { deleted_at: null },
        addressee: { deleted_at: null }
      },
      include: { requester: true, addressee: true },
      orderBy: { created_at: 'desc' }
    });

    const friends = await Promise.all(friendships.map((friendship) => {
      const friend = friendship.requester_id === userId ? friendship.addressee : friendship.requester;
      return publicFriend(userId, friend, friendship);
    }));

    res.json({ success: true, data: { friends } });
  } catch (error) {
    console.error('Error listing friends:', error);
    res.status(500).json({ success: false, error: 'Could not list friends' });
  }
};

export const addFriend = async (req: Request, res: Response) => {
  try {
    const userId = String(req.body.userId || '');
    const lookup = normalizeLookup(req.body.lookup);
    if (!userId || !lookup) return res.status(400).json({ success: false, error: 'User and friend lookup are required' });

    const requester = await prisma.anonymous_users.findUnique({ where: { id: userId } });
    if (!requester || requester.deleted_at) return res.status(404).json({ success: false, error: 'User not found' });

    const addressee = await prisma.anonymous_users.findFirst({
      where: {
        deleted_at: null,
        OR: [
          { id: lookup },
          { email: lookup },
          { default_display_name: { equals: lookup, mode: 'insensitive' } }
        ]
      }
    });

    if (!addressee) {
      return res.status(404).json({ success: false, error: 'Nenhum jogador encontrado com esse e-mail, ID ou nome.' });
    }
    if (addressee.id === userId) {
      return res.status(400).json({ success: false, error: 'Você não pode adicionar a si mesma.' });
    }

    const requesterId = userId < addressee.id ? userId : addressee.id;
    const addresseeId = userId < addressee.id ? addressee.id : userId;
    const friendship = await prisma.anonymous_user_friendships.upsert({
      where: { requester_id_addressee_id: { requester_id: requesterId, addressee_id: addresseeId } },
      update: { status: 'ACCEPTED' },
      create: { requester_id: requesterId, addressee_id: addresseeId, status: 'ACCEPTED' },
      include: { requester: true, addressee: true }
    });

    const friend = friendship.requester_id === userId ? friendship.addressee : friendship.requester;
    res.json({ success: true, data: { friend: await publicFriend(userId, friend, friendship) } });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ success: false, error: 'Could not add friend' });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = String(req.body.userId || req.query.userId || '');
    const friendshipId = String(req.params.friendshipId || '');
    if (!userId || !friendshipId) return res.status(400).json({ success: false, error: 'User and friendship are required' });

    const friendship = await prisma.anonymous_user_friendships.findUnique({ where: { id: friendshipId } });
    if (!friendship || (friendship.requester_id !== userId && friendship.addressee_id !== userId)) {
      return res.status(404).json({ success: false, error: 'Friendship not found' });
    }

    await prisma.anonymous_user_friendships.delete({ where: { id: friendshipId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ success: false, error: 'Could not remove friend' });
  }
};
