import { useState, useEffect } from 'react'
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
  const { isActive, exercises, startTime, reset, tick } = useWorkoutSessionStore()
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [displayTime, setDisplayTime] = useState(0)

  // Don't show on workout-related pages where it would be redundant
  const hiddenPaths = ['/workout/active', '/workout/save', '/workout/start']
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path))

  // Keep elapsed time ticking even when not on workout page
  useEffect(() => {
    if (!isActive || !startTime) return
    
    // Calculate initial elapsed time
    const updateTime = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setDisplayTime(elapsed)
      tick() // Also update the store
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [isActive, startTime, tick])

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
        <div className="bg-dark-800 mx-4 mb-2 rounded-2xl shadow-lg border border-dark-600 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: Expand button */}
            <button
              onClick={handleNavigateToWorkout}
              className="w-12 h-12 rounded-full bg-dark-700 border border-dark-500 flex items-center justify-center hover:bg-dark-600 transition-colors"
            >
              <ChevronUp size={24} className="text-cyan-400" />
            </button>

            {/* Center: Workout info */}
            <div className="flex-1 px-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="font-semibold text-white">Workout</span>
                <span className="text-cyan-400 font-medium">{formatTime(displayTime)}</span>
              </div>
              <p className="text-gray-300 text-sm">{firstExerciseName}</p>
            </div>

            {/* Right: Discard button */}
            <button
              onClick={handleDiscard}
              className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center hover:bg-red-500/30 transition-colors"
            >
              <Trash2 size={22} className="text-red-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Discard confirmation modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowDiscardConfirm(false)} />
          <div className="relative bg-dark-800 rounded-2xl w-full max-w-sm p-6 text-center border border-dark-600">
            <p className="text-white text-lg mb-6">
              Are you sure you want to discard this workout?
            </p>
            <div className="space-y-3">
              <button
                onClick={confirmDiscard}
                className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 font-medium transition-colors border border-red-500/40"
              >
                Discard Workout
              </button>
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="w-full py-3 bg-dark-700 hover:bg-dark-600 rounded-xl text-white font-medium transition-colors border border-dark-500"
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
