export type LandmarkType =
  | 'NOSE'
  | 'LEFT_EYE_INNER' | 'LEFT_EYE' | 'LEFT_EYE_OUTER'
  | 'RIGHT_EYE_INNER' | 'RIGHT_EYE' | 'RIGHT_EYE_OUTER'
  | 'LEFT_EAR' | 'RIGHT_EAR'
  | 'MOUTH_LEFT' | 'MOUTH_RIGHT'
  | 'LEFT_SHOULDER' | 'RIGHT_SHOULDER'
  | 'LEFT_ELBOW' | 'RIGHT_ELBOW'
  | 'LEFT_WRIST' | 'RIGHT_WRIST'
  | 'LEFT_PINKY' | 'RIGHT_PINKY'
  | 'LEFT_INDEX' | 'RIGHT_INDEX'
  | 'LEFT_THUMB' | 'RIGHT_THUMB'
  | 'LEFT_HIP' | 'RIGHT_HIP'
  | 'LEFT_KNEE' | 'RIGHT_KNEE'
  | 'LEFT_ANKLE' | 'RIGHT_ANKLE'
  | 'LEFT_HEEL' | 'RIGHT_HEEL'
  | 'LEFT_FOOT_INDEX' | 'RIGHT_FOOT_INDEX'

export interface Landmark {
  x: number
  y: number
  z: number
  visibility: number
}

export interface Pose {
  landmarks: Landmark[]
  timestamp: number
}

export type RepPhase = 'start' | 'top' | 'eccentric' | 'bottom' | 'concentric'

export type RepQuality = 'good' | 'partial' | 'poor'

export interface RepCountResult {
  count: number
  phase: RepPhase
  quality: RepQuality
  feedback: string[]
  // Optional arm counts for alternating exercises
  leftArmCount?: number
  rightArmCount?: number
}

export interface FormIssue {
  severity: 'error' | 'warning' | 'tip'
  message: string
  timestamp: number
}

export interface FormAnalysis {
  overallScore: number
  consistency: number
  rangeOfMotion: number
  tempo: 'too-fast' | 'good' | 'too-slow'
  issues: FormIssue[]
}

// MediaPipe landmark indices
export const LANDMARK_INDEX: Record<string, number> = {
  NOSE: 0,
  LEFT_EYE_INNER: 1, LEFT_EYE: 2, LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4, RIGHT_EYE: 5, RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7, RIGHT_EAR: 8,
  MOUTH_LEFT: 9, MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_PINKY: 17, RIGHT_PINKY: 18,
  LEFT_INDEX: 19, RIGHT_INDEX: 20,
  LEFT_THUMB: 21, RIGHT_THUMB: 22,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
}
