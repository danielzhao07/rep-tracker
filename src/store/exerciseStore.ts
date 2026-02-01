import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/types/exercise'

interface ExerciseState {
  exercises: Exercise[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchExercises: () => Promise<void>
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  isLoading: false,
  error: null,

  fetchExercises: async () => {
    // Don't fetch if we already have exercises
    if (get().exercises.length > 0) return

    set({ isLoading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name')

      if (error) throw error
      
      set({ 
        exercises: (data || []) as Exercise[],
        isLoading: false 
      })
    } catch (error) {
      console.error('Failed to load exercises:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load exercises',
        isLoading: false 
      })
    }
  },
}))
