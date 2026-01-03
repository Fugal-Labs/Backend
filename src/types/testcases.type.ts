import type mongoose from 'mongoose';
export type TestCaseType = 'sample' | 'hidden';

export interface TestCase {
  _id: string;

  problemId: mongoose.Types.ObjectId;

  type: TestCaseType; // 'sample' | 'hidden'

  input: string; // stdin input
  expectedOutput: string; // expected stdout

  // Execution limits
  timeLimit: number; 
  memoryLimit: number; 

  order: number; // execution order

  createdAt: Date;
  updatedAt: Date;
}
