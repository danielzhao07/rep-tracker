/**
 * Push-up detection thresholds
 * Adapted from working Python implementation using same values
 *
 * Your Python code: rep_logic(120, 160, angle)
 * - angle > 160 = UP position (arms extended)
 * - angle < 120 = DOWN position (arms bent)
 */
export const PUSHUP_THRESHOLDS = {
  // Original working thresholds from Python implementation
  ELBOW_ANGLE_TOP: 155,    // Arms extended = UP position (slightly relaxed from 160 for better detection)
  ELBOW_ANGLE_BOTTOM: 120, // Arms bent = DOWN position (original value)

  // Body alignment thresholds for form validation
  BODY_ALIGNMENT_GOOD: 160,
  BODY_ALIGNMENT_WARNING: 140,

  // Push-up position validation thresholds (prevent cheating while standing/sitting)
  MAX_SHOULDER_HIP_Y_DIFF: 0.25,    // Shoulders and hips at similar height (25% of frame) - stricter
  MIN_WRIST_VISIBILITY: 0.4,        // Wrists should be visible (40% confidence)
  MIN_KNEE_ANGLE: 150,              // Knees must be mostly straight (prevents knee push-ups)

  // Anti-cheating validation
  MIN_SHOULDER_VERTICAL_MOVEMENT: 0.015,  // Shoulders must move down at least 1.5% (relaxed, just prevents arm-only)
  MAX_ELBOW_ANGLE_DIFF: 50,               // Both elbows within 50° (relaxed from 45°)

  // Inactivity warning
  INACTIVITY_WARNING_MS: 10000,  // Warn if no reps detected for 10 seconds
} as const

export const BICEP_CURL_THRESHOLDS = {
  // Elbow angle thresholds (simple and reliable)
  ELBOW_ANGLE_EXTENDED: 140,  // Arms down/extended position
  ELBOW_ANGLE_CURLED: 80,     // Arms curled up position

  // Arm synchronization (for regular bicep curls)
  MAX_ELBOW_ANGLE_DIFF: 50,   // Both arms should curl similarly

  // Inactivity warning
  INACTIVITY_WARNING_MS: 10000,
} as const

export const ALTERNATING_BICEP_CURL_THRESHOLDS = {
  // Same angle thresholds as regular bicep curls
  ELBOW_ANGLE_EXTENDED: 140,  // Arms down/extended position
  ELBOW_ANGLE_CURLED: 80,     // Arms curled up position

  // Inactivity warning
  INACTIVITY_WARNING_MS: 10000,
} as const

export const SQUAT_THRESHOLDS = {
  // Side view: Knee and hip angle thresholds
  KNEE_ANGLE_STANDING: 165,   // Knees extended when standing
  KNEE_ANGLE_SQUATTING: 100,  // Knees bent when squatting (below parallel)
  HIP_ANGLE_STANDING: 165,    // Hips extended when standing
  HIP_ANGLE_SQUATTING: 100,   // Hips bent when squatting

  // Front view: Hip vertical position thresholds
  MIN_HIP_DROP_FRONT: 0.15,   // Hips must drop at least 15% of frame height (front view)

  // View detection
  MIN_HIP_WIDTH_FRONT: 0.12,  // Hip distance threshold for front view (12% of frame)

  // Position validation (prevent cheating)
  MAX_KNEE_ANGLE_DIFF: 35,           // Both knees should move together (relaxed from 30)
  MIN_KNEE_VISIBILITY: 0.5,          // Knees should be visible
  MIN_HIP_DEPTH: 0.13,               // Hips must drop at least 13% of frame height (side view)
  MAX_TORSO_LEAN: 120,               // Torso shouldn't lean too far forward (relaxed from 130)

  // Inactivity warning
  INACTIVITY_WARNING_MS: 10000,
} as const

export const COUNTDOWN_PHASES = [
  { duration: 2000, display: 'Position yourself in frame', audio: null },
  { duration: 2000, display: 'Get ready...', audio: 'Get ready' },
  { duration: 1000, display: '3', audio: '3' },
  { duration: 1000, display: '2', audio: '2' },
  { duration: 1000, display: '1', audio: '1' },
  { duration: 500, display: 'GO!', audio: 'Go!' },
] as const

export const EXERCISES_SEED = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Push-ups',
    category: 'upper-body' as const,
    description: 'Classic push-up exercise targeting chest, triceps, and shoulders.',
    thumbnailUrl: null,
    detectorType: 'pushup' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Bicep Curls (Both Arms)',
    category: 'upper-body' as const,
    description: 'Bicep curl exercise with both arms curling together. Tracks reps when both arms complete the curl.',
    thumbnailUrl: null,
    detectorType: 'bicep-curl' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b3c4d5e6-f7a8-9012-bcde-f12345678902',
    name: 'Alternating Bicep Curls',
    category: 'upper-body' as const,
    description: 'Alternating bicep curls where each arm curls independently. Tracks left and right arm reps separately.',
    thumbnailUrl: null,
    detectorType: 'alternating-bicep-curl' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Squats',
    category: 'lower-body' as const,
    description: 'Bodyweight squat exercise targeting quads, glutes, and hamstrings.',
    thumbnailUrl: null,
    detectorType: 'squat' as const,
    createdAt: new Date().toISOString(),
  },
]

export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  HOME: '/',
  WORKOUT: '/workout',
  MANUAL_ENTRY: '/manual-entry',
  HISTORY: '/history',
  EXERCISES: '/exercises',
  PROFILE: '/profile',
  WORKOUT_START: '/workout/start',
} as const
