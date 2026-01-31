export type FormStrictness = 'low' | 'medium' | 'high'

export interface UserPreferences {
  userId: string
  formStrictness: FormStrictness
  repDetectionSensitivity: number // 0.0 to 1.0
  defaultRestSeconds: number
  cameraPosition: string
  notificationsEnabled: boolean
  createdAt: string
  updatedAt: string
}

// For updating preferences (all fields optional)
export interface UpdatePreferencesInput {
  formStrictness?: FormStrictness
  repDetectionSensitivity?: number
  defaultRestSeconds?: number
  cameraPosition?: string
  notificationsEnabled?: boolean
}

// Default preferences for new users
export const DEFAULT_PREFERENCES: Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'> = {
  formStrictness: 'medium',
  repDetectionSensitivity: 0.5,
  defaultRestSeconds: 60,
  cameraPosition: 'auto',
  notificationsEnabled: true,
}

// Helper labels for UI
export const FORM_STRICTNESS_LABELS: Record<FormStrictness, string> = {
  low: 'Relaxed',
  medium: 'Balanced',
  high: 'Strict',
}

export const FORM_STRICTNESS_DESCRIPTIONS: Record<FormStrictness, string> = {
  low: 'More lenient form checking, easier to count reps',
  medium: 'Balanced form requirements',
  high: 'Strict form requirements, only perfect reps count',
}

// Rest timer presets (seconds)
export const REST_TIMER_PRESETS = [30, 45, 60, 90, 120, 180] as const

// Camera position options
export const CAMERA_POSITIONS = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'front', label: 'Front view' },
  { value: 'side', label: 'Side view' },
] as const
