import { useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useHistoryStore } from '@/store/historyStore'
import { formatDuration, formatDate, formatTime } from '@/utils/helpers'
import { EXERCISES_SEED } from '@/utils/constants'
import { Calendar, Clock, Target, Trash2 } from 'lucide-react'

export function HistoryPage() {
  const { workouts, isLoading, error, loadWorkouts, deleteWorkout } =
    useHistoryStore()

  useEffect(() => {
    loadWorkouts()
  }, [loadWorkouts])

  const getExerciseName = (exerciseId: string) => {
    return (
      EXERCISES_SEED.find((e) => e.id === exerciseId)?.name || 'Unknown Exercise'
    )
  }

  if (isLoading && workouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Workout History</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {workouts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Target className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400 text-lg">No workouts yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Complete a workout to see it here
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <Card key={workout.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">
                      {getExerciseName(workout.exerciseId)}
                    </h3>
                    {workout.manualEntry && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-dark-700 text-gray-400 border border-gray-600">
                        Manual
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(workout.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatTime(workout.createdAt)}
                    </span>
                    {workout.durationMs > 0 && (
                      <span>{formatDuration(workout.durationMs)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-500">
                      {workout.repCount}
                    </p>
                    <p className="text-xs text-gray-400">reps</p>
                  </div>
                  {workout.formScore !== null && (
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {workout.formScore}
                      </p>
                      <p className="text-xs text-gray-400">form</p>
                    </div>
                  )}
                  <button
                    onClick={() => deleteWorkout(workout.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
