import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeLookup = (value: unknown) => String(value || '').trim().toLowerCase();

const baseFriendData = (friend: any) => ({
  name: friend.default_display_name || 'Investigador',
  email: friend.email || '',
  handle: friend.email
    ? `@${friend.email.split('@')[0]}`
    : `@${String(friend.default_display_name || 'investigador').toLowerCase().replace(/\s+/g, '')}`,
  avatar: friend.generated_profile_photo_data || friend.profile_photo_data || null
});

const buildFriendStats = async (friendId: string) => {
  const [playedRoomsCount, correctTheoriesCount] = await Promise.all([
    prisma.room_players.count({
      where: {
        anonymous_user_id: friendId,
        room: { status: { in: ['COMPLETED', 'GAME_OVER'] }, deleted_at: null }
      }
    }),
    prisma.theory_evaluations.count({
      where: {
        theory: { player: { anonymous_user_id: friendId }, room: { deleted_at: null } },
        result: 'CORRECT'
      }
    })
  ]);

  return {
    casesSolved: playedRoomsCount,
    correctTheories: correctTheoriesCount
  };
};

const publicFriendship = async (viewerId: string, friendship: any, mode: 'friend' | 'invite') => {
  const friend = friendship.requester_id === viewerId ? friendship.addressee : friendship.requester;
  const stats = await buildFriendStats(friend.id);

  return {
    id: friendship.id,
    userId: friend.id,
    ...baseFriendData(friend),
    status: 'online',
    isRequester: friendship.requester_id === viewerId,
    friendshipStatus: friendship.status,
    direction: friendship.requester_id === viewerId ? 'outgoing' : 'incoming',
    stats,
    achievements: [
      ...(stats.casesSolved > 0 ? ['Primeiro caso'] : []),
      ...(stats.correctTheories > 0 ? ['Dedução correta'] : [])
    ],
    pending: mode === 'invite' ? friendship.status === 'PENDING' : false,
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
        requester: { is: { deleted_at: null } },
        addressee: { is: { deleted_at: null } }
      },
      include: { requester: true, addressee: true },
      orderBy: { created_at: 'desc' }
    });

    const friends = await Promise.all(friendships.map((friendship) => publicFriendship(userId, friendship, 'friend')));

    res.json({ success: true, data: { friends } });
  } catch (error) {
    console.error('Error listing friends:', error);
    res.status(500).json({ success: false, error: 'Could not list friends' });
  }
};

export const listFriendInvitations = async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).json({ success: false, error: 'User is required' });

    const user = await prisma.anonymous_users.findUnique({ where: { id: userId } });
    if (!user || user.deleted_at) return res.status(404).json({ success: false, error: 'User not found' });

    const invitations = await prisma.anonymous_user_friendships.findMany({
      where: {
        status: 'PENDING',
        OR: [{ requester_id: userId }, { addressee_id: userId }],
        requester: { is: { deleted_at: null } },
        addressee: { is: { deleted_at: null } }
      },
      include: { requester: true, addressee: true },
      orderBy: { created_at: 'desc' }
    });

    const data = await Promise.all(invitations.map((friendship) => publicFriendship(userId, friendship, 'invite')));
    res.json({ success: true, data: { invitations: data } });
  } catch (error) {
    console.error('Error listing invitations:', error);
    res.status(500).json({ success: false, error: 'Could not list invitations' });
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

    const outgoing = await prisma.anonymous_user_friendships.findUnique({
      where: {
        requester_id_addressee_id: {
          requester_id: userId,
          addressee_id: addressee.id
        }
      },
      include: { requester: true, addressee: true }
    });

    if (outgoing?.status === 'ACCEPTED') {
      return res.json({ success: true, data: { friend: await publicFriendship(userId, outgoing, 'friend') } });
    }

    if (outgoing?.status === 'PENDING') {
      return res.json({ success: true, data: { invitation: await publicFriendship(userId, outgoing, 'invite') } });
    }

    const incoming = await prisma.anonymous_user_friendships.findUnique({
      where: {
        requester_id_addressee_id: {
          requester_id: addressee.id,
          addressee_id: userId
        }
      },
      include: { requester: true, addressee: true }
    });

    if (incoming?.status === 'ACCEPTED') {
      return res.json({ success: true, data: { friend: await publicFriendship(userId, incoming, 'friend') } });
    }

    if (incoming?.status === 'PENDING') {
      const accepted = await prisma.anonymous_user_friendships.update({
        where: { id: incoming.id },
        data: { status: 'ACCEPTED' },
        include: { requester: true, addressee: true }
      });
      return res.json({ success: true, data: { friend: await publicFriendship(userId, accepted, 'friend') } });
    }

    const invitation = await prisma.anonymous_user_friendships.create({
      data: { requester_id: userId, addressee_id: addressee.id, status: 'PENDING' },
      include: { requester: true, addressee: true }
    });

    res.json({ success: true, data: { invitation: await publicFriendship(userId, invitation, 'invite') } });
  } catch (error) {
    console.error('Error adding friend:', error);
    res.status(500).json({ success: false, error: 'Could not add friend' });
  }
};

export const acceptFriendInvitation = async (req: Request, res: Response) => {
  try {
    const userId = String(req.body.userId || req.query.userId || '');
    const friendshipId = String(req.params.friendshipId || '');
    if (!userId || !friendshipId) return res.status(400).json({ success: false, error: 'User and invitation are required' });

    const invitation = await prisma.anonymous_user_friendships.findUnique({
      where: { id: friendshipId },
      include: { requester: true, addressee: true }
    });

    if (!invitation || invitation.status !== 'PENDING' || invitation.addressee_id !== userId) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    const accepted = await prisma.anonymous_user_friendships.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
      include: { requester: true, addressee: true }
    });

    res.json({ success: true, data: { friend: await publicFriendship(userId, accepted, 'friend') } });
  } catch (error) {
    console.error('Error accepting friend invitation:', error);
    res.status(500).json({ success: false, error: 'Could not accept invitation' });
  }
};

export const declineFriendInvitation = async (req: Request, res: Response) => {
  try {
    const userId = String(req.body.userId || req.query.userId || '');
    const friendshipId = String(req.params.friendshipId || '');
    if (!userId || !friendshipId) return res.status(400).json({ success: false, error: 'User and invitation are required' });

    const invitation = await prisma.anonymous_user_friendships.findUnique({ where: { id: friendshipId } });
    if (!invitation || invitation.status !== 'PENDING' || (invitation.requester_id !== userId && invitation.addressee_id !== userId)) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    await prisma.anonymous_user_friendships.delete({ where: { id: friendshipId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error declining friend invitation:', error);
    res.status(500).json({ success: false, error: 'Could not decline invitation' });
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
