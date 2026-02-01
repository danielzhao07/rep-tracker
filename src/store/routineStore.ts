import { create } from 'zustand'
import type { RoutineWithExercises, CreateRoutineInput } from '@/types/routine'
import { RoutineRepository } from '@/repositories/RoutineRepository'

interface RoutineStore {
  routines: RoutineWithExercises[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchRoutines: (userId: string) => Promise<void>
  createRoutine: (userId: string, input: CreateRoutineInput) => Promise<RoutineWithExercises>
  updateRoutine: (routineId: string, input: CreateRoutineInput) => Promise<void>
  deleteRoutine: (routineId: string) => Promise<void>
  clearError: () => void
}

export const useRoutineStore = create<RoutineStore>((set) => ({
  routines: [],
  isLoading: false,
  error: null,

  fetchRoutines: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const routines = await RoutineRepository.getUserRoutines(userId)
      set({ routines, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch routines',
        isLoading: false 
      })
    }
  },

  createRoutine: async (userId: string, input: CreateRoutineInput) => {
    set({ isLoading: true, error: null })
    try {
      const routine = await RoutineRepository.createRoutine(userId, input)
      const fullRoutine = await RoutineRepository.getRoutine(routine.id)
      
      if (fullRoutine) {
        set(state => ({ 
          routines: [fullRoutine, ...state.routines],
          isLoading: false 
        }))
        return fullRoutine
      }
      
      throw new Error('Failed to fetch created routine')
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create routine',
        isLoading: false 
      })
      throw error
    }
  },

  updateRoutine: async (routineId: string, input: CreateRoutineInput) => {
    console.log('updateRoutine called with:', { routineId, input })
    set({ isLoading: true, error: null })
    try {
      await RoutineRepository.updateRoutineWithExercises(routineId, input)
      console.log('Repository update complete, fetching updated routine...')
      const updatedRoutine = await RoutineRepository.getRoutine(routineId)
      console.log('Updated routine:', updatedRoutine)
      
      if (updatedRoutine) {
        set(state => ({
          routines: state.routines.map(r => r.id === routineId ? updatedRoutine : r),
          isLoading: false
        }))
      }
    } catch (error) {
      console.error('updateRoutine error:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to update routine',
        isLoading: false
      })
      throw error
    }
  },

  deleteRoutine: async (routineId: string) => {
    set({ isLoading: true, error: null })
    try {
      await RoutineRepository.deleteRoutine(routineId)
      set(state => ({ 
        routines: state.routines.filter(r => r.id !== routineId),
        isLoading: false 
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete routine',
        isLoading: false 
      })
    }
  },

  clearError: () => set({ error: null })
}))
