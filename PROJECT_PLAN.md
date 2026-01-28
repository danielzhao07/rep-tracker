# Rep Tracker Project Plan

## Executive Summary

A professional, production-ready fitness rep tracker using computer vision (MediaPipe Pose) to automatically count reps during workouts. The app will feature a minimalistic dark theme (black, gray, green accents), accurate pose detection, video replay capabilities, form analysis, and comprehensive metrics.

---

## Clarified Requirements (User Input)

### MVP Scope
- **Primary Target**: Desktop/Laptop (responsive design, but optimized for desktop first)
- **Exercise Priority**: Push-ups ONLY for MVP (get one exercise perfect before expanding)
- **Timeline**: 3-4 weeks balanced approach
- **Authentication**: Email/password login required (Supabase Auth)
- **Data Storage**: Full cloud sync (videos + metadata via Supabase)
- **Privacy**: Private workouts only (no sharing features in MVP)

### User Experience Requirements
- Option to track exercise by camera OR manual entry
- Video replay after workout completion
- Option to save workout (with video) or discard
- Real-time form feedback and metrics
- Editable rep count after completing workout
- Camera setup time (countdown: 5 seconds)
- Audio cues before and when workout starts
- Pause/End controls during workout
- Accurate and precise rep detection

### Design Requirements
- Minimalistic colors: Green (#10b981), Black (#000000), Gray shades
- Dark theme ONLY (no light mode for MVP)
- Minimal gradients (use sparingly)
- 1-2 accent colors maximum
- Clean typography (Inter font family)
- Good spacing and breathing room
- Minimalist icons (lucide-react)
- NO cluttered layouts, NO Comic Sans, NO Bootstrap generic look, NO excessive animations

---

## Tech Stack Summary (Quick Reference)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | React 18 + TypeScript | Component architecture, type safety |
| **Build Tool** | Vite | Fast dev server, optimized builds |
| **Styling** | TailwindCSS | Utility-first, minimalistic dark theme |
| **State Management** | Zustand | Lightweight client state (camera, workout) |
| **Server State** | React Query (TanStack) | Supabase data caching, optimistic updates |
| **Backend** | Supabase | Auth, PostgreSQL database, file storage |
| **Computer Vision** | MediaPipe Pose | 33-point pose detection, rep counting |
| **Video** | MediaRecorder API | Browser-native video recording |
| **Audio** | Web Audio API | Text-to-speech countdown cues |
| **Charts** | Recharts | Minimalistic progress visualization |
| **Icons** | lucide-react | Minimalist icon library |
| **Testing** | Vitest + Playwright | Unit, integration, E2E tests |
| **Deployment** | Vercel | Serverless hosting, CI/CD |

### Key Dependencies (package.json)
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.0",
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/auth-helpers-react": "^0.5.0",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.5.0",
    "@mediapipe/pose": "^0.5.1675469404",
    "@mediapipe/camera_utils": "^0.3.1675466862",
    "recharts": "^2.12.0",
    "lucide-react": "^0.338.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^1.2.0",
    "@playwright/test": "^1.41.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0"
  }
}
```

---

## MCP Integration Strategy

### Available MCP Servers
1. **Context7** - Documentation and API reference lookups
2. **GitHub** - Version control operations, PR management
3. **Playwright** - End-to-end testing, browser automation
4. **Brave Search** - Technical documentation searches, best practices research
5. **File System** - File operations and project structure management
6. **Chrome DevTools** - Performance profiling, debugging pose detection pipeline
7. **Supabase** - Direct Supabase project management, database queries, storage operations

### Supabase MCP Capabilities
- Execute SQL queries directly on Supabase database
- Manage database tables, columns, indexes
- Set up and test row-level security (RLS) policies
- Manage Supabase Storage buckets and files
- View project configuration and settings
- Test authentication flows
- Debug database performance

**Use Cases in This Project**:
- Create database schema (exercises, workouts, workout_reps tables)
- Set up RLS policies to ensure users only see their own data
- Configure storage bucket for workout videos
- Query workout data for testing and debugging
- Validate data integrity during development

### MCP Usage Plan by Phase

#### Development Phase
- **Supabase MCP**: Create database tables, set up row-level security policies, configure storage buckets
- **Brave Search**: Research MediaPipe Pose best practices, rep counting algorithms, pose detection thresholds
- **Context7**: Quick access to MediaPipe API docs, React hooks patterns, TypeScript definitions, Supabase SDK documentation
- **File System**: Scaffold project structure, manage assets and video files

#### Implementation Phase
- **Supabase MCP**: Query database directly, test RLS policies, manage storage buckets, debug authentication flows
- **GitHub**: Commit management, branch strategy, PR reviews
- **Chrome DevTools**: Profile pose detection performance, optimize video processing pipeline, debug canvas rendering
- **File System**: Manage video recordings, exercise presets, local development files

#### Testing Phase
- **Supabase MCP**: Verify RLS policies work correctly, test data access permissions, validate storage uploads
- **Playwright**: Automated E2E tests for camera permissions, rep counting accuracy, video recording flows
- **Chrome DevTools**: Performance testing under different lighting conditions, frame rate monitoring
- **Context7**: Reference testing best practices for computer vision applications, Supabase testing patterns

#### Deployment Phase
- **Supabase MCP**: Configure production environment variables, set up CORS policies, validate database migrations
- **GitHub**: CI/CD pipeline setup, automated deployments
- **Playwright**: Pre-deployment smoke tests
- **Brave Search**: Research hosting options for MediaPipe applications, WASM optimization, Vercel + Supabase integration

### MCP Quick Reference (Use During Implementation)

| Task | MCP Server | Tool/Command |
|------|-----------|-------------|
| Look up MediaPipe API | Context7 | `resolve-library-id` then `query-docs` |
| Look up Supabase SDK docs | Context7 | `resolve-library-id` then `query-docs` |
| Look up React/TailwindCSS docs | Context7 | `resolve-library-id` then `query-docs` |
| Create DB tables | Supabase | `apply_migration` or `execute_sql` |
| Test RLS policies | Supabase | `execute_sql` |
| Configure storage bucket | Supabase | Use Supabase MCP tools |
| Get project URL/keys | Supabase | `get_project_url`, `get_publishable_keys` |
| Search for best practices | Brave Search | `brave_web_search` |
| Run E2E tests | Playwright | Browser automation tools |
| Profile performance | Chrome DevTools | Performance trace tools |
| Git operations | GitHub | PR/commit/branch tools |

**IMPORTANT**: Always use Context7 (`resolve-library-id` + `query-docs`) to look up current API documentation before implementing unfamiliar library integrations. Always use Supabase MCP for database operations instead of manual SQL in the dashboard.

---

## Architecture Design

### Abstraction Layers

```
Presentation Layer (React)
  - UI Components (buttons, cards, layouts)
  - Pages (Login, Home, Workout, History)
  - Design System (tokens, spacing, typography)

