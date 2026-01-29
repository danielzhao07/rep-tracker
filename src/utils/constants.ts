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
