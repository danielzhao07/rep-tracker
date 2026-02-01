/**
 * Push-up detection thresholds
 * Adapted from working Python implementation using same values
 *
 * Your Python code: rep_logic(120, 160, angle)
 * - angle > 160 = UP position (arms extended)
 * - angle < 120 = DOWN position (arms bent)
 */
export const PUSHUP_THRESHOLDS = {
  // Orig  // Original working thresholds from Python implementation
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

// Squat difficulty modes
export type SquatDifficultyMode = 'easy' | 'ninety-degree' | 'atg'

export const SQUAT_DIFFICULTY_THRESHOLDS = {
  easy: {
    KNEE_ANGLE_SQUATTING: 115,        // Easy - just a slight bend
    KNEE_ANGLE_SQUATTING_EXIT: 125,
    HIP_ANGLE_SQUATTING: 115,
    MIN_HIP_DROP_FRONT: 0.02,         // Very easy front view - just 2% drop
    MIN_HIP_DROP_FRONT_EXIT: 0.01,
  },
  'ninety-degree': {
    KNEE_ANGLE_SQUATTING: 82,         // 90 degree - must reach parallel or below
    KNEE_ANGLE_SQUATTING_EXIT: 92,
    HIP_ANGLE_SQUATTING: 82,
    MIN_HIP_DROP_FRONT: 0.10,         // Slightly easier for front view
    MIN_HIP_DROP_FRONT_EXIT: 0.07,
  },
  atg: {
    KNEE_ANGLE_SQUATTING: 78,         // ATG - must go well below 90° (parallel)
    KNEE_ANGLE_SQUATTING_EXIT: 85,
    HIP_ANGLE_SQUATTING: 78,
    MIN_HIP_DROP_FRONT: 0.16,         // 16% hip drop required for front view
    MIN_HIP_DROP_FRONT_EXIT: 0.12,
  },
} as const

export const SQUAT_THRESHOLDS = {
  // Side view: Knee angle thresholds (default to 90-degree mode)
  KNEE_ANGLE_STANDING: 160,         // Knees extended when standing
  KNEE_ANGLE_STANDING_EXIT: 150,    // Hysteresis: still standing until below this
  KNEE_ANGLE_SQUATTING: 95,         // Default: 90 degree mode
  KNEE_ANGLE_SQUATTING_EXIT: 105,   // Hysteresis: still squatting until above this

  // Side view: Hip angle thresholds (backup detection)
  HIP_ANGLE_STANDING: 160,          // Hips extended when standing
  HIP_ANGLE_SQUATTING: 95,          // Hips bent when squatting

  // Front view: Hip vertical position thresholds
  MIN_HIP_DROP_FRONT: 0.10,         // Hips must drop at least 10% (RELAXED from 15%)
  MIN_HIP_DROP_FRONT_EXIT: 0.07,    // Hysteresis for front view

  // View detection
  MIN_HIP_WIDTH_FRONT: 0.05,        // Hip distance threshold for front view (lowered for better detection)

  // Position validation (prevent cheating but not too strict)
  MAX_KNEE_ANGLE_DIFF: 45,          // Both knees should move together (RELAXED from 35)
  MIN_KNEE_VISIBILITY: 0.4,         // Knees should be visible (RELAXED from 0.5)
  MIN_HIP_DEPTH: 0.08,              // Hips must drop at least 8% (RELAXED from 13%)
  MAX_TORSO_LEAN: 100,              // Torso shouldn't lean too far (RELAXED from 120)

  // Smoothing and timing
  ANGLE_SMOOTHING_WINDOW: 5,        // Frames to smooth over
  REP_COOLDOWN_MS: 500,             // Minimum time between reps

  // Adaptive calibration
  CALIBRATION_FRAMES: 30,           // Frames to establish standing baseline
  ADAPTIVE_DEPTH_RATIO: 0.60,       // Detect down when 60% of max depth reached

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
  ONBOARDING: '/onboarding',
  LOGIN: '/login',
  SIGNUP: '/signup',
  HOME: '/',
  WORKOUT: '/workout',
  MANUAL_ENTRY: '/manual-entry',
  HISTORY: '/history',
  EXERCISES: '/exercises',
  PROFILE: '/profile',
  WORKOUT_START: '/workout/start',
  WORKOUT_ACTIVE: '/workout/active',
  WORKOUT_SAVE: '/workout/save',
  WORKOUT_CREATE_ROUTINE: '/workout/create-routine',
  WORKOUT_ADD_EXERCISES: '/workout/create-routine/add-exercises',
  WORKOUT_CREATE_EXERCISE: '/workout/create-routine/create-exercise',
} as const