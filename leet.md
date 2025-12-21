# LeetCode-Style Practice Problems Feature

## Overview

This document outlines the implementation plan for a LeetCode-style coding practice platform integrated into the Fugal Labs application. The feature allows users to solve programming problems, submit code in multiple languages, and track their progress.

---

## Key Requirements & Decisions

### Core Features

- **100+ coding problems** with difficulty levels (Easy, Medium, Hard)
- **Multi-language support**: Python, Java, C++, C
- **Code execution** with test case validation
- **Public problem viewing** + **Authenticated submissions**
- **User progress tracking** (solved problems)
- **Submission history** per user per problem
- **Community problem submissions** with admin approval workflow
- **Rate limiting** to prevent abuse

### Technical Decisions

| Decision Point            | Choice                     | Rationale                                                                       |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| **Code Execution Engine** | Piston (self-hosted)       | Free/cheap, supports required languages, easy Docker deployment                 |
| **Deployment**            | Existing t3.small EC2      | Bootstrap phase with ~10 users, sufficient resources                            |
| **Test Case Visibility**  | Hide hidden test details   | LeetCode-style: only show "Wrong Answer on test case 5" without expected output |
| **Code Templates**        | Pre-filled                 | Provide function signatures for each language to guide users                    |
| **Rate Limiting**         | 5 submissions/min per user | Prevent abuse while allowing normal practice                                    |
| **Problem Sourcing**      | Community + Admin approval | Initial 100 problems seeded manually, future growth via community               |
| **Submission Storage**    | Full code stored           | Simplifies history display, acceptable for current scale                        |

---

## Database Schema

### 1. Problems Collection

```javascript
{
  _id: ObjectId,
  title: String,                    // "Two Sum"
  slug: String,                      // "two-sum" (unique, URL-friendly)
  difficulty: String,                // enum: ['easy', 'medium', 'hard']
  description: String,               // Full problem description (markdown supported)

  // Example test cases shown to users
  examples: [
    {
      input: String,                 // "nums = [2,7,11,15], target = 9"
      output: String,                // "[0,1]"
      explanation: String            // "Because nums[0] + nums[1] == 9..."
    }
  ],

  constraints: String,               // "1 <= nums.length <= 10^4"
  tags: [String],                    // ["array", "hash-table", "two-pointers"]

  // Pre-filled code templates for each language
  templates: {
    python: String,                  // "def twoSum(self, nums: List[int], target: int) -> List[int]:\n    pass"
    java: String,                    // "public int[] twoSum(int[] nums, int target) {\n    \n}"
    cpp: String,                     // "vector<int> twoSum(vector<int>& nums, int target) {\n    \n}"
    c: String                        // "int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    \n}"
  },

  // Approval workflow fields
  status: String,                    // enum: ['draft', 'pending', 'approved', 'rejected']
  submittedBy: ObjectId,             // ref: 'User' (null for admin-created problems)
  approvedBy: ObjectId,              // ref: 'User' (admin who approved)
  rejectionReason: String,           // Feedback if rejected

  // Metadata
  totalSubmissions: Number,          // Total submission count
  acceptedSubmissions: Number,       // Successful submission count
  acceptanceRate: Number,            // Calculated: (accepted/total) * 100

  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.problems.createIndex({ slug: 1 }, { unique: true });
db.problems.createIndex({ status: 1, difficulty: 1 });
db.problems.createIndex({ tags: 1 });
db.problems.createIndex({ submittedBy: 1 });
```

**Mongoose Model Location**: `Backend/src/models/problems.model.ts`

---

### 2. TestCases Collection

Separate collection for efficient querying and avoiding document size limits.

```javascript
{
  _id: ObjectId,
  problemId: ObjectId,               // ref: 'Problem'

  type: String,                      // enum: ['sample', 'hidden']
                                     // 'sample' = visible to users (2-3 cases)
                                     // 'hidden' = used for evaluation only (10-20 cases)

  // Input/output in stdin/stdout format
  input: String,                     // "[2,7,11,15]\n9"
  expectedOutput: String,            // "[0,1]"

  // Limits
  timeLimit: Number,                 // milliseconds (default: 2000)
  memoryLimit: Number,               // MB (default: 256)

  order: Number,                     // For ordering test cases

  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.testcases.createIndex({ problemId: 1, type: 1, order: 1 });
```

