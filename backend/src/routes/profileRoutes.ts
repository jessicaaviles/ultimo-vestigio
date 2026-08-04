import express from 'express';
import { checkAliasAvailability, completeOnboarding, deleteProfile, getProfile, resetCaseProgress, resetPortraitGenerations, updateProfile } from '../controllers/profileController';

const router = express.Router();
router.get('/profiles/:userId', getProfile);
router.get('/profiles/:userId/alias/check', checkAliasAvailability);
router.put('/profiles/:userId', updateProfile);
router.delete('/profiles/:userId', deleteProfile);
router.post('/profiles/:userId/onboarding-complete', completeOnboarding);
router.post('/profiles/:userId/reset-portrait-generations', resetPortraitGenerations);
router.post('/profiles/:userId/cases/:caseSlug/reset-progress', resetCaseProgress);
export default router;
