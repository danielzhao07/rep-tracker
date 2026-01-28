import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CameraSetupModal } from '@/components/workout/CameraSetupModal'
import { WorkoutActiveView } from '@/components/workout/WorkoutActiveView'
import { WorkoutCompleteView } from '@/components/workout/WorkoutCompleteView'
import { useWorkoutStore } from '@/store/workoutStore'
import { useCameraStore } from '@/store/cameraStore'
import { useAudioCues } from '@/hooks/useAudioCues'
import { ROUTES } from '@/utils/constants'

type WorkoutPhase = 'setup' | 'active' | 'complete'

export function WorkoutPage() {
  const navigate = useNavigate()
  const { currentExercise, isCameraMode } = useWorkoutStore()
  const { stream, initializeCamera, stopCamera } = useCameraStore()
  const { isEnabled, toggleAudio } = useAudioCues()
  const [phase, setPhase] = useState<WorkoutPhase>('setup')

  useEffect(() => {
    if (!currentExercise) {
      navigate(ROUTES.HOME)
      return
    }

    if (isCameraMode) {
      initializeCamera()
    } else {
      setPhase('active')
    }
  }, [currentExercise, isCameraMode, initializeCamera, navigate])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

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

  if (!currentExercise) return null

  return (
    <div>
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

      {phase === 'complete' && <WorkoutCompleteView />}
    </div>
  )
}
