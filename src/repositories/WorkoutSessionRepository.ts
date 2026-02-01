import { supabase } from '@/lib/supabase'
import type { WorkoutExercise } from '@/store/workoutSessionStore'

// Database types
export interface WorkoutSessionDB {
  id: string
  user_id: string
  routine_id: string | null
  routine_name: string
  duration_seconds: number
  total_volume: number
  completed_sets: number
  total_sets: number
  exercises_data: WorkoutExerciseData[]
  description: string | null
  photo_url: string | null
  visibility: 'everyone' | 'friends' | 'private'
  created_at: string
}

export interface WorkoutExerciseData {
  exerciseId: string
  exerciseName: string
  exerciseCategory: string
  detectorType: string
  sets: {
    setNumber: number
    weight: string
    reps: number | null
    completed: boolean
  }[]
  notes: string
}

// Input for saving a workout session
export interface SaveWorkoutSessionInput {
  userId: string
  routineId: string | null
  routineName: string
  durationSeconds: number
  totalVolume: number
  completedSets: number
  totalSets: number
  exercises: WorkoutExercise[]
  description?: string
  photoUrl?: string
  visibility?: 'everyone' | 'friends' | 'private'
}

// Mapped workout session for frontend use
export interface WorkoutSessionModel {
  id: string
  userId: string
  routineId: string | null
  routineName: string
  durationSeconds: number
  totalVolume: number
  completedSets: number
  totalSets: number
  exercisesData: WorkoutExerciseData[]
  description: string | null
  photoUrl: string | null
  visibility: 'everyone' | 'friends' | 'private'
  createdAt: string
}

function mapRowToModel(row: WorkoutSessionDB): WorkoutSessionModel {
  return {
    id: row.id,
    userId: row.user_id,
    routineId: row.routine_id,
    routineName: row.routine_name,
    durationSeconds: row.duration_seconds,
    totalVolume: row.total_volume,
    completedSets: row.completed_sets,
    totalSets: row.total_sets,
    exercisesData: row.exercises_data,
    description: row.description,
    photoUrl: row.photo_url,
    visibility: row.visibility,
    createdAt: row.created_at,
  }
}

