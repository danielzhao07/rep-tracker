import { create } from 'zustand'
import type { WorkoutSession, WorkoutFilters } from '@/types'
import type { Database } from '@/lib/supabaseTypes'
import { supabase } from '@/lib/supabase'

type WorkoutRow = Database['public']['Tables']['workouts']['Row']

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

interface HistoryState {
  workouts: WorkoutSession[]
  isLoading: boolean
  error: string | null
  filters: WorkoutFilters

  loadWorkouts: () => Promise<void>
  saveWorkout: (workout: Omit<WorkoutSession, 'id' | 'createdAt'>) => Promise<WorkoutSession | null>
  deleteWorkout: (id: string) => Promise<void>
  updateFilters: (filters: Partial<WorkoutFilters>) => void
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  workouts: [],
  isLoading: false,
  error: null,
  filters: {
    sortBy: 'created_at',
    sortOrder: 'desc',
  },

  loadWorkouts: async () => {
    set({ isLoading: true, error: null })
    try {
      const { filters } = get()
      let query = supabase
        .from('workouts')
        .select('*')
        .order(filters.sortBy, { ascending: filters.sortOrder === 'asc' })

      if (filters.exerciseId) {
        query = query.eq('exercise_id', filters.exerciseId)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      const { data, error } = await query

      if (error) throw error

      const workouts = ((data || []) as WorkoutRow[]).map(mapRow)
      set({ workouts, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load workouts',
        isLoading: false,
      })
    }
  },

  saveWorkout: async (workout) => {
    set({ isLoading: true, error: null })
    try {
      const insert: Database['public']['Tables']['workouts']['Insert'] = {
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

      console.log('📊 historyStore.saveWorkout - Inserting workout:', insert)

      const { data, error } = await supabase
        .from('workouts')
        .insert(insert)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase insert error:', error)
        throw error
      }

      console.log('✅ Workout inserted successfully:', data)

      const saved = mapRow(data as WorkoutRow)

      set((state) => ({
        workouts: [saved, ...state.workouts],
        isLoading: false,
      }))

      console.log('✅ Workout added to store, total workouts:', get().workouts.length)
      return saved
    } catch (err) {
      console.error('❌ historyStore.saveWorkout error:', err)
      set({
        error: err instanceof Error ? err.message : 'Failed to save workout',
        isLoading: false,
      })
      return null
    }
  },

  deleteWorkout: async (id) => {
    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id)
      if (error) throw error
      set((state) => ({
        workouts: state.workouts.filter((w) => w.id !== id),
      }))
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete workout',
      })
    }
  },

  updateFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}))
