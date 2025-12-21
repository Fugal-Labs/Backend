export interface SolvedProblem {
  problemId: string;
  solvedAt: Date;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EnrolledCourse {
  courseId: string;
  enrolledAt: Date;
  progress: number; // 0-100 percentage
  lastAccessedAt: Date;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: 'user' | 'admin';

  // Authentication
  refreshToken?: string;
  tokenVersion: number;

  // Profile
  bio?: string;
  avatar?: string; // URL

  // Problems Stats
  solvedProblems: SolvedProblem[];

  // Course Stats
  enrolledCourses: EnrolledCourse[];

  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  username: string;
}

export interface LoginData {
  credential: string;
  password: string;
}
