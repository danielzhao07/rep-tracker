# Development Guide - Rep Tracker Project

## ⚠️ CRITICAL: MediaPipe API Requirements

### 🚨 READ THIS FIRST - SAVES 3+ HOURS OF DEBUGGING

This project uses the **MODERN MediaPipe Tasks Vision API**. Using the legacy API will result in:
- ❌ Skeleton not rendering on video feed
- ❌ Rep counting not working (stuck at 0)
- ❌ Pose detection failures
- ❌ 3+ hours of wasted debugging time

---

## MediaPipe Package Requirements

### ✅ CORRECT Package (Use This)

```json
"@mediapipe/tasks-vision": "^0.10.14"
```

**Imports:**
```typescript
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision'
```

### ❌ WRONG Packages (NEVER Use These)

```json
// DEPRECATED - DO NOT USE
"@mediapipe/pose": "^0.5.1675469404"
"@mediapipe/camera_utils": "^0.3.1675466862"
"@mediapipe/drawing_utils": "^0.3.1675466124"
```

**Why these are wrong:**
- Released in 2022 and abandoned
- No longer maintained or supported
- Broken on modern browsers
- Different architecture than current MediaPipe

---

## Required Documentation References

**When working on pose detection or rep counting, ALWAYS consult:**

1. **[MediaPipe Tasks Vision - Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)**
   - Overview and concepts
   - Model information

2. **[Pose Landmarker Web Guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js)**
   - JavaScript/TypeScript implementation
   - API usage and configuration
   - **THIS IS THE PRIMARY REFERENCE**

