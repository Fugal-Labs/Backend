
import mongoose from 'mongoose';
import type { TestCase } from '@/types/testcases.type';

type TestCaseModelType = mongoose.Model<TestCase,Record<string, never>>;

const testCaseSchema = new mongoose.Schema<TestCase, TestCaseModelType>(
  {
    problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'ProblemModel', 
    required: true,
    },

    type: {
      type: String,
      enum: ['sample', 'hidden'],
      required: true,
    },

    input: {
      type: String,
      required: true,
    },

    expectedOutput: {
      type: String,
      required: true,
    },

    timeLimit: {
      type: Number,
      required: true,
      default: 2000,
    },

    memoryLimit: {
      type: Number,
      required: true,
      default: 256, 
    },

    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index (IMPORTANT for performance)
testCaseSchema.index({ problemId: 1, type: 1, order: 1 });

const TestCaseModel = mongoose.model<TestCase, TestCaseModelType>(
  'TestCase',
  testCaseSchema
);

export default TestCaseModel;
