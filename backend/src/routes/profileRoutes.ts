import express from 'express';
import { deleteProfile, getProfile, resetCaseProgress, updateProfile } from '../controllers/profileController';

const router = express.Router();
router.get('/profiles/:userId', getProfile);
router.put('/profiles/:userId', updateProfile);
router.delete('/profiles/:userId', deleteProfile);
router.post('/profiles/:userId/cases/:caseSlug/reset-progress', resetCaseProgress);
export default router;
