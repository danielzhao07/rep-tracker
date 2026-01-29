/**
 * Push-up detection thresholds
 * Adapted from working Python implementation using same values
 *
 * Your Python code: rep_logic(120, 160, angle)
 * - angle > 160 = UP position (arms extended)
 * - angle < 120 = DOWN position (arms bent)
 */
export const PUSHUP_THRESHOLDS = {
  // Thresholds matching your working Python implementation (relaxed for easier detection)
  ELBOW_ANGLE_TOP: 150,    // Arms extended = UP position (Relaxed from 160)
  ELBOW_ANGLE_BOTTOM: 130, // Arms bent = DOWN position (Relaxed from 120)

  // Body alignment thresholds for form validation
  BODY_ALIGNMENT_GOOD: 160,
  BODY_ALIGNMENT_WARNING: 140,
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
  ANALYTICS: '/analytics',
} as const
