import mongoose, { model } from 'mongoose';
import type { Problem } from '@/types/problems.type';
import UserModel from '@/models/users.model';

//model type

type ProblemModelType = mongoose.Model<
  Problem,
  Record<string, never>
>;

// problem schema

const problemSchema = new mongoose.Schema<Problem, ProblemModelType>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    examples: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String, required: true },
      },
    ],

    constraints: {
      type: String,
      required: true,
    },

    tags: {
      type: [String],
      required: true,
      default: [],
    },

    templates: {
      python: { type: String, required: true },
      java: { type: String, required: true },
      cpp: { type: String, required: true },
      c: { type: String, required: true },
    },

    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      required: true,
      default: 'draft',
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel',
      required: true, 
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel',
      required: true,
      default: null,
    },

    rejectionReason: {
      type: String,
      required: true,
    },

    totalSubmissions: {
      type: Number,
      required: true,
      default: 0,
    },

    acceptedSubmissions: {
      type: Number,
      required: true,
      default: 0,
    },

    acceptanceRate: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

//indexes
problemSchema.index({ slug: 1 }, { unique: true });
problemSchema.index({ status: 1, difficulty: 1 });
problemSchema.index({ tags: 1 });

// model
const ProblemModel = mongoose.model<Problem, ProblemModelType>(
  'Problem',
  problemSchema
);

export default ProblemModel;

