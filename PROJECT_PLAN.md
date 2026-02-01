# Rep Tracker - Project Plan

## Overview

A production-ready fitness rep tracker using computer vision (MediaPipe Tasks Vision) for automatic rep counting with form analysis. Features a minimalistic dark theme with real-time feedback and cloud sync.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | Component architecture |
| Build | Vite | Fast builds and HMR |
| Styling | TailwindCSS | Utility-first dark theme |
| State | Zustand | Client state management |
| Server State | React Query | Caching and optimistic updates |
| Backend | Supabase | Auth, database, file storage |
| Vision | MediaPipe Tasks Vision | 33-point pose detection |
| Video | MediaRecorder API | Browser-native recording |
| Audio | Web Audio API | Countdown and cue playback |
| Charts | D3.js | Data visualization |
| Icons | Lucide React | Minimalist icons |

---

## MediaPipe API Requirements

**Use:** `@mediapipe/tasks-vision` (modern, supported)

**Do not use:** Legacy packages (`@mediapipe/pose`, `@mediapipe/camera_utils`, `@mediapipe/drawing_utils`)

See [DEVELOPMENT.md](DEVELOPMENT.md) for implementation details.

---

## Architecture

```
Presentation Layer (React)
├── UI Components
├── Pages
└── Design System

Application Layer
├── State Management (Zustand)
├── Rep Counting State Machine
└── Workout Session Orchestrator

Services Layer
├── PoseDetectionService
├── RepCounterService
├── VideoRecordingService
├── AudioCueService
└── MetricsCalculatorService

Data Layer
├── WorkoutRepository
├── VideoStorageRepository
└── UserRepository

Infrastructure
├── Browser APIs
├── MediaPipe WASM
└── Supabase Backend
```

---

## Component Hierarchy

```
App
├── Router
│   ├── LoginPage / SignUpPage
│   ├── HomePage
│   │   └── ExerciseLibrary
│   ├── WorkoutPage
│   │   ├── CameraSetupModal
│   │   ├── WorkoutActiveView
│   │   │   ├── VideoFeed
│   │   │   ├── RepCounter
│   │   │   └── FormFeedbackPanel
│   │   └── WorkoutCompleteView
│   ├── ManualEntryPage
│   ├── HistoryPage
│   ├── AnalyticsPage
│   └── ProfilePage
└── SharedComponents
    ├── Button, Card, Modal
    ├── Toast, LoadingSpinner
    └── NavBar, PageContainer
```

---

## State Management (Zustand)

### AuthStore
- User session and authentication state

### WorkoutStore
- Active workout state (exercise, reps, form score)
- Camera and recording state
- Pose detection results

### WorkoutSessionStore
- Multi-exercise session tracking
- Saved videos management
- Session completion state

### HistoryStore
- Workout history with filters
- CRUD operations

### ProfileStore
- User preferences
- Goals management

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| exercises | Exercise definitions (seeded) |
| workouts | Individual workout entries |
| workout_reps | Per-rep metrics (optional) |
| workout_sessions | Multi-exercise sessions |
| routines | User-created routines |
| user_goals | Goal tracking |
| user_preferences | User settings |

### Storage

- **Bucket:** `workout-videos`
- **Structure:** `{user_id}/{workout_id}.webm`
- **Limits:** 100MB per file

---

## Design System

### Colors
- Background: #000000, #0a0a0a, #1a1a1a
- Surface: #2a2a2a, #3a3a3a
- Text: #ffffff, #8a8a8a
- Primary: #10b981 (green)
- Error: #ef4444
- Warning: #f59e0b

### Typography
- Font: Inter, system-ui
- Mono: JetBrains Mono

### Spacing
- Card padding: 16-24px
- Section gaps: 24-32px
- Border radius: 8px

---

## Rep Detection Logic

### Push-ups
- Track elbow angle (both arms)
- Down: angle < 90 degrees
- Up: angle > 160 degrees
- Validate body alignment and movement

### Bicep Curls
- Track elbow angle
- Down: angle > 150 degrees
- Up: angle < 50 degrees
- Both arms or alternating modes

### Squats
- Track hip drop (front view) or knee angle (side view)
- Auto-calibrate standing position
- Validate depth before counting

---

## Project Structure

```
src/
├── components/
│   ├── workout/
│   ├── exercise/
│   ├── profile/
│   └── shared/
├── services/
│   ├── pose/
│   │   ├── PoseDetectionService.ts
│   │   ├── RepCounterService.ts
│   │   └── detectors/
│   ├── video/
│   ├── audio/
│   └── metrics/
├── store/
├── repositories/
├── hooks/
├── pages/
├── types/
├── utils/
└── styles/
```

---

## Deployment

### Platform
- **Hosting:** Vercel
- **Backend:** Supabase
- **Domain:** Custom domain via DNS configuration

### Environment Variables
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Build Command
```bash
npm run build
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-28 | Initial release with push-ups |
| 1.1 | 2026-01-29 | Added bicep curls and squats |
| 1.2 | 2026-01-30 | Database setup documentation |
| 1.3 | 2026-02-01 | Production-ready cleanup |