**Mongoose Model Location**: `Backend/src/models/testcases.model.ts`

---

### 3. Submissions Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                  // ref: 'User'
  problemId: ObjectId,               // ref: 'Problem'

  language: String,                  // enum: ['python', 'java', 'cpp', 'c']
  code: String,                      // Full source code submitted

  // Execution results
  status: String,                    // enum: ['pending', 'accepted', 'wrong_answer',
                                     //        'time_limit_exceeded', 'memory_limit_exceeded',
                                     //        'compilation_error', 'runtime_error']

  executionTime: Number,             // milliseconds (max across all test cases)
  memoryUsed: Number,                // MB (max across all test cases)

  // Detailed test case results
  testResults: [
    {
      testCaseId: ObjectId,          // ref: 'TestCase'
      status: String,                // 'passed' | 'failed' | 'error' | 'timeout'
      executionTime: Number,         // ms for this specific test
      memoryUsed: Number,            // MB for this specific test

      // Only populated for sample test cases or compilation/runtime errors
      actualOutput: String,          // What the code produced
      expectedOutput: String,        // What was expected (only for sample tests)
      errorMessage: String           // Compiler/runtime error details
    }
  ],

  // First failed test case (for hidden tests, don't reveal details)
  firstFailedTestCase: Number,       // Test case number (1-indexed) or null if all passed

  submittedAt: Date
}

// Indexes
db.submissions.createIndex({ userId: 1, problemId: 1, submittedAt: -1 });
db.submissions.createIndex({ problemId: 1, status: 1 });
db.submissions.createIndex({ userId: 1, submittedAt: -1 });
```

**Mongoose Model Location**: `Backend/src/models/submissions.model.ts`

---

### 4. Users Collection (Extensions)

Extend existing `users.model.ts` with new fields:

```javascript
{
  // ... existing user fields (email, password, etc.)

  // New fields for coding platform
  role: String,                      // enum: ['user', 'admin'], default: 'user'

  solvedProblems: [
    {
      problemId: ObjectId,           // ref: 'Problem'
      solvedAt: Date,                // When first accepted submission was made
      difficulty: String             // Cached for quick stats
    }
  ],

  // Stats (can be computed but cached for performance)
  stats: {
    totalSubmissions: Number,
    totalSolved: Number,
    easySolved: Number,
    mediumSolved: Number,
    hardSolved: Number
  }
}

// Additional Indexes
db.users.createIndex({ role: 1 });
db.users.createIndex({ 'solvedProblems.problemId': 1 });
```

**Note**: Add virtual field `totalSolved` that returns `solvedProblems.length`

---

## API Endpoints Design

### Public Endpoints (No Authentication Required)

```
GET /api/problems
  - Query params: ?difficulty=easy&tags=array&page=1&limit=20
  - Returns: List of approved problems (no test cases)
  - Response: { problems: [...], total: 150, page: 1, totalPages: 8 }

GET /api/problems/:slug
  - Returns: Full problem details with sample test cases and templates
  - Response: { problem: {...}, sampleTestCases: [...] }
```

### Authenticated Endpoints

```
POST /api/problems/:slug/submit
  - Rate Limited: 5 submissions/minute per user
  - Body: { language: 'python', code: '...' }
  - Process: Run sample tests → Run hidden tests → Update stats
  - Response: {
      status: 'accepted' | 'wrong_answer' | ...,
      testResults: [...],  // Full details for sample tests
      firstFailedTestCase: 5,  // Number only for hidden tests
      executionTime: 145,
      memoryUsed: 14.2
    }

GET /api/problems/:slug/submissions
  - Query params: ?page=1&limit=10
  - Returns: User's submission history for this problem
  - Response: { submissions: [...], total: 15 }

POST /api/problems/submit-problem
  - Rate Limited: 3 problems/hour per user
  - Body: { title, description, examples, constraints, tags, templates, testCases }
  - Creates problem with status='pending'
  - Response: { problemId, status: 'pending' }
```

### Admin Endpoints

```
GET /api/admin/problems/pending
  - Returns: All problems with status='pending'
  - Response: { problems: [...] }

PATCH /api/admin/problems/:id/approve
  - Updates status='approved', sets approvedBy
  - Response: { message: 'Problem approved' }

PATCH /api/admin/problems/:id/reject
  - Body: { reason: 'Insufficient test cases' }
  - Updates status='rejected', sets rejectionReason
  - Response: { message: 'Problem rejected' }

