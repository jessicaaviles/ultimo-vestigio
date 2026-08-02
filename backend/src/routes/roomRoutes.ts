import express from 'express';
import { createRoom, joinRoom, leaveRoom, recoverRoom, listCases, handleGenerateCaseImage, getRoomFeedbackSummary } from '../controllers/roomController';

const router = express.Router();
router.get('/cases', listCases);
router.post('/cases/:slug/generate-image', handleGenerateCaseImage);

router.post('/rooms', createRoom);
router.get('/rooms/:roomId/feedback-summary', getRoomFeedbackSummary);
router.post('/rooms/join', joinRoom);
router.post('/rooms/:roomId/leave', leaveRoom);
router.post('/rooms/recover', recoverRoom);

export default router;
