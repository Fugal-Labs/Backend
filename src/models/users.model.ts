import mongoose from 'mongoose';
import type { User } from '@/types/users.type';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { logger } from '@/logger/logger';

interface UserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  verifyRefreshToken(token: string): Promise<boolean>;
}

type UserModelType = mongoose.Model<User, Record<string, never>, UserMethods>;

const userSchema = new mongoose.Schema<User, UserModelType, UserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    // Authentication
    refreshToken: {
      type: String,
      required: false,
    },
    tokenVersion: {
      type: Number,
      required: true,
      default: 0,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },

    // Profile
    bio: {
      type: String,
      required: false,
    },
    avatar: {
      type: String, // URL
      required: false,
    },

    // Problems Stats
    solvedProblems: [
      {
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Problem',
          required: true,
        },
        solvedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
          required: true,
        },
      },
    ],

    // Course Stats
    enrolledCourses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
        enrolledAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
        progress: {
          type: Number,
          required: true,
          default: 0,
          min: 0,
          max: 100,
        },
        lastAccessedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  try {
    const payload = { _id: this._id, email: this.email, role: this.role };
    if (!process.env.ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined in environment variables');
    }
    const secret = process.env.ACCESS_TOKEN_SECRET;
    return jwt.sign(payload, secret, { expiresIn: '15m' });
  } catch (error: unknown) {
    logger.error(`Error generating access token: ${(error as Error).message}`);
    throw error;
  }
};

userSchema.methods.generateRefreshToken = function (): string {
  try {
    const payload = { _id: this._id, tokenVersion: this.tokenVersion };
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');
    }
    const secret = process.env.REFRESH_TOKEN_SECRET;
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  } catch (error: unknown) {
    logger.error(`Error generating refresh token: ${(error as Error).message}`);
    throw error;
  }
};

userSchema.methods.verifyRefreshToken = async function (token: string): Promise<boolean> {
  try {
    if (!process.env.REFRESH_TOKEN_SECRET) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables');
    }
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const decoded: any = jwt.verify(token, secret);
    if (decoded._id.toString() !== this._id.toString()) return false;
    if (decoded.tokenVersion !== this.tokenVersion) return false;
    return token === this.refreshToken;
  } catch (error: unknown) {
    logger.error(`Error verifying refresh token: ${(error as Error).message}`);
    throw error;
  }
};

userSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});

// Indexes (as per plan.md schema)
userSchema.index({ role: 1 });
userSchema.index({ refreshToken: 1 });

const UserModel = mongoose.model<User, UserModelType>('User', userSchema);

export default UserModel;