POST /api/admin/problems
  - Direct problem creation (bypass approval)
  - Body: { title, slug, difficulty, description, examples, templates, ... }
  - Response: { problemId }
```

---

## Implementation Roadmap

### Phase 1: Infrastructure Setup

1. **Deploy Piston on EC2**
   ```bash
   # SSH into t3.small EC2
   docker pull ghcr.io/engineer-man/piston
   docker run -d -p 2000:2000 --name piston ghcr.io/engineer-man/piston
   ```
2. **Update Environment Variables**
   - Add to `Backend/example.env`: `PISTON_API_URL=http://localhost:2000`
3. **Install Dependencies**
   ```bash
   cd Backend
   pnpm add express-rate-limit
   ```

### Phase 2: Backend Implementation

4. **Create Models** (`Backend/src/models/`)
   - `problems.model.ts` - Problem schema with templates
   - `testcases.model.ts` - Test case schema
   - `submissions.model.ts` - Submission schema
   - Update `users.model.ts` - Add role, solvedProblems fields

5. **Implement Services** (`Backend/src/services/`)
   - `code-execution.service.ts` - Piston integration, test case execution
   - `problems.service.ts` - CRUD operations, filtering
   - `submissions.service.ts` - Submission creation, history retrieval

6. **Create Controllers** (`Backend/src/controller/`)
   - `problems.controller.ts` - Handle problem requests
   - `submissions.controller.ts` - Handle code submissions
   - `admin.controller.ts` - Approval workflow

7. **Implement Middlewares** (`Backend/src/middlewares/`)
   - `rate-limit.middleware.ts` - Submission & problem creation limits
   - Update `auth.middleware.ts` - Add `requireAdmin` middleware

8. **Define Routes** (`Backend/src/routes/`)
   - `problems.routes.ts` - Public + authenticated problem routes
   - `admin.routes.ts` - Admin-only routes

9. **Create Types** (`Backend/src/types/`)
   - `problems.type.ts` - TypeScript interfaces

### Phase 3: Frontend Implementation

10. **Install Dependencies**

    ```bash
    cd Frontend
    pnpm add @uiw/react-codemirror @codemirror/lang-python @codemirror/lang-java @codemirror/lang-cpp
    ```

11. **Create Problem Pages** (`Frontend/src/app/problems/`)
    - `page.tsx` - Problem list with filters
    - `[slug]/page.tsx` - Problem detail with code editor
    - `submit/page.tsx` - Community problem submission form

12. **Create Admin Pages** (`Frontend/src/app/admin/`)
    - `problems/page.tsx` - Pending problems review

13. **Build Components** (`Frontend/src/components/`)
    - `CodeEditor.tsx` - CodeMirror wrapper with language selector
    - `TestResults.tsx` - Display submission results
    - `ProblemCard.tsx` - Problem list item
    - `SubmissionHistory.tsx` - Past submissions modal

### Phase 4: Testing & Deployment

14. **Seed Initial 100 Problems**
    - Create seed script or manual database insertion
    - Include varied difficulties and topics

15. **Test Code Execution**
    - Verify Piston language IDs (python, java, cpp, c)
    - Test sample vs hidden test case logic
    - Validate rate limiting

16. **Security Checks**
    - Verify code size limits (100KB max)
    - Test rate limiting thresholds
    - Ensure hidden test cases never leak

---

## Code Execution Flow

```
User submits code
    ↓
Rate limit check (5/min)
    ↓
Validate code size (<100KB)
    ↓
Fetch problem & test cases
    ↓
Run SAMPLE test cases via Piston
    ├─ If failed: Return full details (expected vs actual)
    └─ If passed: Continue
         ↓
Run HIDDEN test cases via Piston
    ├─ If failed: Return only "Wrong Answer on test case X"
    └─ If passed: Status = ACCEPTED
         ↓
Update user stats (if first AC)
    ├─ Add to solvedProblems array
    └─ Increment problem submission counts
         ↓
Save submission record
    ↓
Return results to user
```

### Piston API Integration

**Endpoint**: `POST http://localhost:2000/execute`

**Request Body**:

