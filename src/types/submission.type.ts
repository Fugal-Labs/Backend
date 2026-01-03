import type mongoose from 'mongoose';

// Each test result for a submission
export interface TestResult {
  testCaseId: mongoose.Types.ObjectId;  // reference to TestCase
  status: 'passed' | 'failed' | 'error' | 'timeout'; // result of this test case
  executionTime: number;                // milliseconds taken by this test case

  // Only for sample tests or errors
  actualOutput?: string;
  expectedOutput?: string;
  errorMessage?: string;
}

// Main Submission document
export interface Submission {
  _id: string;

  userId: mongoose.Types.ObjectId;     
  problemId: mongoose.Types.ObjectId;  

  language: 'python' | 'java' | 'cpp' | 'c'; 
  code: string;                              

  // Execution results
  status: 'pending' | 'accepted' | 'wrong_answer' | 
          'time_limit_exceeded' | 'memory_limit_exceeded' | 
          'compilation_error' | 'runtime_error';
  executionTime: number;  
  memoryUsed: number;    

  testResults: TestResult[];

  firstFailedTestCase?: number | null;

  submittedAt: Date; 
}