Application/Business Logic Layer
  - Exercise State Management (Zustand)
  - Auth State Management (Zustand + Supabase)
  - Rep Counting State Machine
  - Workout Session Orchestrator
  - Form Validation Rules

Core Services Layer
  - PoseDetectionService (MediaPipe wrapper)
  - RepCounterService (algorithm logic)
  - VideoRecordingService (MediaRecorder)
  - AudioCueService (TTS + audio playback)
  - MetricsCalculatorService (form analysis)
  - AuthService (Supabase Auth wrapper)

Data Access Layer (API Layer)
  - WorkoutRepository (Supabase queries)
  - VideoStorageRepository (Supabase Storage)
  - UserRepository (user profile CRUD)
  - SupabaseClient (singleton instance)

Infrastructure Layer
  - Browser APIs (Camera, MediaRecorder, Canvas)
  - MediaPipe WASM Runtime
  - Supabase Backend (Auth, PostgreSQL, Storage)
  - React Query (server state caching)
```

---

## Component Hierarchy

```
App
├── SupabaseProvider (context for auth state)
├── Router
│   ├── LoginPage
│   │   ├── LoginForm
│   │   └── SignUpLink
│   │
│   ├── SignUpPage
│   │   └── SignUpForm
│   │
│   ├── ProtectedRoute (wrapper requiring auth)
│   │
│   ├── HomePage (protected)
│   │   ├── ExerciseLibrarySection
│   │   │   ├── ExerciseCard (repeatable)
│   │   │   └── SearchBar
│   │   └── QuickStartButton
│   │
│   ├── WorkoutPage
│   │   ├── CameraSetupModal
│   │   │   ├── CountdownTimer (3-2-1-Go)
│   │   │   └── AudioToggle
│   │   ├── WorkoutActiveView
│   │   │   ├── VideoFeed (camera + pose overlay)
│   │   │   ├── RepCounter (large display)
│   │   │   ├── TimerDisplay
│   │   │   ├── FormFeedbackPanel
│   │   │   └── ControlBar
│   │   │       ├── PauseButton
│   │   │       ├── EndButton
│   │   │       └── ManualAdjustButton
│   │   └── WorkoutCompleteView
│   │       ├── VideoReplayPlayer
│   │       ├── WorkoutSummary
│   │       │   ├── RepCountDisplay (editable)
│   │       │   ├── DurationDisplay
│   │       │   ├── FormScoreCard
│   │       │   └── MetricsGrid
│   │       └── ActionButtons
│   │           ├── SaveButton
│   │           ├── DiscardButton
│   │           └── RetryButton
│   │
│   ├── ManualEntryPage
│   │   ├── ExerciseSelector
│   │   ├── RepInput
│   │   ├── WeightInput
│   │   └── NotesInput
│   │
│   ├── HistoryPage
│   │   ├── WorkoutHistoryList
│   │   │   └── WorkoutHistoryCard (repeatable)
│   │   └── FilterControls
│   │
│   └── AnalyticsPage
│       ├── ProgressCharts
│       └── PersonalRecords
│
├── SharedComponents
│   ├── Button (primary, secondary, ghost variants)
│   ├── Card (dark background, subtle border)
│   ├── Modal
│   ├── Toast (notifications)
│   ├── LoadingSpinner
│   └── Icon (minimalist, from lucide-react)
│
└── Layout
    ├── NavBar
    └── PageContainer