3. **[Working CodePen Example](https://codepen.io/mediapipe-preview/pen/abRLMxN)**
   - Live demo with full source code
   - Shows skeleton drawing with DrawingUtils
   - Real-time video detection

4. **[PoseLandmarker API Reference](https://developers.google.com/mediapipe/api/solutions/js/tasks-vision.poselandmarker)**
   - Complete API documentation
   - Method signatures and types

---

## Key Architecture Differences

### Python (Working Reference Implementation)
```python
from mediapipe import tasks
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Initialize
base_options = tasks.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.LIVE_STREAM,
    result_callback=callback
)
landmarker = vision.PoseLandmarker.create_from_options(options)

# Detect
landmarker.detect_async(mp_image, timestamp_ms)
```

### JavaScript (This Project - Modern API)
```typescript
// Initialize
const vision = await FilesetResolver.forVisionTasks(
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
)
const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: 'https://storage.googleapis.com/.../pose_landmarker_lite.task',
    delegate: 'GPU'
  },
  runningMode: 'VIDEO',
  numPoses: 1
})

// Detect
const results = poseLandmarker.detectForVideo(videoElement, timestamp)
```

### API Equivalents

| Python | JavaScript | Description |
|--------|-----------|-------------|
| `vision.PoseLandmarker` | `PoseLandmarker` | Main pose detection class |
| `RunningMode.LIVE_STREAM` | `runningMode: 'VIDEO'` | Real-time video mode |
| `detect_async(image, ts)` | `detectForVideo(video, ts)` | Frame detection method |
| `result.pose_landmarks[0]` | `results.landmarks[0]` | First person's landmarks |
| `landmark.x, .y, .z` | `landmark.x, .y, .z` | Same coordinate structure |

---

## Critical Files

### Pose Detection Logic
- **`src/services/pose/PoseDetectionService.ts`**
  - Uses MediaPipe Tasks Vision API
  - DO NOT modify to use legacy API
  - Contains reference links in comments

### Rep Counting Logic
- **`src/services/pose/detectors/PushupDetector.ts`**
  - Simple up/down stage machine
  - Matches Python `rep_logic()` function
  - Thresholds: 150° (up), 130° (down)

### Dependencies
- **`package.json`**
  - Must have `@mediapipe/tasks-vision`
  - Must NOT have legacy MediaPipe packages

---

## Common Pitfalls & Solutions

### ❌ Skeleton Not Appearing
**Cause:** Using legacy `@mediapipe/drawing_utils`
**Solution:** Use `DrawingUtils` from `@mediapipe/tasks-vision`

```typescript
// ✅ CORRECT
import { DrawingUtils } from '@mediapipe/tasks-vision'
const drawingUtils = new DrawingUtils(canvasCtx)
drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {...})

// ❌ WRONG (legacy)
import { drawConnectors } from '@mediapipe/drawing_utils'
drawConnectors(ctx, landmarks, POSE_CONNECTIONS, {...})
```

### ❌ Rep Count Stuck at 0
**Cause:** Using legacy `Pose` class instead of `PoseLandmarker`
**Solution:** Use `PoseLandmarker.detectForVideo()`

```typescript
// ✅ CORRECT
const results = poseLandmarker.detectForVideo(videoElement, timestamp)

// ❌ WRONG (legacy)
await pose.send({ image: videoElement })
```

### ❌ TypeScript Errors on Import
**Cause:** Legacy packages installed
**Solution:** Remove legacy packages, install modern one

```bash
# Remove legacy
npm uninstall @mediapipe/pose @mediapipe/camera_utils @mediapipe/drawing_utils

# Install modern
npm install @mediapipe/tasks-vision@0.10.14
```

---

## Testing Checklist

After making changes to pose detection:

- [ ] Green skeleton visible on video feed
- [ ] Yellow circles on elbows
- [ ] Console shows: `✅ MediaPipe Tasks Vision PoseLandmarker initialized`
- [ ] Console shows: `📊 Pose detection - Frame XXX, Landmarks: YES (33)`
- [ ] Rep counter increments when doing push-up
- [ ] No TypeScript errors
- [ ] Build completes successfully

---

## AI Agent Instructions

If you are an AI agent working on this codebase:

1. **ALWAYS** read this file before modifying pose detection code
2. **ALWAYS** use `@mediapipe/tasks-vision` (never legacy packages)
3. **ALWAYS** reference the official MediaPipe Tasks Vision docs
4. **NEVER** suggest using `@mediapipe/pose` or other legacy packages
5. **VERIFY** package.json has correct dependencies before coding
6. **CRITICAL: Use MANUAL skeleton drawing approach** (see below)

### 🚨 SKELETON DRAWING: Use Manual Approach Only

**DO NOT use DrawingUtils' drawLandmarks() or drawConnectors() methods directly.**

Even though Google's official examples use:
```typescript
drawingUtils.drawLandmarks(landmarks, { radius: ... })
drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS)
```

**This approach DOES NOT WORK reliably in this project.**

**✅ CORRECT: Manual drawing with visibility filtering**
```typescript
const MIN_VISIBILITY = 0.6

// Draw connections manually
for (const connection of PoseLandmarker.POSE_CONNECTIONS) {
  const startLandmark = landmarks[connection.start]
  const endLandmark = landmarks[connection.end]

  if ((startLandmark?.visibility ?? 0) > MIN_VISIBILITY &&
      (endLandmark?.visibility ?? 0) > MIN_VISIBILITY) {
    this.canvasCtx.beginPath()
    this.canvasCtx.moveTo(startLandmark.x * canvas.width, startLandmark.y * canvas.height)
    this.canvasCtx.lineTo(endLandmark.x * canvas.width, endLandmark.y * canvas.height)
    this.canvasCtx.stroke()
  }
}

// Draw landmark circles manually
for (let i = 0; i < landmarks.length; i++) {
  const lm = landmarks[i]
  if ((lm.visibility ?? 0) > MIN_VISIBILITY) {
    const x = lm.x * canvas.width
    const y = lm.y * canvas.height
    this.canvasCtx.beginPath()
    this.canvasCtx.arc(x, y, radius, 0, 2 * Math.PI)
    this.canvasCtx.fill()
  }
}
```

**Why manual approach:**
- More reliable skeleton rendering
- Explicit visibility control prevents glitching
- Works consistently in this project's environment
- DrawingUtils methods caused skeleton to stop rendering

See `src/services/pose/PoseDetectionService.ts` lines 199-298 for the complete working implementation.

---

---

## Database Setup & Common Issues

### 🚨 CRITICAL: Database Migrations Must Be Applied

After creating your Supabase project, you MUST run all migrations in order. Failing to do this will cause workout saves to fail.

#### Required Migrations (Run in Order)

1. **`001_initial_schema.sql`** - Creates core tables and seeds exercises
   - Creates: `exercises`, `workouts`, `workout_reps` tables
   - Seeds: Push-ups, Bicep Curls (Both Arms), Alternating Bicep Curls, Squats
   - Sets up: Storage bucket for workout videos

2. **`002_frontend_redesign_schema.sql`** - Adds user preferences & routines
   - Creates: `routines`, `routine_exercises`, `user_goals`, `user_preferences` tables

3. **`003_exercises_rls_safe.sql`** - Adds RLS policy for exercises table
   - Enables RLS on exercises table
   - Creates policy: "Anyone can view exercises"

#### How to Apply Migrations

**Option 1: Supabase Dashboard (Recommended for First Time)**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click "Run"
4. Repeat for `002_frontend_redesign_schema.sql`
5. Repeat for `003_exercises_rls_safe.sql`

**Option 2: Supabase CLI**
```bash
# Link your project (one-time setup)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
npx supabase db push
```

#### Verify Migrations Worked

Run this in Supabase SQL Editor:
```sql
-- Should show 4 exercises
SELECT id, name, detector_type FROM exercises ORDER BY name;

-- Should show RLS policy exists
SELECT policyname FROM pg_policies WHERE tablename = 'exercises';
```

### Common Error: "Key is not present in table exercises"

**Error Message:**
```
❌ Supabase insert error: {
  code: '23503',
  details: 'Key is not present in table "exercises".',
  message: 'insert or update on table "workouts" violates foreign key constraint "workouts_exercise_id_fkey"'
}
```

**Cause:** The exercises table is missing data or RLS is blocking access.

**Solution:** Run `supabase/fix_missing_exercises.sql` in Supabase SQL Editor:
```sql
-- This file inserts all exercises and fixes RLS policy
-- Located at: supabase/fix_missing_exercises.sql
```

After running, verify:
```sql
SELECT id, name FROM exercises ORDER BY name;
```
Should return:
- Alternating Bicep Curls (`b3c4d5e6-f7a8-9012-bcde-f12345678902`)
- Bicep Curls (Both Arms) (`b2c3d4e5-f6a7-8901-bcde-f12345678901`)
- Push-ups (`a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- Squats (`c3d4e5f6-a7b8-9012-cdef-123456789012`)

### Exercise IDs Reference

When implementing new detectors, use these exact IDs:

```typescript
export const EXERCISE_IDS = {
  PUSHUPS: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  BICEP_CURL_BOTH: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  BICEP_CURL_ALTERNATING: 'b3c4d5e6-f7a8-9012-bcde-f12345678902',
  SQUATS: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
} as const
```

### Troubleshooting Checklist

If workouts won't save:
- [ ] Check browser console for `❌ Supabase insert error`
- [ ] Verify exercises exist: `SELECT * FROM exercises`
- [ ] Check RLS policy exists: `SELECT * FROM pg_policies WHERE tablename = 'exercises'`
- [ ] Run `fix_missing_exercises.sql` if exercises are missing
- [ ] Verify Supabase environment variables in `.env.local` are correct

---

## Version History

- **2025-01-30**: Added database setup section and troubleshooting guide
  - Documented migration requirements
  - Added fix for missing exercises error
  - Added exercise IDs reference

- **2025-01-28**: Migrated from legacy `@mediapipe/pose` to modern `@mediapipe/tasks-vision`
  - Fixed skeleton rendering
  - Fixed rep counting
  - Added GPU acceleration
  - Improved performance and reliability
