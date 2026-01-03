import mongoose from 'mongoose';
import type { Submission, TestResult } from '@/types/submission.type';

type SubmissionModelType = mongoose.Model<Submission>;

// Schema for each test result
const testResultSchema = new mongoose.Schema<TestResult>(
  {
    testCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCaseModel',
      required: true,
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'error', 'timeout'],
      required: true,
    },
    executionTime: { type: Number, required: true },
    actualOutput: { type: String },
    expectedOutput: { type: String },
    errorMessage: { type: String },
  },
  { _id: false } // 
);

//  Submission schema
const submissionSchema = new mongoose.Schema<Submission, SubmissionModelType>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserModel',
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProblemModel',
      required: true,
    },
    language: {
      type: String,
      enum: ['python', 'java', 'cpp', 'c'],
      required: true,
    },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'wrong_answer',
        'time_limit_exceeded',
        'memory_limit_exceeded',
        'compilation_error',
        'runtime_error',
      ],
      required: true,
    },
    executionTime: { type: Number, required: true },
    memoryUsed: { type: Number, required: true },
    testResults: { type: [testResultSchema], required: true, default: [] },
    firstFailedTestCase: { type: Number, default: null },
    submittedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

//  Indexes
submissionSchema.index({ userId: 1, problemId: 1, submittedAt: -1 });
submissionSchema.index({ problemId: 1, status: 1 });

// Submission Model
const SubmissionModel = mongoose.model<Submission, SubmissionModelType>(
  'Submission',
  submissionSchema
);

export default SubmissionModel;