```

---

## State Management (Zustand Stores)

### AuthStore
- user, session, isLoading, error
- signIn, signUp, signOut, refreshSession

### WorkoutStore
- isActive, isPaused, currentExercise, startTime
- repCount, repHistory, currentRepPhase
- isCameraReady, cameraError, videoStream
- isRecording, recordingBlob
- formFeedback, formScore
- startWorkout, pauseWorkout, resumeWorkout, endWorkout
- incrementRep, decrementRep, updateFormFeedback

### CameraStore
- devices, selectedDevice, stream, permissions
- initializeCamera, stopCamera, switchCamera

### HistoryStore
- workouts, filters
- loadWorkouts, saveWorkout, deleteWorkout, updateFilters

---

## Pose Detection Logic (Push-ups)

### Key Landmarks
- LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST, LEFT_HIP, LEFT_KNEE

### Rep Counting State Machine
```
START → TOP (extended) → ECCENTRIC (lowering) → BOTTOM [REP++] → CONCENTRIC (raising) → TOP (repeat)
```

### Thresholds
- Bottom: elbow angle < 90 degrees
- Top: elbow angle > 160 degrees
- Good form: body alignment (shoulder-hip-knee) >= 160 degrees
- Warning: body alignment 140-160 degrees
- Poor form: body alignment < 140 degrees (hip sag)

---

## Database Schema (Supabase)

### exercises table
- id (UUID PK), name, category, description, thumbnail_url, detector_type, created_at

### workouts table
- id (UUID PK), user_id (FK auth.users), exercise_id (FK exercises), rep_count, duration_ms
- form_score, avg_time_per_rep, video_url, manual_entry, notes, created_at
- RLS: Users can only CRUD their own workouts

### workout_reps table
- id (UUID PK), workout_id (FK workouts), rep_number, duration_ms
- quality, form_score, feedback (JSONB), created_at
- RLS: Inherited from workout ownership

---

## Design System

### Color Palette
- black: #000000
- darkGray.900: #0a0a0a, .800: #1a1a1a, .700: #2a2a2a
- gray.600: #3a3a3a, .500: #4a4a4a, .400: #6a6a6a, .300: #8a8a8a
- green.500: #10b981 (primary), .600: #059669 (hover), .400: #34d399 (success)
- error: #ef4444, warning: #f59e0b

### Typography
- Font family: Inter, system-ui, sans-serif
- Mono: JetBrains Mono, monospace
- Sizes: xs 12px, sm 14px, base 16px, lg 18px, xl 20px, 2xl 24px, 4xl 36px, 6xl 60px

### Spacing
- Card padding: 16-24px
- Section gaps: 24-32px
- Component internal: 8-12px
- Page margins: 24-48px
- Border radius: 8px (rounded-lg)

---

## Project Structure
```
rep-tracker-project/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── WorkoutPage.tsx
│   │   ├── ManualEntryPage.tsx
│   │   ├── HistoryPage.tsx
│   │   └── AnalyticsPage.tsx
│   ├── components/
│   │   ├── workout/
│   │   │   ├── CameraSetupModal.tsx
│   │   │   ├── WorkoutActiveView.tsx
│   │   │   ├── VideoFeed.tsx
│   │   │   ├── RepCounter.tsx
│   │   │   ├── FormFeedbackPanel.tsx
│   │   │   └── WorkoutCompleteView.tsx
│   │   ├── exercise/
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── ExerciseLibrary.tsx
│   │   │   └── ExerciseSelector.tsx
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       └── LoadingSpinner.tsx
│   ├── services/
│   │   ├── pose/
│   │   │   ├── PoseDetectionService.ts
│   │   │   ├── RepCounterService.ts
│   │   │   ├── detectors/
│   │   │   │   ├── PushupDetector.ts
│   │   │   │   └── BaseDetector.ts
│   │   │   └── utils/
│   │   │       ├── angleCalculation.ts
│   │   │       └── landmarkUtils.ts
│   │   ├── video/
│   │   │   └── VideoRecordingService.ts
│   │   ├── audio/
│   │   │   └── AudioCueService.ts
│   │   └── metrics/
│   │       └── MetricsCalculatorService.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── workoutStore.ts
│   │   ├── cameraStore.ts
│   │   └── historyStore.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── supabaseTypes.ts
│   ├── repositories/
│   │   ├── WorkoutRepository.ts
│   │   ├── VideoStorageRepository.ts
│   │   └── UserRepository.ts
│   ├── types/
│   │   ├── exercise.ts
│   │   ├── pose.ts
│   │   ├── workout.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useCamera.ts
│   │   ├── usePoseDetection.ts
│   │   ├── useVideoRecording.ts
│   │   └── useAudioCues.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   └── helpers.ts
│   └── styles/
│       └── globals.css
├── public/
│   └── exercise-thumbnails/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── .gitignore
├── .env.local
└── PROJECT_PLAN.md
```

---

## Implementation Phases

### Phase 1: Foundation & Authentication (Days 1-3)
- Initialize Vite + React + TypeScript project
- Set up TailwindCSS with custom theme
- Install all dependencies
- Create project folder structure
- Configure Supabase client and environment variables
- Set up React Router with protected routes
- Create AuthStore and AuthService
- Build LoginPage and SignUpPage
- Create design system components (Button, Card, Modal, Input)

### Phase 2: Camera & Pose Detection (Days 4-6)
- Implement CameraStore
- Create useCamera hook
- Integrate MediaPipe Pose
- Create PoseDetectionService wrapper
- Build VideoFeed component with canvas overlay
- Implement angle calculation utilities

### Phase 3: Rep Counting Logic (Days 7-9)
- Design BaseDetector abstract class
- Implement PushupDetector with state machine
- Create RepCounterService
- Implement form validation logic
- Create MetricsCalculatorService

### Phase 4: Workout Flow (Days 10-12)
- Create WorkoutStore
- Build CameraSetupModal with countdown
- Implement AudioCueService
- Create WorkoutActiveView, RepCounter, FormFeedbackPanel
- Implement pause/resume functionality

### Phase 5: Video Recording & Cloud Upload (Days 13-15)
- Implement VideoRecordingService
- Create VideoStorageRepository
- Implement video upload flow
- Build video replay player

### Phase 6: Workout Completion & Persistence (Days 16-17)
- Create WorkoutCompleteView
- Build WorkoutSummary with editable metrics
- Implement WorkoutRepository
- Implement optimistic updates with React Query

### Phase 7: Manual Entry (Day 18)
- Create ManualEntryPage with forms

### Phase 8: History & Analytics (Days 19-20)
- Create HistoryPage with workout list
- Create AnalyticsPage with Recharts

### Phase 9: Polish & UX (Days 21-22)
- Refine UI, loading states, toast notifications, error handling

### Phase 10: Testing & Deployment (Days 23-24)
- E2E tests, performance profiling, deploy to Vercel

---

## Document Version

**Version**: 1.0 (Initial Plan)
**Last Updated**: 2026-01-28
**Status**: Ready for Implementation
