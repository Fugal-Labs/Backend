import type mongoose from 'mongoose';

// ✅ Each test result for a submission
export interface TestResult {
  testCaseId: mongoose.Types.ObjectId;  // reference to TestCase
  status: 'passed' | 'failed' | 'error' | 'timeout'; // result of this test case
  executionTime: number;                // milliseconds taken by this test case

  // Only for sample tests or errors
  actualOutput?: string;
  expectedOutput?: string;
  errorMessage?: string;
}

// ✅ Main Submission document
export interface Submission {
  _id: string;

  userId: mongoose.Types.ObjectId;     // ref to User who submitted
  problemId: mongoose.Types.ObjectId;  // ref to Problem submitted against

  language: 'python' | 'java' | 'cpp' | 'c'; // language used
  code: string;                              // full source code

  // Execution results
  status: 'pending' | 'accepted' | 'wrong_answer' | 
          'time_limit_exceeded' | 'memory_limit_exceeded' | 
          'compilation_error' | 'runtime_error';
  executionTime: number; // milliseconds (max across all tests)
  memoryUsed: number;    // MB (max across all tests)

  testResults: TestResult[]; // detailed results for test cases

  firstFailedTestCase?: number | null; // 1-indexed, null if all passed

  submittedAt: Date; // timestamp
}
