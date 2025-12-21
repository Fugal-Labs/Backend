import { logger } from '../logger/logger.js';
import * as userService from '../services/users.service.js';
import type { Request, Response } from 'express';
import { CookieOptions } from 'express';
import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-errors.js';

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

export const registerUser = async (req: Request, res: Response) => {
  try {
    let { name, email, password, username } = req.body;
    name = name.trim();
    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();
    password = password.trim();

    if (!name || !email || !password || !username) {
      logger.error('Registration failed: Missing required fields');
      throw new ApiError(400, 'Name, username, email, and password are required');
    }
    const { user, accessToken, refreshToken } = await userService.register({
      name,
      email,
      password,
      username,
    });

    // Set both tokens as HTTP-only cookies
    res.cookie('accessToken', accessToken, accessTokenOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);

    res
      .status(201)
      .json(new ApiResponse(201, { user, accessToken }, 'User registered successfully'));
  } catch (error) {
    logger.error(`Registration error: ${(error as Error).message}`);
    throw new ApiError(500, 'Internal server error');
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    let { credential, password } = req.body;
    credential = credential.trim().toLowerCase();
    password = password.trim();
    if (!credential || !password) {
      logger.error('Login failed: Missing credential or password');
      throw new ApiError(400, 'Credential and password are required');
    }
    const { user, accessToken, refreshToken } = await userService.login({ credential, password });

    // Set both tokens as HTTP-only cookies
    res.cookie('accessToken', accessToken, accessTokenOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);

    res
      .status(200)
      .json(new ApiResponse(200, { user, accessToken }, 'User logged in successfully'));
  } catch (error) {
    logger.error(`Login error: ${(error as Error).message}`);
    throw new ApiError(500, 'Internal server error');
  }
};
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    await userService.logout(userId);

    // Clear both cookies
    res.clearCookie('accessToken', accessTokenOptions);
    res.clearCookie('refreshToken', refreshTokenOptions);

    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    logger.error(`Logout error: ${(error as Error).message}`);
    throw new ApiError(500, 'Internal server error');
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    const user = await userService.getCurrentUser(userId);
    res.status(200).json(new ApiResponse(200, user, 'Current user retrieved successfully'));
  } catch (error) {
    logger.error(`Get current user error: ${(error as Error).message}`);
    throw new ApiError(500, 'Internal server error');
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    logger.error(`Refresh token error: ${(error as Error).message}`);
    throw new ApiError(401, 'Invalid refresh token');
  }
};

export const logoutAllDevices = async (req: Request, res: Response) => {
  try {
    const userId = req.user!._id;
    await userService.logoutAll(userId);

    // Clear both cookies
    res.clearCookie('accessToken', accessTokenOptions);
    res.clearCookie('refreshToken', refreshTokenOptions);

    res.status(200).json(new ApiResponse(200, null, 'Logged out from all devices successfully'));
  } catch (error) {
    logger.error(`Logout all error: ${(error as Error).message}`);
    throw new ApiError(500, 'Internal server error');
  }
};