```json
{
  "language": "python", // or "java", "cpp", "c"
  "version": "*", // Latest version
  "files": [
    {
      "name": "solution.py",
      "content": "def twoSum(nums, target):\n    ..."
    }
  ],
  "stdin": "[2,7,11,15]\n9",
  "args": [],
  "compile_timeout": 10000, // 10s for compilation
  "run_timeout": 2000, // 2s for execution
  "compile_memory_limit": -1,
  "run_memory_limit": 268435456 // 256MB
}
```

**Response**:

```json
{
  "language": "python",
  "version": "3.10.0",
  "run": {
    "stdout": "[0, 1]\n",
    "stderr": "",
    "code": 0,
    "signal": null,
    "output": "[0, 1]\n"
  }
}
```

### Status Code Mapping

| Piston Response          | Our Status              | User Message                                                                     |
| ------------------------ | ----------------------- | -------------------------------------------------------------------------------- |
| `compile.code != 0`      | `compilation_error`     | Show compile.stderr                                                              |
| `run.code != 0`          | `runtime_error`         | "Runtime Error on test case X"                                                   |
| `run.signal = SIGKILL`   | `time_limit_exceeded`   | "Time Limit Exceeded"                                                            |
| `run.memory > limit`     | `memory_limit_exceeded` | "Memory Limit Exceeded"                                                          |
| `run.stdout != expected` | `wrong_answer`          | For sample: show expected vs actual<br>For hidden: "Wrong Answer on test case X" |
| All tests passed         | `accepted`              | "Accepted! ✓"                                                                    |

---

## Frontend Components Structure

### Problem List Page (`/problems`)

```tsx
<ProblemListPage>
  <Filters>
    - Difficulty selector (Easy/Medium/Hard) - Tag filter (Array, String, DP, etc.) - Status filter
    (All/Solved/Unsolved)
  </Filters>

  <ProblemList>
    {problems.map((problem) => (
      <ProblemCard
        title={problem.title}
        difficulty={problem.difficulty}
        tags={problem.tags}
        isSolved={user.solvedProblems.includes(problem._id)}
        acceptanceRate={problem.acceptanceRate}
      />
    ))}
  </ProblemList>

  <Pagination />
</ProblemListPage>
```

### Problem Detail Page (`/problems/[slug]`)

```tsx
<ProblemDetailPage>
  <LeftPanel width="45%">
    <ProblemDescription>
      - Title & Difficulty - Problem statement - Examples with input/output - Constraints
    </ProblemDescription>

    <SubmissionsTab>- Past submission history - Status, language, time, memory</SubmissionsTab>
  </LeftPanel>

  <RightPanel width="55%">
    <EditorHeader>
      <LanguageSelector
        options={['Python', 'Java', 'C++', 'C']}
        onChange={(lang) => setCode(problem.templates[lang])}
      />
    </EditorHeader>

    <CodeEditor value={code} language={selectedLanguage} onChange={setCode} />

    <ActionButtons>
      <RunButton onClick={runSampleTests} />
      <SubmitButton onClick={submitCode} />
    </ActionButtons>

    <ResultsPanel>{showResults && <TestResults results={submissionResults} />}</ResultsPanel>
  </RightPanel>
</ProblemDetailPage>
```

### Community Submit Page (`/problems/submit`)

```tsx
<SubmitProblemForm>
  <BasicInfo>- Title input - Difficulty selector - Tags (multi-select)</BasicInfo>

  <ProblemContent>
    - Description (markdown editor) - Examples (dynamic array of input/output) - Constraints
    textarea
  </ProblemContent>

  <CodeTemplates>
    - Python template textarea - Java template textarea - C++ template textarea - C template
    textarea
  </CodeTemplates>

  <TestCases>
    {testCases.map((tc, idx) => (
      <TestCaseInput
        type={tc.type} // sample/hidden
        input={tc.input}
        expectedOutput={tc.expectedOutput}
        timeLimit={tc.timeLimit}
      />
    ))}
    <AddTestCaseButton />
  </TestCases>

  <SubmitButton onClick={submitProblem} />
</SubmitProblemForm>
```

### Admin Approval Page (`/admin/problems`)

```tsx
<AdminProblemReview>
  <PendingProblemsList>
    {pendingProblems.map((problem) => (
      <ProblemReviewCard>
        <ProblemPreview problem={problem} />
        <TestCasesSummary testCases={problem.testCases} />

        <Actions>
          <ApproveButton onClick={() => approve(problem._id)} />
          <RejectButton onClick={() => openRejectModal(problem._id)} />
        </Actions>
      </ProblemReviewCard>
    ))}
  </PendingProblemsList>

  <RejectModal>
    <ReasonTextarea />
    <ConfirmRejectButton />
  </RejectModal>
</AdminProblemReview>
```

