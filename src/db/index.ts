import mongoose from 'mongoose';
import { ApiError } from '../utils/api-errors';

export const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error: any) {
    console.log('MongoDB connection failed:', error.message);
    throw new ApiError(500, 'MongoDB connection failed', [], error.stack);
  }
};
