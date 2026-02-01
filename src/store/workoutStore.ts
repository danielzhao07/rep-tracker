import { create } from 'zustand'
import type { Exercise, Rep, RepPhase } from '@/types'
import type { SquatDifficultyMode } from '@/utils/constants'

interface WorkoutState {
  isActive: boolean
  isPaused: boolean
  currentExercise: Exercise | null
  startTime: number | null
  elapsedMs: number

  repCount: number
  repHistory: Rep[]
  currentRepPhase: RepPhase

  // For alternating exercises
  leftArmCount: number
  rightArmCount: number

  // For squat difficulty selection
  squatDifficulty: SquatDifficultyMode

  isCameraMode: boolean
  isRecording: boolean
  recordingBlob: Blob | null

  formFeedback: string[]
  formScore: number
  
  // Debug info for pose detection
  debugElbowAngle: number
  debugPoseDetected: boolean
  debugFrameCount: number

  startWorkout: (exercise: Exercise, cameraMode: boolean) => void
  pauseWorkout: () => void
  resumeWorkout: () => void
  endWorkout: () => void
  resetWorkout: () => void
  restartWorkout: () => void

  // Individual setters for video tracking from active workout
  setCurrentExercise: (exercise: Exercise) => void
  setCameraMode: (cameraMode: boolean) => void

  incrementRep: () => void
  decrementRep: () => void
  setRepCount: (count: number) => void
  addRep: (rep: Rep) => void
  setRepPhase: (phase: RepPhase) => void

  // For alternating exercises
  setArmCounts: (left: number, right: number) => void

  // For squat difficulty
  setSquatDifficulty: (difficulty: SquatDifficultyMode) => void

  updateFormFeedback: (feedback: string[]) => void
  setFormScore: (score: number) => void
  
  // Debug setters
  setDebugInfo: (angle: number, detected: boolean, frameCount: number) => void

  setRecordingBlob: (blob: Blob | null) => void
  setIsRecording: (recording: boolean) => void
  setElapsedMs: (ms: number) => void
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  isActive: false,
  isPaused: false,
  currentExercise: null,
  startTime: null,
  elapsedMs: 0,

  repCount: 0,
  repHistory: [],
  currentRepPhase: 'start',

  leftArmCount: 0,
  rightArmCount: 0,

  squatDifficulty: 'ninety-degree',

  isCameraMode: false,
  isRecording: false,
  recordingBlob: null,

  formFeedback: [],
  formScore: 0,
  
  // Debug defaults
  debugElbowAngle: 0,
  debugPoseDetected: false,
  debugFrameCount: 0,

  startWorkout: (exercise, cameraMode) =>
    set({
      isActive: true,
      isPaused: false,
      currentExercise: exercise,
      startTime: Date.now(),
      elapsedMs: 0,
      repCount: 0,
      repHistory: [],
      currentRepPhase: 'start',
      leftArmCount: 0,
      rightArmCount: 0,
      isCameraMode: cameraMode,
      formFeedback: [],
      formScore: 0,
      recordingBlob: null,
      debugElbowAngle: 0,
      debugPoseDetected: false,
      debugFrameCount: 0,
    }),

  pauseWorkout: () => set({ isPaused: true }),

  resumeWorkout: () => set({ isPaused: false }),

  endWorkout: () =>
    set((state) => ({
      isActive: false,
      isPaused: false,
      isRecording: false,
      elapsedMs: state.startTime ? Date.now() - state.startTime : 0,
    })),

  resetWorkout: () =>
    set({
      isActive: false,
      isPaused: false,
      currentExercise: null,
      startTime: null,
      elapsedMs: 0,
      repCount: 0,
      repHistory: [],
      currentRepPhase: 'start',
      leftArmCount: 0,
      rightArmCount: 0,
      isCameraMode: false,
      isRecording: false,
      recordingBlob: null,
      formFeedback: [],
      formScore: 0,
      debugElbowAngle: 0,
      debugPoseDetected: false,
      debugFrameCount: 0,
    }),

  restartWorkout: () =>
    set((state) => ({
      isActive: false,
      isPaused: false,
      // Keep currentExercise and isCameraMode
      currentExercise: state.currentExercise,
      isCameraMode: state.isCameraMode,
      startTime: null,
      elapsedMs: 0,
      repCount: 0,
      repHistory: [],
      currentRepPhase: 'start',
      leftArmCount: 0,
      rightArmCount: 0,
      isRecording: false,
      recordingBlob: null,
      formFeedback: [],
      formScore: 0,
      debugElbowAngle: 0,
      debugPoseDetected: false,
      debugFrameCount: 0,
    })),

  // Individual setters for video tracking from active workout
  setCurrentExercise: (exercise) => set({ currentExercise: exercise }),
  setCameraMode: (cameraMode) => set({ isCameraMode: cameraMode }),

  incrementRep: () => set((state) => ({ repCount: state.repCount + 1 })),
  decrementRep: () =>
    set((state) => ({ repCount: Math.max(0, state.repCount - 1) })),
  setRepCount: (count) => set({ repCount: Math.max(0, count) }),
  addRep: (rep) =>
    set((state) => ({
      repHistory: [...state.repHistory, rep],
      repCount: state.repCount + 1,
    })),
  setRepPhase: (phase) => set({ currentRepPhase: phase }),

  setArmCounts: (left, right) =>
    set({ leftArmCount: left, rightArmCount: right }),

  setSquatDifficulty: (difficulty) => set({ squatDifficulty: difficulty }),

  updateFormFeedback: (feedback) => set({ formFeedback: feedback }),
  setFormScore: (score) => set({ formScore: score }),
  
  setDebugInfo: (angle, detected, frameCount) => set({
    debugElbowAngle: angle,
    debugPoseDetected: detected,
    debugFrameCount: frameCount,
  }),

  setRecordingBlob: (blob) => set({ recordingBlob: blob }),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setElapsedMs: (ms) => set({ elapsedMs: ms }),
}))