---

## Security Considerations

### Rate Limiting Configuration

```typescript
// Backend/src/middlewares/rate-limit.middleware.ts

import rateLimit from 'express-rate-limit';

// Submission rate limiter
export const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many submissions. Please wait before submitting again.',
  keyGenerator: (req) => req.user._id.toString(), // Per user
  standardHeaders: true,
  legacyHeaders: false,
});

// Problem creation rate limiter
export const problemCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 problems per hour
  message: 'Too many problem submissions. Please try again later.',
  keyGenerator: (req) => req.user._id.toString(),
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Code Validation

```typescript
// Before sending to Piston
function validateCode(code: string, language: string): void {
  // Size limit: 100KB
  if (Buffer.byteLength(code, 'utf8') > 100 * 1024) {
    throw new ApiError(400, 'Code size exceeds 100KB limit');
  }

  // Basic language-specific validation
  // (Piston handles malicious code, but basic checks help UX)
  if (language === 'python' && code.includes('import os')) {
    // Warning: Piston will block this anyway, but we can fail fast
  }
}
```

### Hidden Test Case Protection

```typescript
// NEVER send hidden test case expected output to frontend
function formatTestResults(results: TestResult[], testCases: TestCase[]) {
  return results.map((result, idx) => {
    const testCase = testCases[idx];

    if (testCase.type === 'sample') {
      // Show full details for sample tests
      return {
        testCaseNumber: idx + 1,
        status: result.status,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.actualOutput,
        executionTime: result.executionTime,
      };
    } else {
      // Hide details for hidden tests
      return {
        testCaseNumber: idx + 1,
        status: result.status,
        // DO NOT include input, expectedOutput, or actualOutput
        executionTime: result.executionTime,
      };
    }
  });
}
```

---

## Environment Variables

Update `Backend/example.env`:

```env
# Existing variables
MONGODB_URI=YourMongoDBConnectionStringHere
PORT=4000
NODE_ENV=development
CORS_ORIGIN=""
LOG_LEVEL=debug

# New variables for coding platform
PISTON_API_URL=http://localhost:2000
CODE_EXECUTION_TIMEOUT=10000       # milliseconds
CODE_SIZE_LIMIT=102400             # bytes (100KB)
MAX_TEST_CASES_PER_PROBLEM=50
```

---

## Deployment Checklist

### Piston Deployment on EC2

```bash
# 1. SSH into t3.small instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# 2. Install Docker (if not installed)
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# 3. Pull and run Piston
docker pull ghcr.io/engineer-man/piston
docker run -d \
  --name piston \
  -p 2000:2000 \
  --restart unless-stopped \
  ghcr.io/engineer-man/piston

# 4. Verify Piston is running
curl http://localhost:2000/api/v2/runtimes

# 5. Configure firewall (if needed)
# Piston should only be accessible from localhost (backend server)
# Do NOT expose port 2000 externally
```

### Backend Deployment

```bash
# 1. Update environment variables
cp example.env .env
# Edit .env with production values

# 2. Install dependencies
pnpm install

# 3. Build TypeScript
pnpm build

# 4. Start server
pnpm start

# Or with PM2 for process management
pm2 start dist/index.js --name fugal-backend
```

### Database Seeding

```bash
# Create seed script: Backend/scripts/seed-problems.ts
# Run with:
tsx scripts/seed-problems.ts
```

---

## Testing Strategy

### Unit Tests

- `code-execution.service.ts` - Mock Piston responses
- `problems.service.ts` - Database operations
- `rate-limit.middleware.ts` - Rate limit logic

### Integration Tests

- Submit code to Piston (sample problems)
- Verify status codes (AC, WA, CE, TLE, MLE, RE)
- Test hidden test case protection

### Manual Testing Checklist

- [ ] Submit correct solution (should be Accepted)
- [ ] Submit wrong solution (should be Wrong Answer with test case number)
- [ ] Submit code with syntax error (should be Compilation Error)
- [ ] Submit infinite loop (should be Time Limit Exceeded)
- [ ] Submit memory-intensive code (should be Memory Limit Exceeded)
- [ ] Verify rate limiting (6th submission in 1 min should fail)
- [ ] Test all 4 languages (Python, Java, C++, C)
- [ ] Verify sample test cases show expected output
- [ ] Verify hidden test cases DON'T show expected output
- [ ] Test community problem submission + admin approval
- [ ] Verify solved problems update in user profile

---

## Performance Optimization

### Caching Strategy

```typescript
// Cache problem test cases in memory (Redis in production)
const testCaseCache = new Map<string, TestCase[]>();

