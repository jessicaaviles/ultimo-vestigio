import express from 'express';
import { deleteProfile, getProfile, updateProfile } from '../controllers/profileController';

const router = express.Router();
router.get('/profiles/:userId', getProfile);
router.put('/profiles/:userId', updateProfile);
router.delete('/profiles/:userId', deleteProfile);
export default router;
