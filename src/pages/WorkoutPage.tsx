import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CameraSetupModal } from '@/components/workout/CameraSetupModal'
import { SquatDifficultyModal } from '@/components/workout/SquatDifficultyModal'
import { WorkoutActiveView } from '@/components/workout/WorkoutActiveView'
import { WorkoutCompleteView } from '@/components/workout/WorkoutCompleteView'
import { useWorkoutStore } from '@/store/workoutStore'
import { useCameraStore } from '@/store/cameraStore'
import { useAudioCues } from '@/hooks/useAudioCues'
import { ROUTES } from '@/utils/constants'
import type { SquatDifficultyMode } from '@/utils/constants'

type WorkoutPhase = 'difficulty-select' | 'setup' | 'active' | 'complete'

interface LocationState {
  returnTo?: string
  setIndex?: number
  exerciseId?: string
}

export function WorkoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const { currentExercise, isCameraMode, setSquatDifficulty } = useWorkoutStore()
  const { stream, initializeCamera, stopCamera } = useCameraStore()
  const { isEnabled, toggleAudio } = useAudioCues()
  const [phase, setPhase] = useState<WorkoutPhase>('setup')

  // Check if this is a squat exercise with camera mode
  const isSquatWithCamera = currentExercise?.detectorType === 'squat' && isCameraMode

  useEffect(() => {
    if (!currentExercise) {
      navigate(ROUTES.HOME)
      return
    }

    if (isCameraMode) {
      // For squats, show difficulty selection first
      if (currentExercise.detectorType === 'squat') {
        setPhase('difficulty-select')
      } else {
        initializeCamera()
        setPhase('setup')
      }
    } else {
      setPhase('active')
    }
  }, [currentExercise, isCameraMode, initializeCamera, navigate])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleDifficultySelect = useCallback((difficulty: SquatDifficultyMode) => {
    setSquatDifficulty(difficulty)
    initializeCamera()
    setPhase('setup')
  }, [setSquatDifficulty, initializeCamera])

  const handleCloseDifficultyModal = useCallback(() => {
    stopCamera()
    navigate(ROUTES.HOME)
  }, [stopCamera, navigate])

  const handleStartWorkout = useCallback(() => {
    setPhase('active')
  }, [])

  const handleEndWorkout = useCallback(() => {
    stopCamera()
    setPhase('complete')
  }, [stopCamera])

  const handleCloseSetup = useCallback(() => {
    stopCamera()
    navigate(ROUTES.HOME)
  }, [stopCamera, navigate])

  const handleRetry = useCallback(() => {
    // Go back to difficulty select for squats, setup for others, or directly to active for manual
    if (isCameraMode) {
      if (currentExercise?.detectorType === 'squat') {
        setPhase('difficulty-select')
      } else {
        initializeCamera()
        setPhase('setup')
      }
    } else {
      setPhase('active')
    }
  }, [isCameraMode, currentExercise, initializeCamera])

  if (!currentExercise) return null

  return (
    <div>
      {phase === 'difficulty-select' && isSquatWithCamera && (
        <SquatDifficultyModal
          isOpen
          onSelect={handleDifficultySelect}
          onClose={handleCloseDifficultyModal}
        />
      )}

      {phase === 'setup' && isCameraMode && (
        <CameraSetupModal
          isOpen
          stream={stream}
          audioEnabled={isEnabled}
          onToggleAudio={toggleAudio}
          onStart={handleStartWorkout}
          onClose={handleCloseSetup}
        />
      )}

      {phase === 'active' && <WorkoutActiveView onEnd={handleEndWorkout} />}

      {phase === 'complete' && (
        <WorkoutCompleteView 
          onRetry={handleRetry} 
          returnTo={locationState?.returnTo}
        />
      )}
    </div>
  )
}