async function getTestCases(problemId: string): Promise<TestCase[]> {
  if (testCaseCache.has(problemId)) {
    return testCaseCache.get(problemId)!;
  }

  const testCases = await TestCase.find({ problemId }).sort({ order: 1 });
  testCaseCache.set(problemId, testCases);
  return testCases;
}
```

### Database Indexes

```javascript
// Ensure these indexes are created
db.problems.createIndex({ slug: 1 }, { unique: true });
db.problems.createIndex({ status: 1, difficulty: 1 });
db.problems.createIndex({ tags: 1 });
db.testcases.createIndex({ problemId: 1, type: 1, order: 1 });
db.submissions.createIndex({ userId: 1, problemId: 1, submittedAt: -1 });
db.submissions.createIndex({ problemId: 1, status: 1 });
```

---

## Future Enhancements (Post-MVP)

- [ ] Code plagiarism detection
- [ ] Leaderboard/rankings
- [ ] Contest mode (timed competitions)
- [ ] Discussion forum per problem
- [ ] Editorial solutions
- [ ] Hints system
- [ ] Video explanations
- [ ] Company tags (Google, Amazon, etc.)
- [ ] Problem recommendations based on user history
- [ ] Streak tracking
- [ ] Email notifications for admin approvals
- [ ] Code review/feedback from community
- [ ] Multi-language support for problem descriptions
- [ ] Real-time collaborative coding
- [ ] Mobile app

---

## Troubleshooting Guide

### Piston Issues

**Problem**: Piston container crashes

```bash
# Check logs
docker logs piston

# Restart container
docker restart piston

# Check resource usage (t3.small has 2GB RAM)
docker stats piston
```

**Problem**: Code execution timeout

- Increase `run_timeout` in Piston request (currently 2000ms)
- Check Piston container resources
- Verify test case input size isn't too large

**Problem**: Wrong language ID error

```bash
# List available runtimes
curl http://localhost:2000/api/v2/runtimes

# Use exact language names from response
# Example: "python" (not "python3"), "java", "c++", "c"
```

### Database Issues

**Problem**: Duplicate slug error

- Ensure slugs are unique before inserting
- Use `slugify` library or manual validation

**Problem**: Test cases not fetching

- Verify `problemId` ObjectId reference
- Check index on `{ problemId: 1, type: 1 }`

### Rate Limiting Issues

**Problem**: Users blocked despite not exceeding limit

- Check if rate limit window is too short
- Verify `keyGenerator` uses correct user ID
- Clear rate limit store (restart server for in-memory store)

---

## Contact & Support

For implementation questions or issues:

1. Check this document first
2. Review existing code patterns in `Backend/src/`
3. Test with Piston API directly (curl) to isolate issues
4. Check Piston documentation: https://github.com/engineer-man/piston

---

## Changelog

- **2024-12-17**: Initial plan created
  - Piston deployment on t3.small EC2
  - Community problem submission workflow
  - 4 language support (Python, Java, C++, C)
  - Rate limiting (5 submissions/min)
  - LeetCode-style test case visibility

---

## Summary

This implementation provides a complete LeetCode-style coding practice platform suitable for bootstrap development with ~10 users. The architecture is designed to scale (move to Redis caching, separate Piston server, CDN for static content) but starts simple and cost-effective.

**Key Success Metrics**:

- ✅ Free/cheap code execution (Piston on existing EC2)
- ✅ Community-driven problem growth (with admin approval)
- ✅ Secure code execution (Piston sandboxing + rate limiting)
- ✅ LeetCode-like UX (hidden test cases, pre-filled templates)
- ✅ Solo engineer maintainable (clear patterns, documented flow)

**Estimated Timeline**: 2-3 weeks for solo engineer (working full-time)

- Week 1: Backend (models, services, routes, Piston integration)
- Week 2: Frontend (problem list, detail page, code editor, results)
- Week 3: Admin panel, testing, initial 100 problems seeding

Good luck with the implementation! 🚀
