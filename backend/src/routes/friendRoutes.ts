import express from 'express';
import { addFriend, listFriends, removeFriend } from '../controllers/friendController';

const router = express.Router();

router.get('/friends', listFriends);
router.post('/friends', addFriend);
router.delete('/friends/:friendshipId', removeFriend);

export default router;
