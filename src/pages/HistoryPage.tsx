import { useEffect, useState } from 'react'
import { Card } from '@/components/shared/Card'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Modal } from '@/components/shared/Modal'
import { useHistoryStore } from '@/store/historyStore'
import { VideoStorageRepository } from '@/repositories/VideoStorageRepository'
import { formatDuration, formatDate, formatTime } from '@/utils/helpers'
import { EXERCISES_SEED } from '@/utils/constants'
import { Calendar, Clock, Target, Trash2, Video, Play } from 'lucide-react'

export function HistoryPage() {
  const { workouts, isLoading, error, loadWorkouts, deleteWorkout } =
    useHistoryStore()
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null)
  const [selectedWorkoutName, setSelectedWorkoutName] = useState<string>('')
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)

  useEffect(() => {
    loadWorkouts()
  }, [loadWorkouts])

  const getExerciseName = (exerciseId: string) => {
    return (
      EXERCISES_SEED.find((e) => e.id === exerciseId)?.name || 'Unknown Exercise'
    )
  }

  const handlePlayVideo = async (videoUrl: string, exerciseName: string) => {
    setIsLoadingVideo(true)
    setSelectedWorkoutName(exerciseName)
    
    try {
      // Get signed URL for playback
      const videoRepo = new VideoStorageRepository()
      const playableUrl = await videoRepo.getVideoUrl(videoUrl)
      setSelectedVideoUrl(playableUrl)
    } catch (err) {
      console.error('Failed to get video URL:', err)
      // Try using the original URL as fallback
      setSelectedVideoUrl(videoUrl)
    } finally {
      setIsLoadingVideo(false)
    }
  }

  const handleCloseVideo = () => {
    setSelectedVideoUrl(null)
    setSelectedWorkoutName('')
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
                  {/* Video play button */}
                  {workout.videoUrl && (
                    <button
                      onClick={() => handlePlayVideo(workout.videoUrl!, getExerciseName(workout.exerciseId))}
                      className="flex items-center gap-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                    >
                      <Play size={16} />
                      <span className="text-sm">Play</span>
                    </button>
                  )}
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

      {/* Video Modal */}
      <Modal
        isOpen={!!selectedVideoUrl || isLoadingVideo}
        onClose={handleCloseVideo}
        title={`${selectedWorkoutName} - Replay`}
      >
        {isLoadingVideo ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-400">Loading video...</span>
          </div>
        ) : selectedVideoUrl ? (
          <div className="space-y-4">
            <video
              src={selectedVideoUrl}
              controls
              autoPlay
              className="w-full aspect-video rounded-lg bg-black"
            />
            <div className="flex justify-end">
              <button
                onClick={handleCloseVideo}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
