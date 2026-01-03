import mongoose from 'mongoose';
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
        explanation: { type: String },
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

     submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel',
      required: true, 
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel',
      default: null, 
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

  
    rejectionReason: {
      type: String,
      required: true,
    },

    totalSubmissions: {
      type: Number,
      required: true,
      
    },

    acceptedSubmissions: {
      type: Number,
      required: true,
    },
  },
   {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//acceptance rate 

problemSchema.virtual("acceptanceRate").get(function () {
  if (this.totalSubmissions === 0) return 0;

  return (this.acceptedSubmissions / this.totalSubmissions) * 100;
});

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

