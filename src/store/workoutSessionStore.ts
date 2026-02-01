import { create } from 'zustand'
import type { RoutineWithExercises } from '@/types/routine'
import type { Exercise } from '@/types/exercise'

// Individual set data during workout
export interface WorkoutSet {
  setNumber: number
  weight: string
  reps: number | null
  completed: boolean
  previousReps?: number | null
  previousWeight?: string
}

// Saved video data
export interface SavedVideo {
  id: string
  exerciseId: string
  exerciseName: string
  setIndex: number
  repCount: number
  formScore: number | null
  videoBlob: Blob
  videoUrl: string
  createdAt: number
}

// Exercise data during workout
export interface WorkoutExercise {
  exerciseId: string
  exerciseName: string
  exerciseCategory: string
  detectorType: string
  orderIndex: number
  sets: WorkoutSet[]
  notes: string
  restTimerSeconds: number // 0 = OFF, otherwise duration in seconds
  soundEnabled: boolean
}

// Changes tracking for update routine prompt
export interface WorkoutChanges {
  addedSets: number
  removedSets: number
  addedExercises: string[]
  removedExercises: string[]
}

interface WorkoutSessionState {
  // Workout state
  isActive: boolean
  routine: RoutineWithExercises | null
  routineName: string
  exercises: WorkoutExercise[]
  startTime: number | null
  
  // Timer state
  elapsedSeconds: number
  
  // Rest timer state
  activeRestTimer: {
    exerciseId: string
    remainingSeconds: number
    isRunning: boolean
  } | null
  
  // Computed values
  totalVolume: number
  completedSets: number
  totalSets: number
  
  // Original state for change tracking
  originalExercises: WorkoutExercise[]
  
  // Video tracking context (for returning from video detection)
  videoTrackingContext: {
    exerciseId: string
    setIndex: number
  } | null
  
  // Saved videos during workout
  savedVideos: SavedVideo[]
  
  // Actions
  startWorkout: (routine: RoutineWithExercises, previousWorkoutData?: Map<string, { reps: number | null; weight: string }[]>) => void
  startEmptyWorkout: () => void
  endWorkout: () => void
  
  // Set actions
  toggleSetCompletion: (exerciseId: string, setIndex: number) => void
  updateSetReps: (exerciseId: string, setIndex: number, reps: number | null) => void
  updateSetWeight: (exerciseId: string, setIndex: number, weight: string) => void
  addSet: (exerciseId: string) => void
  removeSet: (exerciseId: string, setIndex: number) => void
  
  // Exercise actions
  addExercise: (exercise: Exercise) => void
  updateExerciseNotes: (exerciseId: string, notes: string) => void
  updateRestTimer: (exerciseId: string, seconds: number) => void
  toggleRestTimerSound: (exerciseId: string) => void
  
  // Workout name
  updateWorkoutName: (name: string) => void
  
  // Timer actions
  tick: () => void
  startRestTimer: (exerciseId: string) => void
  stopRestTimer: () => void
  tickRestTimer: () => void
  
  // Video tracking
  setVideoTrackingContext: (exerciseId: string, setIndex: number) => void
  clearVideoTrackingContext: () => void
  logRepsFromVideo: (repCount: number) => void
  
  // Saved video actions
  addSavedVideo: (video: Omit<SavedVideo, 'id' | 'createdAt'>) => void
  removeSavedVideo: (videoId: string) => void
  clearSavedVideos: () => void
  
  // Get changes
  getChanges: () => WorkoutChanges
  hasChanges: () => boolean
  
  // Reset
  reset: () => void
}

const initialState = {
  isActive: false,
  routine: null,
  routineName: '',
  exercises: [],
  videoTrackingContext: null,
  savedVideos: [],
  startTime: null,
  elapsedSeconds: 0,
  activeRestTimer: null,
  totalVolume: 0,
  completedSets: 0,
  totalSets: 0,
  originalExercises: [],
}

