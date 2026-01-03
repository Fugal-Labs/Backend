
  //  Example shown to users

export interface ProblemExample {
  input: string;
  output: string;
  explanation: string;
}


  //  Code templates for each language

export interface ProblemTemplates {
  python: string;
  java: string;
  cpp: string;
  c: string;
}


  //  Main Problem Interface

export interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;

  examples: ProblemExample[];
  constraints: string;
  tags: string[];

  templates: ProblemTemplates;

  status: 'draft' | 'pending' | 'approved' | 'rejected';
  submittedBy?: string;     // User _id
  approvedBy?: string;      // User _id
  rejectionReason: string;

  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;

  createdAt: Date;
  updatedAt: Date;
}
