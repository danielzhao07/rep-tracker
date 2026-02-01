import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronUp, Trash2 } from 'lucide-react'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hrs}h ${remainingMins}min ${secs}s`
  }
  return `${mins}min ${secs}s`
}

export function WorkoutInProgressBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isActive, exercises, elapsedSeconds, reset } = useWorkoutSessionStore()
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Don't show on workout-related pages where it would be redundant
  const hiddenPaths = ['/workout/active', '/workout/save', '/workout/start']
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path))

  if (!isActive || shouldHide) {
    return null
  }

  // Get first exercise name for display
  const firstExerciseName = exercises[0]?.exerciseName || 'Workout'

  const handleNavigateToWorkout = () => {
    navigate('/workout/active')
  }

  const handleDiscard = () => {
    setShowDiscardConfirm(true)
  }

  const confirmDiscard = () => {
    reset()
    setShowDiscardConfirm(false)
  }

  return (
    <>
      {/* Workout in progress bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 md:bottom-0">
        <div className="bg-white mx-4 mb-2 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: Expand button */}
            <button
              onClick={handleNavigateToWorkout}
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <ChevronUp size={24} className="text-gray-700" />
            </button>

            {/* Center: Workout info */}
            <div className="flex-1 px-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="font-semibold text-gray-900">Workout</span>
                <span className="text-gray-600">{formatTime(elapsedSeconds)}</span>
              </div>
              <p className="text-gray-500 text-sm">{firstExerciseName}</p>
            </div>

            {/* Right: Discard button */}
            <button
              onClick={handleDiscard}
              className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center"
            >
              <Trash2 size={22} className="text-red-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Discard confirmation modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDiscardConfirm(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <p className="text-gray-900 text-lg mb-6">
              Are you sure you want to discard this workout?
            </p>
            <div className="space-y-3">
              <button
                onClick={confirmDiscard}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-red-500 font-medium transition-colors"
              >
                Discard Workout
              </button>
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
