import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExerciseLibrary } from '@/components/exercise/ExerciseLibrary'
import { Button } from '@/components/shared/Button'
import { Modal } from '@/components/shared/Modal'
import { useWorkoutStore } from '@/store/workoutStore'
import { ROUTES } from '@/utils/constants'
import type { Exercise } from '@/types'
import { Camera, PenLine, Activity } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  const { startWorkout } = useWorkoutStore()
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  )

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise)
  }

  const handleStartCamera = () => {
    if (!selectedExercise) return
    startWorkout(selectedExercise, true)
    setSelectedExercise(null)
    navigate(ROUTES.WORKOUT)
  }

  const handleStartManual = () => {
    if (!selectedExercise) return
    startWorkout(selectedExercise, false)
    setSelectedExercise(null)
    navigate(ROUTES.MANUAL_ENTRY)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="text-green-500" size={28} />
          <h1 className="text-2xl font-bold">Rep Tracker</h1>
        </div>
        <p className="text-gray-400">
          Select an exercise to start your workout
        </p>
      </div>

      <ExerciseLibrary onSelectExercise={handleSelectExercise} />

      <Modal
        isOpen={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        title={selectedExercise?.name || 'Start Workout'}
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            {selectedExercise?.description}
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleStartCamera}
              className="w-full justify-start"
              size="lg"
            >
              <Camera size={20} />
              <span className="ml-3">Start with Camera</span>
            </Button>
            <p className="text-xs text-gray-500 ml-1">
              Uses your camera for automatic rep counting and form analysis
            </p>

            <Button
              variant="secondary"
              onClick={handleStartManual}
              className="w-full justify-start"
              size="lg"
            >
              <PenLine size={20} />
              <span className="ml-3">Manual Entry</span>
            </Button>
            <p className="text-xs text-gray-500 ml-1">
              Manually log your reps without using the camera
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
