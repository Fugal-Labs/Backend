import * as userController from '@/controller/users.controller';
import { Router } from 'express';
import { verifyAccessToken } from '@/middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Refresh token (no access token required, uses refresh token cookie)
router.post('/refresh', userController.refreshToken);

// Protected routes (require access token)
router.post('/logout', verifyAccessToken, userController.logoutUser);
router.post('/logout-all', verifyAccessToken, userController.logoutAllDevices);
router.get('/me', verifyAccessToken, userController.getCurrentUser);

export default router;
