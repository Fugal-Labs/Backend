import { logger } from '../logger/logger.js';
import UserModel from '../models/users.model.js';
import type { RegistrationData, User, LoginData } from '../types/users.type.js';

export const register = async (
  userData: RegistrationData
): Promise<{ user: User; token: string }> => {
  const existingUser = await UserModel.findOne({ email: userData.email });
  if (existingUser) {
    logger.warn(`Registration attempt with existing email: ${userData.email}`);
    throw new Error('User with this email already exists');
  }
  const newUser = new UserModel(userData);
  await newUser.save();
  logger.info(`New user registered: ${newUser.email}`);
  const token = newUser.generateAuthToken();
  await newUser.save();
  logger.info(`Token generated for user: ${newUser.email}`);
  return { user: newUser, token };
};

export const login = async (userData: LoginData): Promise<{ user: User; token: string }> => {
  const user = await UserModel.findOne({
    $or: [{ email: userData.credential }, { username: userData.credential }],
  });
  if (!user) {
    logger.warn(`Login attempt with non-existing email or username: ${userData.credential}`);
    throw new Error('Invalid email or password');
  }
  const isPasswordValid = await user.isPasswordCorrect(userData.password);
  if (!isPasswordValid) {
    logger.warn(`Invalid password attempt for credential: ${userData.credential}`);
    throw new Error('Invalid email or password');
  }
  const token = user.generateAuthToken();
  await user.save();
  logger.info(`User logged in: ${userData.credential}`);
  return { user, token };
};

export const logout = async (userId: string): Promise<void> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    logger.warn(`Logout attempt for non-existing user ID: ${userId}`);
    throw new Error('User not found');
  }
  user.token = undefined;
  await user.save();
  logger.info(`User logged out: ${user.email}`);
};

export const getCurrentUser = async (userId: string): Promise<User> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    logger.warn(`Get current user attempt for non-existing user ID: ${userId}`);
    throw new Error('User not found');
  }
  return user;
};
