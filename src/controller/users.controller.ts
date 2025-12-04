import { logger } from '../logger/logger';
import * as userService from '../services/users.service';
import type { Request, Response } from 'express';
import { CookieOptions } from 'express';
import { ApiResponse } from '../utils/api-response';
import { ApiError } from '../utils/api-errors';

const cookiesOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
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
    const { user, token } = await userService.register({ name, email, password, username });
    res.cookie('token', token, cookiesOptions);
    res.status(201).json(new ApiResponse(201, user, 'User registered successfully'));
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
    const { user, token } = await userService.login({ credential, password });
    res.cookie('token', token, cookiesOptions);
    res.status(200).json(new ApiResponse(200, user, 'User logged in successfully'));
  } catch (error) {
    logger.error(`Login error: ${(error as Error).message}`);
    throw new ApiError(500, 'Internal server error');
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await userService.logout(userId);
    res.clearCookie('token', cookiesOptions);
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    logger.error(`Logout error: ${(error as Error).message}`);
    throw new ApiError(500, 'Internal server error');
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await userService.getCurrentUser(userId);
    res.status(200).json(new ApiResponse(200, user, 'Current user retrieved successfully'));
  } catch (error) {
    logger.error(`Get current user error: ${(error as Error).message}`);
    throw new ApiError(500, 'Internal server error');
  }
};
