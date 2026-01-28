import type { RepQuality } from './pose'

export interface WorkoutSession {
  id: string
  userId: string
  exerciseId: string
  repCount: number
  durationMs: number
  formScore: number | null
  avgTimePerRep: number | null
  videoUrl: string | null
  manualEntry: boolean
  notes: string | null
  createdAt: string
}

export interface WorkoutRep {
  id: string
  workoutId: string
  repNumber: number
  durationMs: number
  quality: RepQuality
  formScore: number
  feedback: string[]
  createdAt: string
}

export interface WorkoutFilters {
  exerciseId?: string
  dateFrom?: string
  dateTo?: string
  sortBy: 'created_at'
  sortOrder: 'asc' | 'desc'
}

export interface Rep {
  number: number
  startTime: number
  endTime: number
  duration: number
  quality: RepQuality
  formScore: number
  feedback: string[]
}
