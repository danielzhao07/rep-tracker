import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Exercise, ExerciseCategory, ExerciseDetectorType } from '@/types/exercise'

interface ExerciseState {
  exercises: Exercise[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchExercises: () => Promise<void>
}

// Map database row to Exercise type
function mapDbExercise(row: {
  id: string
  name: string
  category: string
  description: string | null
  thumbnail_url: string | null
  detector_type: string
  created_at: string
}): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category as ExerciseCategory,
    description: row.description || '',
    thumbnailUrl: row.thumbnail_url,
    detectorType: row.detector_type as ExerciseDetectorType,
    createdAt: row.created_at,
  }
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
        exercises: (data || []).map((row: any) => mapDbExercise(row)),
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
