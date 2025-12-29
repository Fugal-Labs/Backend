import * as otpService from '@/services/otp.service';
import type { Request, Response } from 'express';
import { ApiResponse } from '@/utils/api-response';
import { ApiError } from '@/utils/api-errors';
import { asyncHandler } from '@/utils/asyncHandler';

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  let { email } = req.body;

  // Validate and sanitize input
  email = email?.trim().toLowerCase();

  if (!email) {
    throw new ApiError(400, 'Email is required to send OTP');
  }

  await otpService.sendOtpEmail(email);

  res
    .status(200)
    .json(new ApiResponse(200, null, 'OTP has been sent to the provided email address'));
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  let { email, otp } = req.body;

  // Validate and sanitize inputs
  email = email?.trim().toLowerCase();
  otp = otp?.trim();

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required for verification');
  }

  await otpService.verifyOtp(email, otp);

  res.status(200).json(new ApiResponse(200, null, 'OTP verified successfully'));
});
