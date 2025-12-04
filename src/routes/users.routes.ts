import * as userController from '../controller/users.controller.js';
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', authMiddleware, userController.logoutUser);
router.get('/me', authMiddleware, userController.getCurrentUser);

export default router;
