export interface Routine {
  id: string
  userId: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RoutineExercise {
  id: string
  routineId: string
  exerciseId: string
  orderIndex: number
  targetSets: number
  targetReps?: number
  targetWeight?: string
  setsData?: { reps: number | null; weight: string }[]
  restSeconds: number
  createdAt: string
}

export interface RoutineWithExercises extends Routine {
  exercises: RoutineExerciseWithDetails[]
}

export interface RoutineExerciseWithDetails extends RoutineExercise {
  exerciseName: string
  exerciseCategory: string
  exerciseDetectorType: string
}

// For creating new routines
export interface CreateRoutineInput {
  name: string
  description?: string
  exercises: {
    exerciseId: string
    orderIndex: number
    targetSets: number
    targetReps?: number
    targetWeight?: string
    setsData?: { reps: number | null; weight: string }[]
    restSeconds: number
  }[]
}

// For updating routines
export interface UpdateRoutineInput {
  name?: string
  description?: string
  isActive?: boolean
}

// Template routines (not saved to DB, just in code)
export interface RoutineTemplate {
  name: string
  description: string
  category: 'beginner' | 'intermediate' | 'advanced'
  exercises: {
    exerciseId: string
    targetSets: number
    targetReps: number
    restSeconds: number
  }[]
}
