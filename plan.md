# Fugal Labs MVP - Architecture Plan

**Last Updated**: December 21, 2025  
**Target**: Solo developer MVP for hackathon-sponsored educational platform  
**Timeline**: 6-8 weeks for complete MVP

---

## 📋 Table of Contents

1. [Platform Overview](#platform-overview)
2. [Tech Stack](#tech-stack)
3. [Authentication Strategy](#authentication-strategy)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [Frontend Structure](#frontend-structure)
7. [Implementation Phases](#implementation-phases)
8. [Deployment Strategy](#deployment-strategy)
9. [Key Decisions & Rationale](#key-decisions--rationale)

---

## 🎯 Platform Overview

### Business Model

- Conduct sponsored hackathons at colleges under Fugal Labs brand
- Drive traffic to platform for recurring revenue
- Two revenue streams: **Problems** (practice platform) + **Courses** (learning platform)

### Core Features

**Problems Route** (LeetCode-style)

- 100+ coding challenges (Easy/Medium/Hard)
- Multi-language support: Python, Java, C++, C
- Real-time code execution with test case validation
- Progress tracking and submission history
- Community problem submissions (admin-approved)

**Courses Route** (Unacademy-style at smaller scale)

- Video-based courses with structured curriculum
- Progress tracking per lecture
- Enrollment system (free for MVP)
- Course completion certificates (future)

---

## 🛠 Tech Stack

### Backend

```
- Runtime: Node.js 20+
- Framework: Express.js 5.x
- Language: TypeScript 5.x
- Database: MongoDB (Mongoose ODM)
- Authentication: JWT (stateless, no DB storage)
- Code Execution: Piston (self-hosted Docker)
- Logging: Pino
- Validation: Zod
```

### Frontend

```
- Framework: Next.js 16 (App Router)
- Language: TypeScript 5.x
- Styling: Tailwind CSS 4
- Code Editor: CodeMirror (React wrapper)
- Video Player: React Player (YouTube/Vimeo embeds)
- Validation: Zod (shared schemas)
- State: React Context + useState (no Redux) or Zustand (if needed)
```

### Infrastructure

```
- Hosting: AWS EC2 t3.small (existing)
- Database: MongoDB Atlas (free tier: 512MB)
- Code Execution: Piston on same EC2
- Frontend: Vercel (Next.js optimized)
- CDN: Vercel Edge Network (automatic)
```

---

## 🔐 Authentication Strategy

### Dual-Token Authentication (Access + Refresh)

**Why Dual-Token?**

- ✅ Enhanced security (short-lived access tokens)
- ✅ Can revoke sessions (refresh tokens stored in DB)
- ✅ Automatic token refresh (seamless UX)
- ✅ Multi-device session management
- ✅ Industry-standard approach

**Implementation**

```typescript
// Access Token
// - Payload: { _id, email, role }
// - Expiration: 15 minutes
// - Storage: HTTP-only cookie
// - Usage: Authenticate API requests

// Refresh Token
// - Payload: { _id, tokenVersion }
// - Expiration: 7 days
// - Storage: Database (User model) + HTTP-only cookie
// - Usage: Generate new access tokens

// Token Rotation: New refresh token issued on each refresh
// Revocation: Increment tokenVersion to invalidate all refresh tokens
```

**Security Measures**

- HTTP-only cookies for both tokens (prevent XSS)
- Secure flag in production (HTTPS only)
- SameSite: Lax (CSRF protection)
- bcrypt password hashing (10 rounds)
- Rate limiting on auth endpoints (10 attempts/15min)
- Automatic token rotation on refresh
- Token version for instant revocation

**Migration from Current System**

```diff
- Remove `token` field from User model
+ Add `refreshToken` field to User model (String, optional)
+ Add `tokenVersion` field to User model (Number, default: 0)
+ Add `role` field to User model (enum: 'user' | 'admin')
+ Update auth middleware: verify access token (fast, no DB lookup)
+ Add refresh token endpoint (validates refresh token from DB)
+ Update login/register: generate both tokens, store refresh token
+ Update logout: remove refresh token from DB
```

---

## 💾 Database Schema

### 1. Users Collection

```javascript
{
  _id: ObjectId,
  name: String,                     // required
  username: String,                 // required, unique
  email: String,                    // required, unique, lowercase
  password: String,                 // required, bcrypt hashed
  role: String,                     // enum: ['user', 'admin'], default: 'user'

  // Authentication
  refreshToken: String,             // Current refresh token (nullable)
  tokenVersion: Number,             // default: 0, increment to revoke all tokens

  // Profile
  bio: String,                      // optional
  avatar: String,                   // URL, optional

  // Problems Stats
  solvedProblems: [
    {
      problemId: ObjectId,          // ref: 'Problem'
      solvedAt: Date,
      difficulty: String            // cached for quick stats
    }
  ],

  // Course Stats
  enrolledCourses: [
    {
      courseId: ObjectId,           // ref: 'Course'
      enrolledAt: Date,
      progress: Number,             // 0-100 percentage
      lastAccessedAt: Date
    }
  ],

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ refreshToken: 1 });
```

**Changes from Current**:

- Remove `token` field ✂️
- Add `refreshToken` field ➕
- Add `tokenVersion` field ➕
- Add `role` field ➕
- Add `solvedProblems` array ➕
- Add `enrolledCourses` array ➕
- Add `bio` and `avatar` fields ➕

---

### 2. Problems Collection

```javascript
{
  _id: ObjectId,
  title: String,                    // "Two Sum"
  slug: String,                     // "two-sum", unique, URL-friendly
  difficulty: String,               // enum: ['easy', 'medium', 'hard']
  description: String,              // Problem statement (markdown)

  // Examples (shown to users)
  examples: [
    {
      input: String,
      output: String,
      explanation: String           // optional
    }
  ],

  constraints: String,              // "1 <= nums.length <= 10^4"
  tags: [String],                   // ["array", "hash-table"]

  // Code templates (pre-filled for each language)
  templates: {
    python: String,
    java: String,
    cpp: String,
    c: String
  },

  // Community submission workflow
  status: String,                   // enum: ['draft', 'pending', 'approved', 'rejected']
  submittedBy: ObjectId,            // ref: 'User', null for admin-created
  approvedBy: ObjectId,             // ref: 'User', null until approved
  rejectionReason: String,          // If status='rejected'

  // Metadata
  totalSubmissions: Number,         // default: 0
  acceptedSubmissions: Number,      // default: 0
  acceptanceRate: Number,           // calculated: (accepted/total) * 100

  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.problems.createIndex({ slug: 1 }, { unique: true });
db.problems.createIndex({ status: 1, difficulty: 1 });
db.problems.createIndex({ tags: 1 });
```

---

### 3. TestCases Collection

```javascript
{
  _id: ObjectId,
  problemId: ObjectId,              // ref: 'Problem'

  type: String,                     // enum: ['sample', 'hidden']
                                    // sample: visible to users (2-3 cases)
                                    // hidden: evaluation only (10-15 cases)

  input: String,                    // stdin format: "[2,7,11,15]\n9"
  expectedOutput: String,           // stdout format: "[0,1]"

  // Execution limits
  timeLimit: Number,                // milliseconds, default: 2000
  memoryLimit: Number,              // MB, default: 256

  order: Number,                    // For ordering test cases

  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.testcases.createIndex({ problemId: 1, type: 1, order: 1 });
```

---

### 4. Submissions Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                 // ref: 'User'
  problemId: ObjectId,              // ref: 'Problem'

  language: String,                 // enum: ['python', 'java', 'cpp', 'c']
  code: String,                     // Full source code

  // Execution results
  status: String,                   // enum: ['pending', 'accepted', 'wrong_answer',
                                    //        'time_limit_exceeded', 'memory_limit_exceeded',
                                    //        'compilation_error', 'runtime_error']

  executionTime: Number,            // milliseconds (max across all tests)
  memoryUsed: Number,               // MB (max across all tests)

  // Test results (detailed for sample, minimal for hidden)
  testResults: [
    {
      testCaseId: ObjectId,
      status: String,               // 'passed' | 'failed' | 'error' | 'timeout'
      executionTime: Number,

      // Only for sample tests or errors
      actualOutput: String,
      expectedOutput: String,
      errorMessage: String
    }
  ],

  firstFailedTestCase: Number,      // 1-indexed, null if all passed

  submittedAt: Date
}

// Indexes
db.submissions.createIndex({ userId: 1, problemId: 1, submittedAt: -1 });
db.submissions.createIndex({ problemId: 1, status: 1 });
```

---

### 5. Courses Collection

```javascript
{
  _id: ObjectId,
  title: String,                    // "Full Stack Web Development"
  slug: String,                     // "full-stack-web-development", unique
  description: String,              // Course overview (markdown)

  // Instructor
  instructorId: ObjectId,           // ref: 'User' (must have role='admin')
  instructorName: String,           // Denormalized for quick display

  // Media
  thumbnail: String,                // URL to course image
  previewVideo: String,             // YouTube/Vimeo URL (optional)

  // Categorization
  category: String,                 // "Web Development", "Data Science", etc.
  level: String,                    // enum: ['beginner', 'intermediate', 'advanced']
  tags: [String],                   // ["javascript", "react", "node"]

  // Curriculum (lectures array)
  lectures: [
    {
      _id: ObjectId,                // Auto-generated
      title: String,
      description: String,
      videoUrl: String,             // YouTube/Vimeo embed URL
      duration: Number,             // seconds
      order: Number,                // For lecture ordering
      isFree: Boolean,              // Preview lectures (default: false)
      resources: [                  // Attachments (optional)
        {
          name: String,
          url: String,
          type: String              // 'pdf', 'code', 'link'
        }
      ]
    }
  ],

  // Metadata
  totalLectures: Number,            // Auto-calculated
  totalDuration: Number,            // seconds, auto-calculated
  enrollmentCount: Number,          // default: 0

  // Pricing (for future)
  price: Number,                    // 0 for free courses
  currency: String,                 // "INR", default

  // Status
  status: String,                   // enum: ['draft', 'published', 'archived']
  publishedAt: Date,

  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.courses.createIndex({ slug: 1 }, { unique: true });
db.courses.createIndex({ status: 1, category: 1 });
db.courses.createIndex({ tags: 1 });
```

**MVP Simplification**:

- All courses free (price=0)
- YouTube/Vimeo embeds (no video hosting)
- Lectures embedded in course document (not separate collection)

---

### 6. LectureProgress Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,                 // ref: 'User'
  courseId: ObjectId,               // ref: 'Course'
  lectureId: ObjectId,              // Lecture _id from Course.lectures array

  // Progress tracking
  isCompleted: Boolean,             // default: false
  watchTime: Number,                // seconds watched
  lastWatchedAt: Date,
  completedAt: Date,                // null if not completed

  createdAt: Date,
  updatedAt: Date
}

// Indexes
db.lectureprogress.createIndex({ userId: 1, courseId: 1, lectureId: 1 }, { unique: true });
db.lectureprogress.createIndex({ userId: 1, courseId: 1 });
```

---

## 🔌 API Design

### Authentication Endpoints

```
POST   /users/register
  Body: { name, username, email, password }
  Response: { user: {...}, accessToken: "jwt..." }
  Sets: HTTP-only cookies (accessToken + refreshToken)
  Side Effect: Store refreshToken in database

POST   /users/login
  Body: { email | username, password }
  Response: { user: {...}, accessToken: "jwt..." }
  Sets: HTTP-only cookies (accessToken + refreshToken)
  Side Effect: Store refreshToken in database

POST   /users/refresh
  Auth: Requires valid refreshToken cookie
  Response: { accessToken: "new-jwt..." }
  Sets: New HTTP-only cookies (accessToken + refreshToken)
  Side Effect: Rotate refreshToken in database
  Note: Called automatically by frontend when accessToken expires

POST   /users/logout
  Auth: Required
  Response: { message: "Logged out successfully" }
  Clears: HTTP-only cookies
  Side Effect: Remove refreshToken from database

POST   /users/logout-all
  Auth: Required
  Response: { message: "Logged out from all devices" }
  Side Effect: Increment tokenVersion (invalidates all refresh tokens)

GET    /users/me
  Auth: Required (accessToken)
  Response: { user: {...} }
```

---

### Problems Endpoints

**Public (No Auth)**

```
GET    /problems
  Query: ?difficulty=easy&tags=array&page=1&limit=20&status=approved
  Response: { problems: [...], total, page, totalPages }

GET    /problems/:slug
  Response: {
    problem: {...},           // Full problem details
    sampleTestCases: [...],   // Only sample type test cases
    userStats: null           // null if not authenticated
  }
```

**Authenticated**

```
POST   /problems/:slug/submit
  Rate Limit: 5 submissions/minute per user
  Body: { language: 'python', code: '...' }
  Response: {
    submissionId: "...",
    status: 'accepted' | 'wrong_answer' | ...,
    executionTime: 145,
    memoryUsed: 14.2,
    testResults: [
      // Full details for sample tests
      { testCaseNumber: 1, status: 'passed', input: '...', expectedOutput: '...', actualOutput: '...' },
      // Minimal for hidden tests
      { testCaseNumber: 3, status: 'failed' }  // No expected/actual output
    ],
    firstFailedTestCase: 3,   // null if all passed
    message: "Wrong Answer on test case 3"
  }

GET    /problems/:slug/submissions
  Query: ?page=1&limit=10
  Response: { submissions: [...], total }

POST   /problems/submit-new
  Rate Limit: 3 problems/hour per user
  Body: { title, description, examples, constraints, tags, templates, testCases }
  Response: { problemId, status: 'pending', message: "Submitted for review" }
```

**Admin Only**

```
GET    /admin/problems/pending
  Response: { problems: [...] }

PATCH  /admin/problems/:id/approve
  Response: { message: "Problem approved" }

PATCH  /admin/problems/:id/reject
  Body: { reason: "Insufficient test cases" }
  Response: { message: "Problem rejected" }

POST   /admin/problems
  Body: { title, slug, difficulty, description, templates, ... }
  Response: { problemId, slug }
```

---

### Courses Endpoints

**Public**

```
GET    /courses
  Query: ?category=web&level=beginner&page=1&limit=12
  Response: { courses: [...], total, page, totalPages }

GET    /courses/:slug
  Response: {
    course: {...},            // Full course with lectures
    isEnrolled: false,        // false if not authenticated
    progress: null            // null if not enrolled
  }
```

**Authenticated**

```
POST   /courses/:slug/enroll
  Response: {
    message: "Enrolled successfully",
    enrollmentId: "..."
  }
  Side Effect: Add to user.enrolledCourses array

GET    /courses/:slug/progress
  Response: {
    courseId: "...",
    totalLectures: 24,
    completedLectures: 8,
    progressPercentage: 33,
    lectureProgress: [
      { lectureId: "...", isCompleted: true, watchTime: 540 },
      ...
    ]
  }

POST   /courses/:slug/lectures/:lectureId/progress
  Body: { watchTime: 540, isCompleted: true }
  Response: { message: "Progress updated" }

GET    /users/me/courses
  Response: { enrolledCourses: [...] }
```

**Admin Only**

```
POST   /admin/courses
  Body: { title, slug, description, category, level, lectures: [...], ... }
  Response: { courseId, slug }

PATCH  /admin/courses/:id
  Body: { title?, description?, lectures?, status?, ... }
  Response: { message: "Course updated" }

DELETE /admin/courses/:id
  Response: { message: "Course deleted" }

POST   /admin/courses/:id/publish
  Response: { message: "Course published" }
```

---

## 🎨 Frontend Structure

### App Router Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout with auth provider
│   ├── page.tsx                   # Landing page (hackathon info)
│   ├── globals.css
│   │
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx           # Login page
│   │   └── register/
│   │       └── page.tsx           # Registration page
│   │
│   ├── problems/
│   │   ├── page.tsx               # Problem list with filters
│   │   ├── [slug]/
│   │   │   └── page.tsx           # Problem detail + code editor
│   │   └── submit/
│   │       └── page.tsx           # Community problem submission
│   │
│   ├── courses/
│   │   ├── page.tsx               # Course catalog
│   │   ├── [slug]/
│   │   │   ├── page.tsx           # Course detail page
│   │   │   └── learn/
│   │   │       └── page.tsx       # Learning interface
│   │   └── my-courses/
│   │       └── page.tsx           # User's enrolled courses
│   │
│   ├── profile/
│   │   └── page.tsx               # User profile + stats
│   │
│   └── admin/
│       ├── layout.tsx             # Admin layout (auth check)
│       ├── dashboard/
│       │   └── page.tsx           # Admin dashboard
│       ├── problems/
│       │   ├── page.tsx           # Pending problems review
│       │   └── create/
│       │       └── page.tsx       # Create problem
│       └── courses/
│           ├── page.tsx           # Manage courses
│           └── create/
│               └── page.tsx       # Create course
│
├── components/
│   ├── providers/
│   │   └── AuthProvider.tsx      # Auth context provider
│   │
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   ├── problems/
│   │   ├── ProblemCard.tsx        # List item
│   │   ├── ProblemFilters.tsx     # Difficulty/tags filter
│   │   ├── CodeEditor.tsx         # CodeMirror wrapper
│   │   ├── TestResults.tsx        # Submission results display
│   │   ├── SubmissionHistory.tsx  # Past submissions
│   │   └── LanguageSelector.tsx
│   │
│   └── courses/
│       ├── CourseCard.tsx         # Catalog item
│       ├── CourseFilters.tsx
│       ├── VideoPlayer.tsx        # React Player wrapper
│       ├── CurriculumList.tsx     # Lecture list sidebar
│       ├── ProgressBar.tsx
│       └── EnrollButton.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts              # Fetch wrapper with auth
│   │   ├── problems.ts            # Problem API functions
│   │   ├── courses.ts             # Course API functions
│   │   └── auth.ts                # Auth API functions
│   │
│   ├── validations.ts             # Zod schemas
│   ├── utils.ts                   # Utility functions
│   └── constants.ts               # App constants
│
└── types/
    ├── auth.ts
    ├── problems.ts
    └── courses.ts
```

---

### Key Frontend Components

**CodeEditor.tsx**

```tsx
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';

// Support syntax highlighting for 4 languages
// Auto-resize based on content
// Dark theme matching platform
```

**VideoPlayer.tsx**

```tsx
import ReactPlayer from 'react-player';

// YouTube/Vimeo embed support
// Progress tracking (onProgress event)
// Resume from last position
// Prevent seeking ahead of watched position (optional)
```

**AuthProvider.tsx**

```tsx
// React Context for auth state
// useAuth() hook for components
// Auto-fetch user on mount (if cookie exists)
// Provide: user, login, logout, register functions
```

---

## 📅 Implementation Phases

### Phase 0: Foundation (Week 1)

**Goal**: Implement dual-token auth (access + refresh) + connect frontend to backend

- [x] **Logger**: Enhanced Pino logger with LOG_LEVEL environment variable support
  - [x] Environment-aware logging (pretty in dev, JSON in production)
  - [x] Separate log files (app.log for all, error.log for errors only)
  - [x] Sensitive data redaction (passwords, tokens, auth headers)
  - [x] Configurable log levels (trace, debug, info, warn, error, fatal)
  - [x] Fixed dotenv loading order with `import 'dotenv/config'`
- [x] **Backend**: Remove old token field from User model
- [x] **Backend**: Add refreshToken, tokenVersion, role, solvedProblems, enrolledCourses to User model
- [x] **Backend**: Create token utility functions (generateAccessToken, generateRefreshToken, verifyToken)
- [x] **Backend**: Update auth middleware (verify access token, no DB lookup for performance)
- [x] **Backend**: Update login/register services (generate both tokens, store refreshToken in DB)
- [x] **Backend**: Create refresh token endpoint (/api/auth/refresh)
- [x] **Backend**: Update logout service (remove refreshToken from DB)
- [x] **Backend**: Create logout-all endpoint (increment tokenVersion)
- [x] **Backend**: Create admin middleware (check role='admin')
- [ ] **Frontend**: Create API client library (`lib/api/client.ts`) with auto-refresh logic
- [ ] **Frontend**: Create AuthProvider context with token refresh handling
- [ ] **Frontend**: Build login/register pages
- [ ] **Frontend**: Implement automatic token refresh on 401 responses
- [ ] **Frontend**: Update CORS_ORIGIN in backend
- [ ] **Test**: Full auth flow (register → login → wait 15min → auto-refresh → protected route → logout)
- [ ] **Test**: Multi-device logout (logout-all endpoint)

**Deliverable**: Working dual-token authentication system with seamless refresh

---

### Phase 1: Problems Route - Backend (Week 2-3)

**Goal**: Complete LeetCode-style problem system backend

- [ ] **Models**:
  - [ ] Create `problems.model.ts` (title, slug, difficulty, description, templates)
  - [ ] Create `testcases.model.ts` (problemId ref, type: sample/hidden, input/output, limits)
  - [ ] Create `submissions.model.ts` (userId, problemId, code, language, status, results)
- [ ] **Services**:
  - [ ] `code-execution.service.ts` (Piston integration, execute code with test cases)
  - [ ] `problems.service.ts` (CRUD operations, filtering by difficulty/tags, pagination)
  - [ ] `submissions.service.ts` (execute code against test cases, save results, update stats)
- [ ] **Controllers**:
  - [ ] `problems.controller.ts` (list, get by slug, submit code, get submissions)
  - [ ] `submissions.controller.ts` (create submission, get user submissions)
  - [ ] `admin.controller.ts` (create/approve/reject problems)
- [ ] **Routes**:
  - [ ] `problems.routes.ts` (public + authenticated routes)
  - [ ] `admin.routes.ts` (admin-only routes with middleware)
- [ ] **Middleware**:
  - [ ] `rate-limit.middleware.ts` (express-rate-limit: 5 submissions/min, 3 problems/hour)
- [ ] **Infrastructure**:
  - [ ] Deploy Piston on EC2 (Docker container on port 2000)
  - [ ] Configure Piston API URL in environment variables
- [ ] **Test**:
  - [ ] Create problem → add test cases → submit solution → verify results
  - [ ] Test all 4 languages (Python, Java, C++, C)
  - [ ] Test rate limiting (6th submission should fail)

**Deliverable**: Working problem submission and execution system

---

### Phase 2: Problems Route - Frontend (Week 3-4)

**Goal**: Build LeetCode-style UI for problem solving

- [ ] **Dependencies**:
  - [ ] `@uiw/react-codemirror` + language extensions (@codemirror/lang-python, java, cpp)
  - [ ] Set up Tailwind CSS for styling
- [ ] **Pages**:
  - [ ] `/problems` - List with filters (difficulty, tags) + pagination
  - [ ] `/problems/[slug]` - Split view (description left, editor + test cases right)
  - [ ] `/problems/submit` - Community submission form (requires auth)
- [ ] **Components**:
  - [ ] `CodeEditor.tsx` - Multi-language editor with syntax highlighting
  - [ ] `LanguageSelector.tsx` - Dropdown to switch between Python/Java/C++/C
  - [ ] `TestResults.tsx` - Submission results display (passed/failed, execution time, memory)
  - [ ] `SubmissionHistory.tsx` - Past submissions modal with status
  - [ ] `ProblemCard.tsx` - Problem list item (title, difficulty badge, acceptance rate)
  - [ ] `ProblemFilters.tsx` - Filter by difficulty/tags
- [ ] **API Integration**:
  - [ ] Connect to problems API (list, get by slug)
  - [ ] Connect to submissions API (submit, get history)
  - [ ] Handle loading states and errors
- [ ] **Test**:
  - [ ] Solve problem → submit → see results → check history
  - [ ] Test filter functionality
  - [ ] Test language switching and code persistence

**Deliverable**: Functional problem-solving interface

---

### Phase 3: Admin Panel for Problems (Week 4-5)

**Goal**: Problem approval and management system

- [ ] **Pages**:
  - [ ] `/admin/dashboard` - Overview (pending items count, total problems, submissions)
  - [ ] `/admin/problems` - Pending problems review list with approve/reject actions
  - [ ] `/admin/problems/create` - Direct problem creation form (title, description, test cases, templates)
- [ ] **Components**:
  - [ ] `ProblemReviewCard.tsx` - Approve/reject UI with problem preview
  - [ ] `RejectModal.tsx` - Rejection reason form with validation
  - [ ] `ProblemForm.tsx` - Reusable form for creating/editing problems
  - [ ] `TestCaseManager.tsx` - Add/edit/delete test cases (sample vs hidden)
- [ ] **Middleware**:
  - [ ] Add admin route protection (check role='admin' in frontend)
  - [ ] Backend admin middleware already created in Phase 0
- [ ] **Seed**:
  - [ ] Create initial 100 approved problems (mix of easy: 40, medium: 40, hard: 20)
  - [ ] Seed 1 admin user (email: admin@fugallabs.com, password: hashed)
- [ ] **Test**:
  - [ ] Submit problem as user → admin sees in pending list
  - [ ] Admin approves → problem appears in public list
  - [ ] Admin rejects → user can see rejection reason

**Deliverable**: Self-sustaining problem platform with community contributions

---

### Phase 4: Courses Route - Backend (Week 5-6)

**Goal**: Build Unacademy-style course backend

- [ ] **Models**:
  - [ ] Create `courses.model.ts` (title, slug, description, lectures array, instructor, category, level)
  - [ ] Create `lectureprogress.model.ts` (userId, courseId, lectureId, isCompleted, watchTime)
- [ ] **Services**:
  - [ ] `courses.service.ts` (CRUD operations, enrollment logic, get user courses)
  - [ ] `lectureprogress.service.ts` (track user progress, update watch time, mark complete)
- [ ] **Controllers**:
  - [ ] `courses.controller.ts` (list, get by slug, enroll, get progress, update lecture progress)
  - [ ] `admin-courses.controller.ts` (create, update, delete, publish courses)
- [ ] **Routes**:
  - [ ] `courses.routes.ts` (public + authenticated routes)
  - [ ] Update `admin.routes.ts` with course management routes
- [ ] **Seed**:
  - [ ] Create 2-3 sample courses with YouTube video embeds
  - [ ] Each course with 5-10 lectures
  - [ ] Mix of beginner/intermediate levels
- [ ] **Test**:
  - [ ] Enroll in course → watch lecture → mark complete → check progress
  - [ ] Test progress percentage calculation

**Deliverable**: Working course backend with progress tracking

---

### Phase 5: Courses Route - Frontend (Week 6-7)

**Goal**: Build course learning interface

- [ ] **Dependencies**:
  - [ ] `react-player` for YouTube/Vimeo embeds
- [ ] **Pages**:
  - [ ] `/courses` - Course catalog with filters (category, level) + grid layout
  - [ ] `/courses/[slug]` - Course detail page (overview, curriculum, instructor, enroll button)
  - [ ] `/courses/[slug]/learn` - Learning interface (video player + curriculum sidebar)
  - [ ] `/courses/my-courses` - User's enrolled courses with progress bars
- [ ] **Components**:
  - [ ] `CourseCard.tsx` - Catalog item (thumbnail, title, instructor, level badge)
  - [ ] `CourseFilters.tsx` - Filter by category/level
  - [ ] `VideoPlayer.tsx` - React Player wrapper with progress tracking
  - [ ] `CurriculumList.tsx` - Lecture sidebar with checkmarks for completed
  - [ ] `ProgressBar.tsx` - Visual progress indicator (percentage)
  - [ ] `EnrollButton.tsx` - Enroll action with auth check
  - [ ] `LectureResources.tsx` - Download links for PDFs/code
- [ ] **API Integration**:
  - [ ] Connect to courses API (list, get by slug, enroll)
  - [ ] Connect to progress API (get progress, update lecture progress)
  - [ ] Handle enrollment state (show "Continue Learning" vs "Enroll")
- [ ] **Test**:
  - [ ] Browse catalog → filter courses
  - [ ] View course detail → enroll
  - [ ] Watch lectures → progress updates
  - [ ] Mark lecture complete → UI updates
  - [ ] Check my-courses page shows enrolled courses with progress

**Deliverable**: Functional course learning platform

---

### Phase 6: Admin Panel for Courses (Week 7)

**Goal**: Course creation and management

- [ ] **Pages**:
  - [ ] `/admin/courses` - Manage all courses (list with edit/delete/publish actions)
  - [ ] `/admin/courses/create` - Create new course form
  - [ ] `/admin/courses/[id]/edit` - Edit existing course (same form as create)
- [ ] **Components**:
  - [ ] `CourseForm.tsx` - Create/edit form (title, description, category, level, thumbnail)
  - [ ] `LectureManager.tsx` - Add/remove/reorder lectures with drag-and-drop
  - [ ] `LectureForm.tsx` - Add/edit individual lecture (title, video URL, duration, resources)
  - [ ] `CourseStatusBadge.tsx` - Show draft/published/archived status
- [ ] **Features**:
  - [ ] Draft mode for unpublished courses
  - [ ] Publish/unpublish toggle
  - [ ] Delete course with confirmation
  - [ ] YouTube URL validator for video embeds
- [ ] **Test**:
  - [ ] Create course with all details
  - [ ] Add multiple lectures with reordering
  - [ ] Save as draft → edit later → publish
  - [ ] Published course appears in public catalog

**Deliverable**: Complete course management system

---

### Phase 7: Polish & Launch (Week 8)

**Goal**: Production readiness

- [ ] **Security**:
  - [ ] Add rate limiting to all endpoints
  - [ ] Validate all user inputs with Zod schemas (frontend + backend)
  - [ ] Test authentication edge cases (expired tokens, invalid tokens, concurrent logins)
  - [ ] Add CSRF protection
  - [ ] Security headers (helmet.js)
  - [ ] Input sanitization for user-generated content
- [ ] **Performance**:
  - [ ] Add all database indexes from schema section
  - [ ] Optimize queries with .select() to limit fields
  - [ ] Add caching for frequently accessed data (course lists, problem lists)
  - [ ] Add loading states to all async operations in frontend
  - [ ] Lazy load components (code editor, video player)
  - [ ] Image optimization (Next.js Image component)
- [ ] **UX**:
  - [ ] Error messages for all failure scenarios
  - [ ] Success notifications (toast messages)
  - [ ] Empty states (no problems solved, no enrolled courses, no submissions)
  - [ ] Skeleton loaders for content loading
  - [ ] Responsive design (mobile-friendly, tablet-friendly)
  - [ ] Dark mode support (optional)
  - [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] **Deployment**:
  - [ ] Deploy backend to EC2 with PM2
  - [ ] Configure Nginx reverse proxy for backend
  - [ ] Deploy frontend to Vercel
  - [ ] Set up custom domain (api.fugallabs.com, www.fugallabs.com)
  - [ ] Configure production environment variables
  - [ ] Set up MongoDB Atlas production cluster
  - [ ] Deploy Piston Docker container on EC2
  - [ ] Test end-to-end in production
  - [ ] Set up SSL certificates (Let's Encrypt)
- [ ] **Documentation**:
  - [ ] Update README with setup instructions
  - [ ] Document all environment variables with examples
  - [ ] Create admin user guide (problem approval, course creation)
  - [ ] API documentation (optional: Swagger/OpenAPI)
  - [ ] Deployment guide
  - [ ] Troubleshooting guide
- [ ] **Monitoring**:
  - [ ] Set up error tracking (optional: Sentry)
  - [ ] Monitor server resources (CPU, RAM, disk)
  - [ ] Set up uptime monitoring
  - [ ] Log aggregation for production logs
  - [ ] Responsive design (mobile-friendly)
- [ ] **Deployment**:
  - [ ] Deploy backend to EC2
  - [ ] Deploy frontend to Vercel
  - [ ] Configure production env variables
  - [ ] Test end-to-end in production
- [ ] **Documentation**:
  - [ ] Update README with setup instructions
  - [ ] Document environment variables
  - [ ] Create admin user guide

**Deliverable**: Production-ready MVP

---

## 🚀 Deployment Strategy

### Development Environment

```
Backend:  http://localhost:4000
Frontend: http://localhost:3000
Database: MongoDB Atlas (free tier)
Piston:   http://localhost:2000 (Docker on EC2)
```

### Production Environment

**Backend** (AWS EC2 t3.small)

```bash
# Install Node.js 20+, PM2
npm install -g pm2

# Deploy backend
cd /var/www/fugal-backend
git pull origin main
pnpm install
pnpm build
pm2 restart fugal-api

# Deploy Piston
docker pull ghcr.io/engineer-man/piston
docker run -d --name piston -p 2000:2000 --restart unless-stopped ghcr.io/engineer-man/piston
```

**Frontend** (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd Frontend
vercel --prod

# Environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://api.fugallabs.com
```

**Database** (MongoDB Atlas)

- Free tier: 512MB storage (sufficient for 1000+ users)
- Automatic backups
- Access from EC2 via IP whitelist

**Domain Setup**

```
www.fugallabs.com         → Vercel (Frontend)
api.fugallabs.com         → EC2 (Backend via Nginx reverse proxy)
```

---

## 🎯 Key Decisions & Rationale

### 1. Dual-Token Auth vs Session-based Auth

**Decision**: Access token (15min) + Refresh token (7 days) in HTTP-only cookies

**Rationale**:

- ✅ Fast access token verification (no DB lookup on every request)
- ✅ Can revoke sessions (refresh token in DB + tokenVersion)
- ✅ Short-lived access tokens for better security
- ✅ Automatic refresh for seamless UX
- ✅ Multi-device session management
- ✅ Industry-standard approach
- ⚠️ Tradeoff: Slightly more complex than stateless JWT, but worth it for security

---

### 2. YouTube Embed vs Self-hosted Videos

**Decision**: YouTube/Vimeo embeds for courses

**Rationale**:

- ✅ Zero video storage costs
- ✅ No CDN/encoding infrastructure needed
- ✅ YouTube handles adaptive streaming
- ✅ Faster to market
- ⚠️ Tradeoff: Less control over player, requires YouTube account

**Future**: Migrate to Cloudflare Stream or AWS S3 + CloudFront when scaling

---

### 3. Piston on Same EC2 vs Separate Instance

**Decision**: Deploy Piston on existing t3.small EC2

**Rationale**:

- ✅ Cost-effective for MVP (~10 users)
- ✅ t3.small has 2GB RAM (sufficient for low traffic)
- ✅ Simplifies deployment (one server)
- ⚠️ Monitor resource usage, separate if CPU/RAM becomes bottleneck

---

### 4. Embedded Lectures vs Separate Collection

**Decision**: Embed lectures array in Course document

**Rationale**:

- ✅ Simpler queries (one DB call for full course)
- ✅ Atomic updates (lecture reordering)
- ✅ Sufficient for <100 lectures per course
- ⚠️ If courses exceed 16MB MongoDB limit, migrate to separate collection

---

### 5. Dual-Token Authentication

**Decision**: Access token (15min) + Refresh token (7 days)

**Rationale**:

- ✅ Industry-standard security practice
- ✅ Short-lived access tokens minimize attack surface
- ✅ Can revoke sessions instantly (increment tokenVersion)
- ✅ Seamless UX with automatic token refresh
- ✅ Multi-device logout capability
- ⚠️ Slightly more complex than single-token, but worth it for security

---

### 6. Free Courses Only for MVP

**Decision**: All courses free (price=0)

**Rationale**:

- ✅ Faster MVP launch (no payment gateway)
- ✅ Build audience before monetization
- ✅ Validate platform before adding payments
- 🚀 Future: Add Razorpay/Stripe when courses have traction

---

### 7. Community Problems with Approval

**Decision**: Users can submit, admins must approve

**Rationale**:

- ✅ Quality control (prevent spam/duplicates)
- ✅ Community engagement (users contribute)
- ✅ Scales content creation (not limited to admin)
- ⚠️ Requires active admin moderation

---

## 📊 MVP Success Metrics

**Week 8 Goals**:

- ✅ 100+ problems available (seeded)
- ✅ 3-5 courses with 5+ lectures each
- ✅ Code execution working for Python, Java, C++, C
- ✅ User registration & authentication functional
- ✅ Admin panel for approvals working
- ✅ Mobile-responsive UI
- ✅ Deployed to production with custom domain

**Initial User Goals (Month 1)**:

- 🎯 10 active users (teammates/friends for testing)
- 🎯 50 problem submissions
- 🎯 5 course enrollments
- 🎯 5 community-submitted problems pending review

---

## 🔧 Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for consistency
- Functional components (React)
- Async/await over promises
- Descriptive variable names

### Git Workflow

```bash
main         # Production-ready code
├── develop  # Integration branch
    ├── feature/problems-backend
    ├── feature/courses-frontend
    └── feature/admin-panel
```

### Testing Strategy (MVP Minimal)

- Manual testing for all user flows
- Test all 4 languages in code execution
- Test rate limiting (6th submission should fail)
- Test hidden test cases don't leak data
- Admin workflow testing (approve/reject)

**Future**: Add Jest for unit tests, Playwright for E2E

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Frontend can't connect to backend

```bash
# Check CORS_ORIGIN in backend .env
CORS_ORIGIN=http://localhost:3000

# Check API URL in frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**Issue**: Piston container crashes

```bash
# Check logs
docker logs piston

# Restart container
docker restart piston

# Check resources (t3.small has 2GB RAM)
docker stats piston
```

**Issue**: JWT verification fails

```bash
# Ensure JWT_SECRET is same in .env
# Check cookie domain/sameSite settings
# Verify cookie is being sent (browser DevTools → Network)
```

**Issue**: Code execution timeout

```bash
# Increase timeout in code-execution.service.ts
run_timeout: 5000  // 5 seconds instead of 2

# Or optimize test case inputs (reduce size)
```

---

## 📚 Environment Variables

### Backend (.env)

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fugallabs

# Server
PORT=4000
NODE_ENV=production
CORS_ORIGIN=https://fugallabs.com

# Authentication
JWT_ACCESS_SECRET=your-access-token-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars-different
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Logging
LOG_LEVEL=info

# Code Execution
PISTON_API_URL=http://localhost:2000
CODE_EXECUTION_TIMEOUT=10000
CODE_SIZE_LIMIT=102400
MAX_TEST_CASES_PER_PROBLEM=50

# Rate Limiting
SUBMISSION_RATE_LIMIT=5
PROBLEM_CREATION_RATE_LIMIT=3
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.fugallabs.com
# Or for development:
# NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 🎓 Onboarding Checklist for New Developers

When onboarding a second developer later:

- [ ] Clone repo: `git clone https://github.com/fugallabs/platform.git`
- [ ] Install dependencies: `cd Backend && pnpm install` + `cd Frontend && pnpm install`
- [ ] Copy `.env` files (get from team lead)
- [ ] Start MongoDB Atlas cluster (or use local MongoDB)
- [ ] Run backend: `cd Backend && pnpm dev`
- [ ] Run frontend: `cd Frontend && pnpm dev`
- [ ] Read this plan.md + leet.md
- [ ] Review code structure (models → services → controllers → routes)
- [ ] Make a test problem submission
- [ ] Enroll in a test course
- [ ] Ask questions in team Slack/Discord

---

## 📞 Next Steps

1. **Read** this document thoroughly
2. **Set up** development environment (MongoDB Atlas, Docker for Piston)
3. **Start** with Phase 0 (authentication refactor)
4. **Follow** phases sequentially (don't skip ahead)
5. **Test** each phase before moving to next
6. **Document** any deviations from plan
7. **Update** this plan.md as you learn

---

## 📝 Notes

- This is a **living document** - update as implementation evolves
- Prioritize **shipping over perfection** for MVP
- **Ask for help** in Discord/Slack when stuck >30 mins
- **Celebrate** small wins (each completed phase)
- Remember: **Simple, working code > complex, perfect code**

---

**Good luck building Fugal Labs! 🚀**

_For detailed implementation of Problems route, refer to [leet.md](leet.md)_
