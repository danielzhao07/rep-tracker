import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { RepCounter } from './RepCounter'
import { useWorkoutStore } from '@/store/workoutStore'
import { useHistoryStore } from '@/store/historyStore'
import { useAuthStore } from '@/store/authStore'
import { VideoStorageRepository } from '@/repositories/VideoStorageRepository'
import { MetricsCalculatorService } from '@/services/metrics/MetricsCalculatorService'
import { showToast } from '@/components/shared/Toast'
import { formatDuration } from '@/utils/helpers'
import { Save, Trash2, RotateCcw, Video, VideoOff } from 'lucide-react'
import { ROUTES } from '@/utils/constants'

export function WorkoutCompleteView() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    currentExercise,
    repCount,
    elapsedMs,
    repHistory,
    recordingBlob,
    formScore,
    incrementRep,
    decrementRep,
    resetWorkout,
  } = useWorkoutStore()

  const { saveWorkout } = useHistoryStore()
  const [isSaving, setIsSaving] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const metrics = useMemo(() => {
    const calculator = new MetricsCalculatorService()
    return calculator.analyzeForm(repHistory)
  }, [repHistory])

  const avgTimePerRep = useMemo(() => {
    if (repHistory.length === 0 && repCount > 0) {
      return elapsedMs / repCount / 1000
    }
    const calculator = new MetricsCalculatorService()
    return calculator.calculateAverageTimePerRep(repHistory)
  }, [repHistory, repCount, elapsedMs])

  useEffect(() => {
    if (recordingBlob) {
      const url = URL.createObjectURL(recordingBlob)
      setVideoUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [recordingBlob])

  const handleSave = async (includeVideo: boolean) => {
    if (!user || !currentExercise) return

    setIsSaving(true)
    try {
      let savedVideoUrl: string | null = null

      if (includeVideo && recordingBlob) {
        const videoRepo = new VideoStorageRepository()
        const workoutId = crypto.randomUUID()
        savedVideoUrl = await videoRepo.uploadVideo(
          user.id,
          workoutId,
          recordingBlob
        )
      }

      await saveWorkout({
        userId: user.id,
        exerciseId: currentExercise.id,
        repCount,
        durationMs: elapsedMs,
        formScore: metrics.overallScore || formScore,
        avgTimePerRep,
        videoUrl: savedVideoUrl,
        manualEntry: false,
        notes: null,
      })

      showToast('Workout saved!', 'success')
      resetWorkout()
      navigate(ROUTES.HISTORY)
    } catch {
      showToast('Failed to save workout', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    resetWorkout()
    navigate(ROUTES.HOME)
  }

  const handleRetry = () => {
    resetWorkout()
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Workout Complete</h1>
        <p className="text-gray-400">{currentExercise?.name}</p>
      </div>

      {videoUrl && (
        <div className="rounded-lg overflow-hidden bg-dark-900">
          <video
            src={videoUrl}
            controls
            className="w-full aspect-video"
          />
        </div>
      )}

      <RepCounter
        count={repCount}
        onIncrement={incrementRep}
        onDecrement={decrementRep}
        editable
        size="large"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-400 mb-1">Duration</p>
          <p className="text-2xl font-bold text-white">
            {formatDuration(elapsedMs)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-400 mb-1">Avg Time/Rep</p>
          <p className="text-2xl font-bold text-white">
            {avgTimePerRep > 0 ? `${avgTimePerRep.toFixed(1)}s` : '--'}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-400 mb-1">Form Score</p>
          <p className="text-2xl font-bold text-green-500">
            {metrics.overallScore || formScore}/100
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-400 mb-1">Consistency</p>
          <p className="text-2xl font-bold text-white">
            {metrics.consistency}%
          </p>
        </Card>
      </div>

      {metrics.issues.length > 0 && (
        <Card>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Form Feedback
          </h3>
          <div className="space-y-2">
            {metrics.issues.map((issue, i) => (
              <p
                key={i}
                className={`text-sm ${
                  issue.severity === 'error'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}
              >
                {issue.message}
              </p>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-gray-600">
        {recordingBlob && (
          <Button
            onClick={() => handleSave(true)}
            isLoading={isSaving}
            size="lg"
          >
            <Video size={18} />
            <span className="ml-2">Save with Video</span>
          </Button>
        )}
        <Button
          variant={recordingBlob ? 'secondary' : 'primary'}
          onClick={() => handleSave(false)}
          isLoading={isSaving}
          size="lg"
        >
          {recordingBlob ? <VideoOff size={18} /> : <Save size={18} />}
          <span className="ml-2">
            {recordingBlob ? 'Save without Video' : 'Save Workout'}
          </span>
        </Button>
        <Button variant="ghost" onClick={handleRetry}>
          <RotateCcw size={18} />
          <span className="ml-2">Retry</span>
        </Button>
        <Button variant="ghost" onClick={handleDiscard}>
          <Trash2 size={18} />
          <span className="ml-2">Discard</span>
        </Button>
      </div>
    </div>
  )
}
