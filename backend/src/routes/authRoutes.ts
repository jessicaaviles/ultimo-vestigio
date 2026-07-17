import express from 'express';
import { register, login, linkProfile, validateToken, logout, googleLogin } from '../controllers/authController';

const router = express.Router();
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/link', linkProfile);
router.post('/auth/validate', validateToken);
router.post('/auth/logout', logout);
router.post('/auth/google', googleLogin);
export default router;