export const useWorkoutSessionStore = create<WorkoutSessionState>((set, get) => ({
  ...initialState,

  startWorkout: (routine, previousWorkoutData) => {
    const exercises: WorkoutExercise[] = routine.exercises.map((ex) => {
      // Get previous workout data for this exercise
      const prevData = previousWorkoutData?.get(ex.exerciseId)
      
      // Determine if this is a bodyweight exercise and default weight to 'BW'
      const isBodyweight = ['push up', 'pushup', 'push-up', 'squat', 'squats', 'body weight', 'bodyweight', 'pull up', 'pullup', 'pull-up', 'dip', 'dips', 'plank', 'lunge', 'lunges', 'burpee', 'burpees']
        .some(bw => ex.exerciseName.toLowerCase().includes(bw))
      const defaultWeight = isBodyweight ? 'BW' : ''
      
      // Build sets from setsData if available, otherwise from targetSets
      const setsData = ex.setsData && Array.isArray(ex.setsData) && ex.setsData.length > 0
        ? ex.setsData
        : Array.from({ length: ex.targetSets }, () => ({
            reps: ex.targetReps ?? null,
            weight: ex.targetWeight || defaultWeight
          }))
      
      const sets: WorkoutSet[] = setsData.map((setData, index) => ({
        setNumber: index + 1,
        weight: setData.weight || defaultWeight,
        reps: setData.reps,
        completed: false,
        previousReps: prevData?.[index]?.reps ?? null,
        previousWeight: prevData?.[index]?.weight ?? '',
      }))
      
      return {
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        exerciseCategory: ex.exerciseCategory,
        detectorType: ex.exerciseDetectorType,
        orderIndex: ex.orderIndex,
        sets,
        notes: '',
        restTimerSeconds: 0, // OFF by default
        soundEnabled: true,
      }
    })
    
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
    
    set({
      isActive: true,
      routine,
      routineName: routine.name,
      exercises,
      originalExercises: JSON.parse(JSON.stringify(exercises)), // Deep copy
      startTime: Date.now(),
      elapsedSeconds: 0,
      totalVolume: 0,
      completedSets: 0,
      totalSets,
      activeRestTimer: null,
      videoTrackingContext: null,
    })
  },

  startEmptyWorkout: () => {
    set({
      isActive: true,
      routine: null,
      routineName: 'Workout',
      exercises: [],
      originalExercises: [],
      startTime: Date.now(),
      elapsedSeconds: 0,
      totalVolume: 0,
      completedSets: 0,
      totalSets: 0,
      activeRestTimer: null,
      videoTrackingContext: null,
    })
  },

  endWorkout: () => {
    set({ isActive: false })
  },

  toggleSetCompletion: (exerciseId, setIndex) => {
    const { exercises } = get()
    const newExercises = exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      
      const newSets = ex.sets.map((s, i) => {
        if (i !== setIndex) return s
        return { ...s, completed: !s.completed }
      })
      
      return { ...ex, sets: newSets }
    })
    
    // Recalculate totals
    let completedSets = 0
    let totalVolume = 0
    
    newExercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          completedSets++
          const weight = parseFloat(s.weight) || 0
          const reps = s.reps || 0
          totalVolume += weight * reps
        }
      })
    })
    
    set({ exercises: newExercises, completedSets, totalVolume })
  },

  updateSetReps: (exerciseId, setIndex, reps) => {
    const { exercises } = get()
    const newExercises = exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      
      const newSets = ex.sets.map((s, i) => {
        if (i !== setIndex) return s
        return { ...s, reps }
      })
      
      return { ...ex, sets: newSets }
    })
    
    // Recalculate volume
    let totalVolume = 0
    newExercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          const weight = parseFloat(s.weight) || 0
          const r = s.reps || 0
          totalVolume += weight * r
        }
      })
    })
    
    set({ exercises: newExercises, totalVolume })
  },

  updateSetWeight: (exerciseId, setIndex, weight) => {
    const { exercises } = get()
    const newExercises = exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      
      const newSets = ex.sets.map((s, i) => {
        if (i !== setIndex) return s
        return { ...s, weight }
      })
      
      return { ...ex, sets: newSets }
    })
    
    // Recalculate volume
    let totalVolume = 0
    newExercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          const w = parseFloat(s.weight) || 0
          const reps = s.reps || 0
          totalVolume += w * reps
        }
      })
    })
    
    set({ exercises: newExercises, totalVolume })
  },

  addSet: (exerciseId) => {
    const { exercises, totalSets } = get()
    const newExercises = exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      
      const lastSet = ex.sets[ex.sets.length - 1]
      const newSet: WorkoutSet = {
        setNumber: ex.sets.length + 1,
        weight: lastSet?.weight || '',
        reps: lastSet?.reps ?? null,
        completed: false,
        previousReps: null,
        previousWeight: '',
      }
      
      return { ...ex, sets: [...ex.sets, newSet] }
    })
    
    set({ exercises: newExercises, totalSets: totalSets + 1 })
  },

  removeSet: (exerciseId, setIndex) => {
    const { exercises, totalSets, completedSets } = get()
    let removedCompleted = false
    
    const newExercises = exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      if (ex.sets.length <= 1) return ex // Keep at least one set
      
      const removedSet = ex.sets[setIndex]
      if (removedSet?.completed) removedCompleted = true
      
      const newSets = ex.sets
        .filter((_, i) => i !== setIndex)
        .map((s, i) => ({ ...s, setNumber: i + 1 }))
      
      return { ...ex, sets: newSets }
    })
    
    // Recalculate volume
    let totalVolume = 0
    newExercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          const weight = parseFloat(s.weight) || 0
          const reps = s.reps || 0
          totalVolume += weight * reps
        }
      })
    })
    
    set({ 
      exercises: newExercises, 
      totalSets: totalSets - 1,
      completedSets: removedCompleted ? completedSets - 1 : completedSets,
      totalVolume
    })
  },

  // Add a new exercise to the current workout
  addExercise: (exercise) => {
    const { exercises, totalSets } = get()
    
    // Determine if this is a bodyweight exercise and default weight to 'BW'
    const isBodyweight = ['push up', 'pushup', 'push-up', 'squat', 'squats', 'body weight', 'bodyweight', 'pull up', 'pullup', 'pull-up', 'dip', 'dips', 'plank', 'lunge', 'lunges', 'burpee', 'burpees']
      .some(bw => exercise.name.toLowerCase().includes(bw))
    const defaultWeight = isBodyweight ? 'BW' : ''
    
    // Create new workout exercise with default sets
    const newWorkoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      exerciseCategory: exercise.category,
      detectorType: exercise.detectorType || '',
      orderIndex: exercises.length,
      sets: [
        { setNumber: 1, weight: defaultWeight, reps: null, completed: false },
        { setNumber: 2, weight: defaultWeight, reps: null, completed: false },
        { setNumber: 3, weight: defaultWeight, reps: null, completed: false },
      ],
      notes: '',
      restTimerSeconds: 0,
      soundEnabled: true,
    }
    
    set({
      exercises: [...exercises, newWorkoutExercise],
      totalSets: totalSets + 3, // Added 3 default sets
    })
  },

  updateExerciseNotes: (exerciseId, notes) => {
    const { exercises } = get()
    const newExercises = exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      return { ...ex, notes }
    })
    set({ exercises: newExercises })
  },

  updateRestTimer: (exerciseId, seconds) => {
    const { exercises } = get()
    const newExercises = exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      return { ...ex, restTimerSeconds: seconds }
    })
    set({ exercises: newExercises })
  },

  toggleRestTimerSound: (exerciseId) => {
    const { exercises } = get()
    const newExercises = exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      return { ...ex, soundEnabled: !ex.soundEnabled }
    })
    set({ exercises: newExercises })
  },

  updateWorkoutName: (name) => {
    set({ routineName: name })
  },

  tick: () => {
    const { startTime } = get()
    if (startTime) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
      set({ elapsedSeconds })
    }
  },

  startRestTimer: (exerciseId) => {
    const { exercises } = get()
    const exercise = exercises.find(ex => ex.exerciseId === exerciseId)
    if (exercise && exercise.restTimerSeconds > 0) {
      set({
        activeRestTimer: {
          exerciseId,
          remainingSeconds: exercise.restTimerSeconds,
          isRunning: true,
        }
      })
    }
  },

  stopRestTimer: () => {
    set({ activeRestTimer: null })
  },

  tickRestTimer: () => {
    const { activeRestTimer } = get()
    if (activeRestTimer && activeRestTimer.isRunning) {
      const newRemaining = activeRestTimer.remainingSeconds - 1
      if (newRemaining <= 0) {
        set({ activeRestTimer: null })
        return true // Timer finished
      }
      set({
        activeRestTimer: {
          ...activeRestTimer,
          remainingSeconds: newRemaining,
        }
      })
    }
    return false
  },

  getChanges: () => {
    const { exercises, originalExercises } = get()
    
    let addedSets = 0
    let removedSets = 0
    const addedExercises: string[] = []
    const removedExercises: string[] = []
    
    // Compare set counts per exercise
    exercises.forEach(ex => {
      const original = originalExercises.find(o => o.exerciseId === ex.exerciseId)
      if (!original) {
        addedExercises.push(ex.exerciseName)
        addedSets += ex.sets.length
      } else {
        const diff = ex.sets.length - original.sets.length
        if (diff > 0) addedSets += diff
        if (diff < 0) removedSets += Math.abs(diff)
      }
    })
    
    // Check for removed exercises
    originalExercises.forEach(original => {
      const current = exercises.find(ex => ex.exerciseId === original.exerciseId)
      if (!current) {
        removedExercises.push(original.exerciseName)
        removedSets += original.sets.length
      }
    })
    
    return { addedSets, removedSets, addedExercises, removedExercises }
  },

  hasChanges: () => {
    const changes = get().getChanges()
    return changes.addedSets > 0 || changes.removedSets > 0 || 
           changes.addedExercises.length > 0 || changes.removedExercises.length > 0
  },

  // Video tracking context functions
  setVideoTrackingContext: (exerciseId, setIndex) => {
    set({ videoTrackingContext: { exerciseId, setIndex } })
  },

  clearVideoTrackingContext: () => {
    set({ videoTrackingContext: null })
  },

  logRepsFromVideo: (repCount) => {
    const { videoTrackingContext, exercises, startRestTimer } = get()
    if (!videoTrackingContext) return
    
    const { exerciseId, setIndex } = videoTrackingContext
    
    // Update the specific set with the rep count and mark as completed
    const newExercises = exercises.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex
      
      const newSets = ex.sets.map((s, i) => {
        if (i !== setIndex) return s
        return { ...s, reps: repCount, completed: true }
      })
      
      return { ...ex, sets: newSets }
    })
    
    // Recalculate totals
    let completedSets = 0
    let totalVolume = 0
    
    newExercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          completedSets++
          const weight = parseFloat(s.weight) || 0
          const reps = s.reps || 0
          totalVolume += weight * reps
        }
      })
    })
    
    set({ 
      exercises: newExercises, 
      completedSets, 
      totalVolume,
      videoTrackingContext: null // Clear after logging
    })
    
    // Start rest timer for this exercise
    startRestTimer(exerciseId)
  },

  // Saved video functions
  addSavedVideo: (video) => {
    const { savedVideos } = get()
    const newVideo: SavedVideo = {
      ...video,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }
    console.log('📹 addSavedVideo called:', newVideo)
    console.log('📹 savedVideos after add:', [...savedVideos, newVideo])
    set({ savedVideos: [...savedVideos, newVideo] })
  },

  removeSavedVideo: (videoId) => {
    const { savedVideos } = get()
    const video = savedVideos.find(v => v.id === videoId)
    if (video) {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(video.videoUrl)
    }
    set({ savedVideos: savedVideos.filter(v => v.id !== videoId) })
  },

  clearSavedVideos: () => {
    const { savedVideos } = get()
    // Revoke all object URLs
    savedVideos.forEach(v => URL.revokeObjectURL(v.videoUrl))
    set({ savedVideos: [] })
  },

  reset: () => {
    // Clear saved videos before reset
    const { savedVideos } = get()
    savedVideos.forEach(v => URL.revokeObjectURL(v.videoUrl))
    set(initialState)
  },
}))
