import express from 'express';
import {
  acceptFriendInvitation,
  addFriend,
  declineFriendInvitation,
  listFriendInvitations,
  listFriends,
  removeFriend
} from '../controllers/friendController';

const router = express.Router();

router.get('/friends', listFriends);
router.get('/friends/invitations', listFriendInvitations);
router.post('/friends', addFriend);
router.post('/friends/:friendshipId/accept', acceptFriendInvitation);
router.post('/friends/:friendshipId/decline', declineFriendInvitation);
router.delete('/friends/:friendshipId', removeFriend);

export default router;
