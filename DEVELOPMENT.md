# Development Guide - Rep Tracker

## MediaPipe API Requirements

**Important:** This project uses the modern MediaPipe Tasks Vision API exclusively.

### Correct Package

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

### Do Not Use (Legacy/Deprecated)

The following packages are deprecated and will not work:
- `@mediapipe/pose`
- `@mediapipe/camera_utils`
- `@mediapipe/drawing_utils`

---

## Official Documentation

- [MediaPipe Tasks Vision - Pose Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
- [Pose Landmarker Web Guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js)
- [Working CodePen Example](https://codepen.io/mediapipe-preview/pen/abRLMxN)
- [PoseLandmarker API Reference](https://developers.google.com/mediapipe/api/solutions/js/tasks-vision.poselandmarker)

---

## Initialization Example

```typescript
// Initialize WASM
const vision = await FilesetResolver.forVisionTasks(
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
)

// Create PoseLandmarker
const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: 'https://storage.googleapis.com/.../pose_landmarker_lite.task',
    delegate: 'GPU'
  },
  runningMode: 'VIDEO',
  numPoses: 1
})

// Detect poses
const results = poseLandmarker.detectForVideo(videoElement, timestamp)
```

---

## Critical Files

| File | Purpose |
|------|---------|
| `src/services/pose/PoseDetectionService.ts` | MediaPipe initialization and detection |
| `src/services/pose/RepCounterService.ts` | Rep counting orchestration |
| `src/services/pose/detectors/*.ts` | Exercise-specific detection logic |

---

## Skeleton Drawing

This project uses **manual skeleton drawing** with visibility filtering for reliability.

```typescript
const MIN_VISIBILITY = 0.6

// Draw connections
for (const connection of PoseLandmarker.POSE_CONNECTIONS) {
  const startLandmark = landmarks[connection.start]
  const endLandmark = landmarks[connection.end]

  if ((startLandmark?.visibility ?? 0) > MIN_VISIBILITY &&
      (endLandmark?.visibility ?? 0) > MIN_VISIBILITY) {
    ctx.beginPath()
    ctx.moveTo(startLandmark.x * width, startLandmark.y * height)
    ctx.lineTo(endLandmark.x * width, endLandmark.y * height)
    ctx.stroke()
  }
}

// Draw landmarks
for (const lm of landmarks) {
  if ((lm.visibility ?? 0) > MIN_VISIBILITY) {
    ctx.beginPath()
    ctx.arc(lm.x * width, lm.y * height, radius, 0, 2 * Math.PI)
    ctx.fill()
  }
}
```

---

## Database Setup

### Required Migrations

Run these in Supabase SQL Editor in order:

1. `001_initial_schema.sql` - Core tables and exercise seeds
2. `002_frontend_redesign_schema.sql` - User preferences and routines
3. `003_exercises_rls_safe.sql` - RLS policies for exercises table

### Exercise IDs Reference

```typescript
export const EXERCISE_IDS = {
  PUSHUPS: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  BICEP_CURL_BOTH: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  BICEP_CURL_ALTERNATING: 'b3c4d5e6-f7a8-9012-bcde-f12345678902',
  SQUATS: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
} as const
```

### Common Error: Foreign Key Constraint

**Error:** `Key is not present in table "exercises"`

**Solution:** Run `supabase/fix_missing_exercises.sql`

### Verify Setup

```sql
SELECT id, name FROM exercises ORDER BY name;
```

Should return 4 exercises: Alternating Bicep Curls, Bicep Curls (Both Arms), Push-ups, Squats.

---

## Testing Checklist

After making changes to pose detection:

- [ ] Green skeleton visible on video feed
- [ ] Yellow circles on joints
- [ ] Console shows: "MediaPipe Tasks Vision PoseLandmarker initialized successfully"
- [ ] Rep counter increments correctly
- [ ] No TypeScript errors
- [ ] Build completes successfully

---

## Common Issues

### Skeleton Not Appearing

**Cause:** Using legacy drawing utilities
**Solution:** Use manual drawing with visibility filtering (see above)

### Rep Count Stuck at 0

**Cause:** Using legacy Pose class instead of PoseLandmarker
**Solution:** Use `poseLandmarker.detectForVideo()`

### TypeScript Import Errors

**Cause:** Legacy packages installed
**Solution:** Remove legacy packages, use only `@mediapipe/tasks-vision`

---

## AI Agent Instructions

When working on pose detection code:

1. Always use `@mediapipe/tasks-vision` (never legacy packages)
2. Reference official MediaPipe Tasks Vision documentation
3. Use manual skeleton drawing approach
4. Verify package.json has correct dependencies
5. Test skeleton rendering after changes
