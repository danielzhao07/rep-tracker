import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabaseTypes'
import type { WorkoutSession, WorkoutRep } from '@/types'

type WorkoutRow = Database['public']['Tables']['workouts']['Row']
type WorkoutInsert = Database['public']['Tables']['workouts']['Insert']

function mapRow(row: WorkoutRow): WorkoutSession {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseId: row.exercise_id,
    repCount: row.rep_count,
    durationMs: row.duration_ms,
    formScore: row.form_score,
    avgTimePerRep: row.avg_time_per_rep,
    videoUrl: row.video_url,
    manualEntry: row.manual_entry,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export class WorkoutRepository {
  async getWorkouts(userId: string): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data || []) as WorkoutRow[]).map(mapRow)
  }

  async getWorkoutById(id: string): Promise<WorkoutSession | null> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null

    return mapRow(data as WorkoutRow)
  }

  async createWorkout(
    workout: Omit<WorkoutSession, 'id' | 'createdAt'>
  ): Promise<WorkoutSession> {
    const row: WorkoutInsert = {
      user_id: workout.userId,
      exercise_id: workout.exerciseId,
      rep_count: workout.repCount,
      duration_ms: workout.durationMs,
      form_score: workout.formScore,
      avg_time_per_rep: workout.avgTimePerRep,
      video_url: workout.videoUrl,
      manual_entry: workout.manualEntry,
      notes: workout.notes,
    }

    const { data, error } = await supabase
      .from('workouts')
      .insert(row)
      .select()
      .single()

    if (error) throw error

    return mapRow(data as WorkoutRow)
  }

  async updateWorkout(
    id: string,
    updates: Partial<WorkoutSession>
  ): Promise<WorkoutSession> {
    const dbUpdates: Database['public']['Tables']['workouts']['Update'] = {}
    if (updates.repCount !== undefined) dbUpdates.rep_count = updates.repCount
    if (updates.formScore !== undefined) dbUpdates.form_score = updates.formScore
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes

    const { data, error } = await supabase
      .from('workouts')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return mapRow(data as WorkoutRow)
  }

  async deleteWorkout(id: string): Promise<void> {
    const { error } = await supabase.from('workouts').delete().eq('id', id)
    if (error) throw error
  }

  async saveWorkoutReps(workoutId: string, reps: WorkoutRep[]): Promise<void> {
    const rows: Database['public']['Tables']['workout_reps']['Insert'][] = reps.map((rep) => ({
      workout_id: workoutId,
      rep_number: rep.repNumber,
      duration_ms: rep.durationMs,
      quality: rep.quality,
      form_score: rep.formScore,
      feedback: rep.feedback,
    }))

    const { error } = await supabase.from('workout_reps').insert(rows)
    if (error) throw error
  }
}
