import { logger } from '@/logger/logger';
import UserModel from '@/models/users.model';
import type { RegistrationData, User, LoginData } from '@/types/users.type';
import { verifyOtp } from './otp.service';
import { ApiError } from '@/utils/api-errors';

export const register = async (
  userData: RegistrationData
): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  const existingUser = await UserModel.findOne({ email: userData.email });
  if (existingUser) {
    logger.warn(`Registration attempt with existing email: ${userData.email}`);
    throw new ApiError(409, 'User with this email already exists');
  }

  // Verify OTP before proceeding with registration
  await verifyOtp(userData.email, userData.otp);

  const newUser = new UserModel(userData);
  await newUser.save();
  logger.info(`New user registered: ${newUser.email}`);

  // Generate both tokens
  const accessToken = newUser.generateAccessToken();
  const refreshToken = newUser.generateRefreshToken();

  // Store refresh token in database
  newUser.refreshToken = refreshToken;
  await newUser.save();

  logger.info(`Tokens generated for user: ${newUser.email}`);
  return { user: newUser, accessToken, refreshToken };
};

export const login = async (
  userData: LoginData
): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  const user = await UserModel.findOne({
    $or: [{ email: userData.credential }, { username: userData.credential }],
  });
  if (!user) {
    logger.warn(`Login attempt with non-existing email or username: ${userData.credential}`);
    throw new ApiError(401, 'Invalid email or username');
  }
  const isPasswordValid = await user.isPasswordCorrect(userData.password);
  if (!isPasswordValid) {
    logger.warn(`Invalid password attempt for credential: ${userData.credential}`);
    throw new ApiError(401, 'Wrong password');
  }

  // Generate both tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in database
  user.refreshToken = refreshToken;
  await user.save();

  logger.info(`User logged in: ${userData.credential}`);
  return { user, accessToken, refreshToken };
};

export const logout = async (userId: string): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    logger.warn(`Logout attempt for non-existing user ID: ${userId}`);
    throw new ApiError(404, 'User not found');
  }
  // Remove refresh token from database
  user.refreshToken = undefined;
  await user.save();
  logger.info(`User logged out: ${user.email}`);
};

export const getCurrentUser = async (userId: string): Promise<User> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    logger.warn(`Get current user attempt for non-existing user ID: ${userId}`);
    throw new ApiError(404, 'User not found');
  }
  return user;
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await UserModel.findOne({ refreshToken });
  if (!user) {
    logger.warn('Refresh token not found in database');
    throw new ApiError(404, 'Invalid refresh token');
  }

  // Verify the refresh token
  const isValid = await user.verifyRefreshToken(refreshToken);
  if (!isValid) {
    logger.warn(`Invalid refresh token for user: ${user.email}`);
    throw new ApiError(404, 'Invalid refresh token');
  }

  // Generate new tokens (token rotation)
  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  // Store new refresh token in database
  user.refreshToken = newRefreshToken;
  await user.save();

  logger.info(`Tokens refreshed for user: ${user.email}`);
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutAll = async (userId: string): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    logger.warn(`Logout all attempt for non-existing user ID: ${userId}`);
    throw new ApiError(404, 'User not found');
  }

  // Increment token version to invalidate all refresh tokens
  user.tokenVersion += 1;
  user.refreshToken = undefined;
  await user.save();

  logger.info(`User logged out from all devices: ${user.email}`);
};
