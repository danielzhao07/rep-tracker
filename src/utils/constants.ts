export const PUSHUP_THRESHOLDS = {
  ELBOW_ANGLE_TOP: 160,
  ELBOW_ANGLE_BOTTOM: 90,
  ELBOW_ANGLE_ECCENTRIC_START: 120,
  ELBOW_ANGLE_CONCENTRIC_END: 140,
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
    id: 'pushup-default',
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
