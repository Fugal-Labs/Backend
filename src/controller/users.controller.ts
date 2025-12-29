import * as userService from '@/services/users.service';
import type { Request, Response } from 'express';
import { CookieOptions } from 'express';
import { ApiResponse } from '@/utils/api-response';
import { ApiError } from '@/utils/api-errors';
import { asyncHandler } from '@/utils/asyncHandler';

const accessTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshTokenOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  let { name, email, password, username, otp } = req.body;

  // Validate and sanitize inputs
  name = name?.trim();
  username = username?.trim().toLowerCase();
  email = email?.trim().toLowerCase();
  password = password?.trim();
  otp = otp?.trim();

  if (!name || !email || !password || !username || !otp) {
    throw new ApiError(400, 'Name, username, email, password, and OTP are required');
  }

  const { user, accessToken, refreshToken } = await userService.register({
    name,
    email,
    password,
    username,
    otp,
  });

  // Set both tokens as HTTP-only cookies
  res.cookie('accessToken', accessToken, accessTokenOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenOptions);

  res.status(201).json(new ApiResponse(201, { user, accessToken }, 'User registered successfully'));
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  let { credential, password } = req.body;

  // Validate and sanitize inputs
  credential = credential?.trim().toLowerCase();
  password = password?.trim();

  if (!credential || !password) {
    throw new ApiError(400, 'Credential and password are required');
  }

  const { user, accessToken, refreshToken } = await userService.login({ credential, password });

  // Set both tokens as HTTP-only cookies
  res.cookie('accessToken', accessToken, accessTokenOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenOptions);

  res.status(200).json(new ApiResponse(200, { user, accessToken }, 'User logged in successfully'));
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  await userService.logout(userId);

  // Clear both cookies
  res.clearCookie('accessToken', accessTokenOptions);
  res.clearCookie('refreshToken', refreshTokenOptions);

  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const user = await userService.getCurrentUser(userId);
  res.status(200).json(new ApiResponse(200, user, 'Current user retrieved successfully'));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await userService.refreshAccessToken(refreshToken);

  // Set new tokens as HTTP-only cookies
  res.cookie('accessToken', accessToken, accessTokenOptions);
  res.cookie('refreshToken', newRefreshToken, refreshTokenOptions);

  res.status(200).json(new ApiResponse(200, { accessToken }, 'Token refreshed successfully'));
});

export const logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  await userService.logoutAll(userId);

  // Clear both cookies
  res.clearCookie('accessToken', accessTokenOptions);
  res.clearCookie('refreshToken', refreshTokenOptions);

  res.status(200).json(new ApiResponse(200, null, 'Logged out from all devices successfully'));
});
