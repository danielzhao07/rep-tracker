# Rep Tracker - AI-Powered Fitness Tracker

Computer vision-powered fitness tracker using MediaPipe Tasks Vision for automatic push-up rep counting.

## ⚠️ CRITICAL FOR DEVELOPERS & AI AGENTS

**This project uses MediaPipe Tasks Vision API (modern) - NOT the legacy API.**

Before working on pose detection or rep counting:
1. **Read `DEVELOPMENT.md`** - Contains critical API information
2. **Use `@mediapipe/tasks-vision`** - Never use legacy packages
3. **Reference official docs** - Links in DEVELOPMENT.md

### Quick Start

```bash
# Install dependencies
npm install

# Set up Supabase database
# 1. Create a Supabase project
# 2. Run ALL migrations in supabase/migrations/ in order (001, 002, etc.)
# 3. If exercises are missing, run: supabase/fix_missing_exercises.sql
# See "Database Setup" section below for details

# Start dev server
npm run dev

# Build for production
npm run build
```

### Database Setup

**IMPORTANT:** After creating your Supabase project, you MUST run all migrations:

1. **Run migrations in order:**
   - `001_initial_schema.sql` - Creates tables and seeds exercises
   - `002_frontend_redesign_schema.sql` - Adds user preferences & routines
   - `003_exercises_rls_safe.sql` - Adds RLS policy for exercises

2. **If workouts won't save (foreign key error):**
   - Run `supabase/fix_missing_exercises.sql` in Supabase SQL Editor
   - This inserts missing exercises and fixes RLS policies
   - **Symptoms:** "Key is not present in table exercises" error

3. **Verify setup:**
   ```sql
   SELECT id, name FROM exercises ORDER BY name;
   ```
   Should show: Push-ups, Bicep Curls (Both Arms), Alternating Bicep Curls, Squats

### Key Technologies

- **React 18 + TypeScript** - Frontend framework
- **MediaPipe Tasks Vision** - Pose detection (⚠️ Modern API only!)
- **Supabase** - Backend & auth
- **TailwindCSS** - Styling
- **Zustand** - State management

### Project Documentation

- **`PROJECT_PLAN.md`** - Complete project specifications
- **`DEVELOPMENT.md`** - Development guide & MediaPipe API requirements ⚠️
- **`.claude/plans/`** - Implementation plans

---

## 🚨 MediaPipe API Warning

**ONLY use:** `@mediapipe/tasks-vision@0.10.14`

**NEVER use:**
- ❌ `@mediapipe/pose` (broken/deprecated)
- ❌ `@mediapipe/camera_utils` (deprecated)
- ❌ `@mediapipe/drawing_utils` (deprecated)

See `DEVELOPMENT.md` for complete details.

---

## Features

- ✅ Real-time pose detection with skeleton visualization
- ✅ Automatic push-up rep counting
- ✅ Video recording with pose overlay
- ✅ Form feedback and scoring
- ✅ Workout history tracking
- ✅ Dark theme UI

## Architecture

```
src/
├── services/pose/
│   ├── PoseDetectionService.ts  # MediaPipe Tasks Vision integration
│   ├── RepCounterService.ts     # Rep counting orchestration
│   └── detectors/
│       └── PushupDetector.ts    # Push-up specific logic
├── components/workout/          # Workout UI components
├── hooks/                       # React hooks
└── store/                       # Zustand state management
```

## License

Private project - All rights reserved
