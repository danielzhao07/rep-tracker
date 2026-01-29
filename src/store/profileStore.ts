import { create } from 'zustand'
import type { UserGoal, UserPreferences, CreateGoalInput, UpdateGoalInput, UpdatePreferencesInput } from '@/types'
import { GoalsRepository } from '@/repositories/GoalsRepository'
import { PreferencesRepository } from '@/repositories/PreferencesRepository'

const goalsRepo = new GoalsRepository()
const preferencesRepo = new PreferencesRepository()

interface ProfileState {
  // Goals
  goals: UserGoal[]
  activeGoals: UserGoal[]
  isLoadingGoals: boolean
  goalsError: string | null

  // Preferences
  preferences: UserPreferences | null
  isLoadingPreferences: boolean
  preferencesError: string | null

  // Actions - Goals
  loadGoals: (userId: string) => Promise<void>
  loadActiveGoals: (userId: string) => Promise<void>
  createGoal: (userId: string, input: CreateGoalInput) => Promise<void>
  updateGoal: (goalId: string, userId: string, input: UpdateGoalInput) => Promise<void>
  deleteGoal: (goalId: string, userId: string) => Promise<void>
  incrementGoalProgress: (goalId: string, userId: string, amount: number) => Promise<void>

  // Actions - Preferences
  loadPreferences: (userId: string) => Promise<void>
  updatePreferences: (userId: string, input: UpdatePreferencesInput) => Promise<void>

  // Utility
  reset: () => void
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state
  goals: [],
  activeGoals: [],
  isLoadingGoals: false,
  goalsError: null,

  preferences: null,
  isLoadingPreferences: false,
  preferencesError: null,

  // Goals Actions
  loadGoals: async (userId: string) => {
    set({ isLoadingGoals: true, goalsError: null })
    try {
      const goals = await goalsRepo.getUserGoals(userId)
      set({ goals, isLoadingGoals: false })
    } catch (error) {
      set({
        goalsError: error instanceof Error ? error.message : 'Failed to load goals',
        isLoadingGoals: false,
      })
    }
  },

  loadActiveGoals: async (userId: string) => {
    set({ isLoadingGoals: true, goalsError: null })
    try {
      const activeGoals = await goalsRepo.getActiveGoals(userId)
      set({ activeGoals, isLoadingGoals: false })
    } catch (error) {
      set({
        goalsError: error instanceof Error ? error.message : 'Failed to load active goals',
        isLoadingGoals: false,
      })
    }
  },

  createGoal: async (userId: string, input: CreateGoalInput) => {
    set({ goalsError: null })
    try {
      const newGoal = await goalsRepo.createGoal(userId, input)
      set((state) => ({
        goals: [newGoal, ...state.goals],
        activeGoals: [newGoal, ...state.activeGoals],
      }))
    } catch (error) {
      set({
        goalsError: error instanceof Error ? error.message : 'Failed to create goal',
      })
      throw error
    }
  },

  updateGoal: async (goalId: string, userId: string, input: UpdateGoalInput) => {
    set({ goalsError: null })
    try {
      const updatedGoal = await goalsRepo.updateGoal(goalId, userId, input)
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
        activeGoals: state.activeGoals.map((g) => (g.id === goalId ? updatedGoal : g)),
      }))
    } catch (error) {
      set({
        goalsError: error instanceof Error ? error.message : 'Failed to update goal',
      })
      throw error
    }
  },

  deleteGoal: async (goalId: string, userId: string) => {
    set({ goalsError: null })
    try {
      await goalsRepo.deleteGoal(goalId, userId)
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== goalId),
        activeGoals: state.activeGoals.filter((g) => g.id !== goalId),
      }))
    } catch (error) {
      set({
        goalsError: error instanceof Error ? error.message : 'Failed to delete goal',
      })
      throw error
    }
  },

  incrementGoalProgress: async (goalId: string, userId: string, amount: number) => {
    try {
      const updatedGoal = await goalsRepo.incrementGoalProgress(goalId, userId, amount)
      set((state) => ({
        goals: state.goals.map((g) => (g.id === goalId ? updatedGoal : g)),
        activeGoals: state.activeGoals.map((g) => (g.id === goalId ? updatedGoal : g)),
      }))
    } catch (error) {
      console.error('Failed to increment goal progress:', error)
    }
  },

  // Preferences Actions
  loadPreferences: async (userId: string) => {
    set({ isLoadingPreferences: true, preferencesError: null })
    try {
      const preferences = await preferencesRepo.getOrCreatePreferences(userId)
      set({ preferences, isLoadingPreferences: false })
    } catch (error) {
      set({
        preferencesError:
          error instanceof Error ? error.message : 'Failed to load preferences',
        isLoadingPreferences: false,
      })
    }
  },

  updatePreferences: async (userId: string, input: UpdatePreferencesInput) => {
    set({ preferencesError: null })
    try {
      const updatedPreferences = await preferencesRepo.updatePreferences(userId, input)
      set({ preferences: updatedPreferences })
    } catch (error) {
      set({
        preferencesError:
          error instanceof Error ? error.message : 'Failed to update preferences',
      })
      throw error
    }
  },

  // Utility
  reset: () => {
    set({
      goals: [],
      activeGoals: [],
      isLoadingGoals: false,
      goalsError: null,
      preferences: null,
      isLoadingPreferences: false,
      preferencesError: null,
    })
  },
}))
