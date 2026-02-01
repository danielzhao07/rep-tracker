import { supabase } from '@/lib/supabase'
import type { 
  Routine, 
  RoutineExercise, 
  RoutineWithExercises, 
  CreateRoutineInput,
  UpdateRoutineInput,
  RoutineExerciseWithDetails 
} from '@/types/routine'

export class RoutineRepository {
  // Get all routines for a user
  static async getUserRoutines(userId: string): Promise<RoutineWithExercises[]> {
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (routinesError) throw routinesError
    if (!routines) return []

    // Get exercises for all routines
    const routineIds = routines.map(r => r.id)
    const { data: routineExercises, error: exercisesError } = await supabase
      .from('routine_exercises')
      .select(`
        *,
        exercises (
          name,
          category,
          detector_type
        )
      `)
      .in('routine_id', routineIds)
      .order('order_index', { ascending: true })

    if (exercisesError) throw exercisesError

    // Map routines with their exercises
    return routines.map(routine => {
      const exercises = (routineExercises || [])
        .filter(re => re.routine_id === routine.id)
        .map(re => ({
          id: re.id,
          routineId: re.routine_id,
          exerciseId: re.exercise_id,
          orderIndex: re.order_index,
          targetSets: re.target_sets,
          targetReps: re.target_reps,
          restSeconds: re.rest_seconds,
          createdAt: re.created_at,
          exerciseName: re.exercises?.name || '',
          exerciseCategory: re.exercises?.category || '',
          exerciseDetectorType: re.exercises?.detector_type || ''
        } as RoutineExerciseWithDetails))

      return {
        id: routine.id,
        userId: routine.user_id,
        name: routine.name,
        description: routine.description,
        isActive: routine.is_active,
        createdAt: routine.created_at,
        updatedAt: routine.updated_at,
        exercises
      }
    })
  }

  // Get a single routine by ID
  static async getRoutine(routineId: string): Promise<RoutineWithExercises | null> {
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select('*')
      .eq('id', routineId)
      .single()

    if (routineError) throw routineError
    if (!routine) return null

    const { data: routineExercises, error: exercisesError } = await supabase
      .from('routine_exercises')
      .select(`
        *,
        exercises (
          name,
          category,
          detector_type
        )
      `)
      .eq('routine_id', routineId)
      .order('order_index', { ascending: true })

    if (exercisesError) throw exercisesError

    const exercises = (routineExercises || []).map(re => ({
      id: re.id,
      routineId: re.routine_id,
      exerciseId: re.exercise_id,
      orderIndex: re.order_index,
      targetSets: re.target_sets,
      targetReps: re.target_reps,
      restSeconds: re.rest_seconds,
      createdAt: re.created_at,
      exerciseName: re.exercises?.name || '',
      exerciseCategory: re.exercises?.category || '',
      exerciseDetectorType: re.exercises?.detector_type || ''
    } as RoutineExerciseWithDetails))

    return {
      id: routine.id,
      userId: routine.user_id,
      name: routine.name,
      description: routine.description,
      isActive: routine.is_active,
      createdAt: routine.created_at,
      updatedAt: routine.updated_at,
      exercises
    }
  }

  // Create a new routine
  static async createRoutine(userId: string, input: CreateRoutineInput): Promise<Routine> {
    // Create the routine first
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        name: input.name,
        description: input.description,
        is_active: true
      })
      .select()
      .single()

    if (routineError) throw routineError

    // Add exercises if any
    if (input.exercises.length > 0) {
      const { error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(
          input.exercises.map(ex => ({
            routine_id: routine.id,
            exercise_id: ex.exerciseId,
            order_index: ex.orderIndex,
            target_sets: ex.targetSets,
            target_reps: ex.targetReps,
            rest_seconds: ex.restSeconds
          }))
        )

      if (exercisesError) throw exercisesError
    }

    return {
      id: routine.id,
      userId: routine.user_id,
      name: routine.name,
      description: routine.description,
      isActive: routine.is_active,
      createdAt: routine.created_at,
      updatedAt: routine.updated_at
    }
  }

  // Update a routine
  static async updateRoutine(routineId: string, input: UpdateRoutineInput): Promise<void> {
    const { error } = await supabase
      .from('routines')
      .update({
        name: input.name,
        description: input.description,
        is_active: input.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', routineId)

    if (error) throw error
  }

  // Update routine with exercises (full replacement)
  static async updateRoutineWithExercises(routineId: string, input: CreateRoutineInput): Promise<void> {
    // Update the routine details
    const { error: routineError } = await supabase
      .from('routines')
      .update({
        name: input.name,
        description: input.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', routineId)

    if (routineError) throw routineError

    // Delete existing exercises
    const { error: deleteError } = await supabase
      .from('routine_exercises')
      .delete()
      .eq('routine_id', routineId)

    if (deleteError) throw deleteError

    // Add new exercises if any
    if (input.exercises.length > 0) {
      const { error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(
          input.exercises.map(ex => ({
            routine_id: routineId,
            exercise_id: ex.exerciseId,
            order_index: ex.orderIndex,
            target_sets: ex.targetSets,
            target_reps: ex.targetReps,
            rest_seconds: ex.restSeconds
          }))
        )

      if (exercisesError) throw exercisesError
    }
  }

  // Delete a routine
  static async deleteRoutine(routineId: string): Promise<void> {
    const { error } = await supabase
      .from('routines')
      .delete()
      .eq('id', routineId)

    if (error) throw error
  }

  // Add exercise to routine
  static async addExerciseToRoutine(
    routineId: string,
    exerciseId: string,
    orderIndex: number,
    targetSets: number = 3,
    targetReps: number = 10,
    restSeconds: number = 90
  ): Promise<void> {
    const { error } = await supabase
      .from('routine_exercises')
      .insert({
        routine_id: routineId,
        exercise_id: exerciseId,
        order_index: orderIndex,
        target_sets: targetSets,
        target_reps: targetReps,
        rest_seconds: restSeconds
      })

    if (error) throw error
  }

  // Remove exercise from routine
  static async removeExerciseFromRoutine(routineExerciseId: string): Promise<void> {
    const { error } = await supabase
      .from('routine_exercises')
      .delete()
      .eq('id', routineExerciseId)

    if (error) throw error
  }

  // Update routine exercise
  static async updateRoutineExercise(
    routineExerciseId: string,
    updates: {
      targetSets?: number
      targetReps?: number
      restSeconds?: number
      orderIndex?: number
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('routine_exercises')
      .update({
        target_sets: updates.targetSets,
        target_reps: updates.targetReps,
        rest_seconds: updates.restSeconds,
        order_index: updates.orderIndex
      })
      .eq('id', routineExerciseId)

    if (error) throw error
  }
}
