import mongoose from 'mongoose';
import type { User } from '../types/users.type';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface UserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAuthToken(): string;
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
    token: {
      type: String,
      required: false,
    },
    avatarUrl: {
      type: String,
      required: false,
    },
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

userSchema.methods.generateAuthToken = function (): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  const token = jwt.sign({ _id: this._id, email: this.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  this.token = token;
  return token;
};

userSchema.methods.isPasswordCorrect = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.password;
    delete ret.token;
    delete ret.__v;
    return ret;
  },
});

const UserModel = mongoose.model<User, UserModelType>('User', userSchema);

export default UserModel;
