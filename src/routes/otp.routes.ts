import * as otpController from '@/controller/otp.controller';
import { ipRateLimiter } from '@/middlewares/ipRateLimitter';
import { Router } from 'express';

const router = Router();

router.use(ipRateLimiter);

router.post('/send', otpController.sendOtp);
router.post('/verify', otpController.verifyOtp);

export default router;