export const WorkoutSessionRepository = {
  /**
   * Save a new workout session
   */
  async saveWorkoutSession(input: SaveWorkoutSessionInput): Promise<WorkoutSessionModel> {
    const exercisesData: WorkoutExerciseData[] = input.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      exerciseCategory: ex.exerciseCategory,
      detectorType: ex.detectorType,
      sets: ex.sets.map(s => ({
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        completed: s.completed,
      })),
      notes: ex.notes,
    }))

    // Use type assertion since workout_sessions table isn't in generated types yet
    const { data, error } = await (supabase
      .from('workout_sessions' as any)
      .insert({
        user_id: input.userId,
        routine_id: input.routineId,
        routine_name: input.routineName,
        duration_seconds: input.durationSeconds,
        total_volume: input.totalVolume,
        completed_sets: input.completedSets,
        total_sets: input.totalSets,
        exercises_data: exercisesData,
        description: input.description || null,
        photo_url: input.photoUrl || null,
        visibility: input.visibility || 'everyone',
      } as any)
      .select()
      .single() as any)

    if (error) {
      console.error('Failed to save workout session:', error)
      throw new Error(error.message)
    }

    return mapRowToModel(data as WorkoutSessionDB)
  },

  /**
   * Get all workout sessions for a user
   */
  async getUserWorkoutSessions(userId: string): Promise<WorkoutSessionModel[]> {
    const { data, error } = await (supabase
      .from('workout_sessions' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }) as any)

    if (error) {
      console.error('Failed to fetch workout sessions:', error)
      throw new Error(error.message)
    }

    return ((data || []) as WorkoutSessionDB[]).map(mapRowToModel)
  },

  /**
   * Get a single workout session by ID
   */
  async getWorkoutSession(sessionId: string): Promise<WorkoutSessionModel | null> {
    const { data, error } = await (supabase
      .from('workout_sessions' as any)
      .select('*')
      .eq('id', sessionId)
      .single() as any)

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Failed to fetch workout session:', error)
      throw new Error(error.message)
    }

    return mapRowToModel(data as WorkoutSessionDB)
  },

  /**
   * Get the most recent workout session for a specific routine
   */
  async getLastWorkoutForRoutine(userId: string, routineId: string): Promise<WorkoutSessionModel | null> {
    const { data, error } = await (supabase
      .from('workout_sessions' as any)
      .select('*')
      .eq('user_id', userId)
      .eq('routine_id', routineId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single() as any)

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Failed to fetch last workout:', error)
      throw new Error(error.message)
    }

    return mapRowToModel(data as WorkoutSessionDB)
  },

  /**
   * Get previous workout data for each exercise in a routine
   * Returns a Map of exerciseId -> array of { reps, weight } for each set
   */
  async getPreviousWorkoutData(userId: string, routineId: string): Promise<Map<string, { reps: number | null; weight: string }[]>> {
    const lastWorkout = await this.getLastWorkoutForRoutine(userId, routineId)
    
    const previousData = new Map<string, { reps: number | null; weight: string }[]>()
    
    if (lastWorkout) {
      lastWorkout.exercisesData.forEach(ex => {
        // Get ALL sets (not just completed ones) for the previous column
        const setsData = ex.sets.map(s => ({ reps: s.reps, weight: s.weight }))
        if (setsData.length > 0) {
          previousData.set(ex.exerciseId, setsData)
        }
      })
    }
    
    return previousData
  },

  /**
   * Get previous workout data for a specific exercise across all workouts
   * This is useful when adding a new exercise to an existing workout
   */
  async getPreviousExerciseData(userId: string, exerciseId: string): Promise<{ reps: number | null; weight: string }[] | null> {
    const { data, error } = await (supabase
      .from('workout_sessions' as any)
      .select('exercises_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10) as any) // Check last 10 workouts

    if (error) {
      console.error('Failed to fetch previous exercise data:', error)
      return null
    }

    // Search through workouts to find the most recent one with this exercise
    for (const workout of (data || [])) {
      const exercisesData = workout.exercises_data as WorkoutExerciseData[]
      const exercise = exercisesData.find(ex => ex.exerciseId === exerciseId)
      if (exercise && exercise.sets.length > 0) {
        return exercise.sets.map(s => ({ reps: s.reps, weight: s.weight }))
      }
    }

    return null
  },

  /**
   * Delete a workout session
   */
  async deleteWorkoutSession(sessionId: string): Promise<void> {
    const { error } = await (supabase
      .from('workout_sessions' as any)
      .delete()
      .eq('id', sessionId) as any)

    if (error) {
      console.error('Failed to delete workout session:', error)
      throw new Error(error.message)
    }
  },

  /**
   * Get workout statistics for a user
   */
  async getWorkoutStats(userId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await (supabase
      .from('workout_sessions' as any)
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true }) as any)

    if (error) {
      console.error('Failed to fetch workout stats:', error)
      throw new Error(error.message)
    }

    const sessions = (data as WorkoutSessionDB[]).map(mapRowToModel)
    
    // Calculate statistics
    const totalWorkouts = sessions.length
    const totalVolume = sessions.reduce((sum, s) => sum + s.totalVolume, 0)
    const totalSets = sessions.reduce((sum, s) => sum + s.completedSets, 0)
    const totalDuration = sessions.reduce((sum, s) => sum + s.durationSeconds, 0)
    
    // Workout days
    const workoutDates = new Set(
      sessions.map(s => new Date(s.createdAt).toDateString())
    )
    
    // Volume over time (grouped by day)
    const volumeByDay = new Map<string, number>()
    sessions.forEach(s => {
      const day = new Date(s.createdAt).toLocaleDateString()
      volumeByDay.set(day, (volumeByDay.get(day) || 0) + s.totalVolume)
    })
    
    // Exercise frequency
    const exerciseFrequency = new Map<string, number>()
    sessions.forEach(s => {
      s.exercisesData.forEach(ex => {
        exerciseFrequency.set(ex.exerciseName, (exerciseFrequency.get(ex.exerciseName) || 0) + 1)
      })
    })
    
    // Category distribution
    const categoryDistribution = new Map<string, number>()
    sessions.forEach(s => {
      s.exercisesData.forEach(ex => {
        categoryDistribution.set(ex.exerciseCategory, (categoryDistribution.get(ex.exerciseCategory) || 0) + 1)
      })
    })
    
    return {
      totalWorkouts,
      totalVolume,
      totalSets,
      totalDuration,
      workoutDays: workoutDates.size,
      volumeByDay: Array.from(volumeByDay.entries()).map(([date, volume]) => ({ date, volume })),
      exerciseFrequency: Array.from(exerciseFrequency.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      categoryDistribution: Array.from(categoryDistribution.entries())
        .map(([category, count]) => ({ category, count })),
      sessions,
    }
  },
}
