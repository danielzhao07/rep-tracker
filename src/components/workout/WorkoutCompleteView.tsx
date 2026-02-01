import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import { RepCounter } from './RepCounter'
import { useWorkoutStore } from '@/store/workoutStore'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { useHistoryStore } from '@/store/historyStore'
import { useAuthStore } from '@/store/authStore'
import { VideoStorageRepository } from '@/repositories/VideoStorageRepository'
import { MetricsCalculatorService } from '@/services/metrics/MetricsCalculatorService'
import { showToast } from '@/components/shared/Toast'
import { formatDuration } from '@/utils/helpers'
import { Save, Trash2, RotateCcw, Video, VideoOff, Download, CheckCircle } from 'lucide-react'
import { ROUTES } from '@/utils/constants'

// Save Video Prompt Modal
function SaveVideoModal({
  onSave,
  onDiscard,
}: {
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Save this video?
        </h3>
        <p className="text-gray-500 mb-6">
          Would you like to save this video to your workout summary?
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onSave}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-medium transition-colors"
          >
            Save Video
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
          >
            Don't Save
          </button>
        </div>
      </div>
    </div>
  )
}

interface WorkoutCompleteViewProps {
  onRetry?: () => void
  returnTo?: string // Path to return to (e.g., /workout/active)
}

export function WorkoutCompleteView({ onRetry, returnTo }: WorkoutCompleteViewProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    currentExercise,
    repCount,
    elapsedMs,
    repHistory,
    recordingBlob,
    formScore,
    leftArmCount,
    rightArmCount,
    incrementRep,
    decrementRep,
    resetWorkout,
    restartWorkout,
  } = useWorkoutStore()
  
  const { logRepsFromVideo, videoTrackingContext, addSavedVideo } = useWorkoutSessionStore()
  
  const [showSaveVideoModal, setShowSaveVideoModal] = useState(false)
  // Store the video tracking context locally since logRepsFromVideo clears it
  const [savedVideoContext, setSavedVideoContext] = useState<{ exerciseId: string; setIndex: number } | null>(null)

  // Debug: Log what exercise we have when component loads
  useEffect(() => {
    console.log('[WorkoutComplete] mounted/updated with recordingBlob:', 
      recordingBlob ? `${recordingBlob.size} bytes` : 'null')
  }, [recordingBlob])

  console.log('[WorkoutComplete] render with:', {
    currentExercise: currentExercise ? {
      id: currentExercise.id,
      name: currentExercise.name,
      detectorType: currentExercise.detectorType
    } : null,
    repCount,
    hasRecording: !!recordingBlob,
    recordingBlobSize: recordingBlob?.size,
    user: user ? user.id : 'no user',
    videoTrackingContext
  })

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
    if (!user || !currentExercise) {
      console.error('[WorkoutComplete] Cannot save: Missing user or exercise', { user, currentExercise })
      showToast('Missing user or exercise data', 'error')
      return
    }

    console.log('[WorkoutComplete] Saving workout:', {
      userId: user.id,
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      repCount,
      durationMs: elapsedMs,
      formScore: metrics.overallScore || formScore,
      avgTimePerRep,
      includeVideo,
    })

    setIsSaving(true)
    try {
      let savedVideoUrl: string | null = null

      if (includeVideo && recordingBlob) {
        showToast('Uploading video to cloud...', 'info')
        const videoRepo = new VideoStorageRepository()
        const workoutId = crypto.randomUUID()
        console.log('[WorkoutComplete] Uploading video for workout:', workoutId)
        savedVideoUrl = await videoRepo.uploadVideo(
          user.id,
          workoutId,
          recordingBlob
        )
        console.log('[WorkoutComplete] Video saved to cloud:', savedVideoUrl)
      }

      const workoutData = {
        userId: user.id,
        exerciseId: currentExercise.id,
        repCount,
        durationMs: elapsedMs,
        formScore: metrics.overallScore || formScore,
        avgTimePerRep,
        videoUrl: savedVideoUrl,
        manualEntry: false,
        notes: null,
      }

      console.log('[WorkoutComplete] Calling saveWorkout with:', workoutData)
      const result = await saveWorkout(workoutData)
      console.log('[WorkoutComplete] Workout saved successfully:', result)

      showToast(includeVideo ? 'Workout & video saved!' : 'Workout saved!', 'success')
      resetWorkout()
      navigate(ROUTES.HISTORY)
    } catch (err) {
      console.error('[WorkoutComplete] Save failed:', err)
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
      })
      showToast('Failed to save workout. Check console for details.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle logging reps and returning to the active workout
  const handleLogAndReturn = () => {
    console.log('[WorkoutComplete] handleLogAndReturn called with:', {
      videoTrackingContext,
      repCount,
      hasRecordingBlob: !!recordingBlob,
      recordingBlobSize: recordingBlob?.size,
      currentExercise: currentExercise?.name
    })
    
    // Save context BEFORE logging reps (logRepsFromVideo clears videoTrackingContext!)
    const contextToSave = videoTrackingContext
    
    if (videoTrackingContext && repCount > 0) {
      logRepsFromVideo(repCount)
      showToast(`Logged ${repCount} reps!`, 'success')
    }
    
    // If there's a video, ask if they want to save it (use contextToSave since logRepsFromVideo clears it)
    if (recordingBlob && contextToSave && currentExercise) {
      console.log('[WorkoutComplete] Showing save video modal, saving context:', contextToSave)
      setSavedVideoContext(contextToSave)
      setShowSaveVideoModal(true)
      return
    }
    
    console.log('[WorkoutComplete] No video to save, returning directly')
    // No video, just return
    resetWorkout()
    navigate(returnTo || ROUTES.WORKOUT_ACTIVE)
  }

  const handleSaveVideoAndReturn = () => {
    console.log('[WorkoutComplete] handleSaveVideoAndReturn called with:', {
      hasRecordingBlob: !!recordingBlob,
      recordingBlobSize: recordingBlob?.size,
      savedVideoContext,
      currentExercise: currentExercise?.name
    })
    
    // Use savedVideoContext which was stored before logRepsFromVideo cleared the original
    if (recordingBlob && savedVideoContext && currentExercise) {
      const videoUrl = URL.createObjectURL(recordingBlob)
      console.log('[WorkoutComplete] Creating video with URL:', videoUrl)
      addSavedVideo({
        exerciseId: savedVideoContext.exerciseId,
        exerciseName: currentExercise.name,
        setIndex: savedVideoContext.setIndex,
        repCount,
        formScore,
        videoBlob: recordingBlob,
        videoUrl,
      })
      console.log('[WorkoutComplete] Video added to savedVideos')
      showToast('Video saved!', 'success')
    } else {
      console.log('[WorkoutComplete] Missing required data for saving video!')
    }
    setShowSaveVideoModal(false)
    setSavedVideoContext(null)
    resetWorkout()
    navigate(returnTo || ROUTES.WORKOUT_ACTIVE)
  }

  const handleDiscardVideoAndReturn = () => {
    setShowSaveVideoModal(false)
    resetWorkout()
    navigate(returnTo || ROUTES.WORKOUT_ACTIVE)
  }

  const handleDiscard = () => {
    resetWorkout()
    // If we came from active workout, return there; otherwise go home
    if (returnTo) {
      navigate(returnTo)
    } else {
      navigate(ROUTES.HOME)
    }
  }

  const handleRetryWorkout = () => {
    restartWorkout() // Use restartWorkout to keep currentExercise and isCameraMode
    onRetry?.()
  }

  const handleDownloadVideo = () => {
    if (!videoUrl || !recordingBlob) return

    const exerciseName = currentExercise?.name.toLowerCase().replace(/\s+/g, '-') || 'workout'
    const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const filename = `${exerciseName}-${timestamp}-${repCount}reps.webm`

    const link = document.createElement('a')
    link.href = videoUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showToast('Video downloaded!', 'success')
  }

  // Check if we're coming from an active workout session
  const isFromActiveWorkout = !!returnTo && !!videoTrackingContext

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Workout Complete</h1>
        <p className="text-gray-400">{currentExercise?.name}</p>
      </div>

      {videoUrl && (
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden bg-dark-900">
            <video
              src={videoUrl}
              controls
              className="w-full aspect-video"
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadVideo}
            >
              <Download size={16} />
              <span className="ml-2">Download Video</span>
            </Button>
          </div>
        </div>
      )}

      <RepCounter
        count={repCount}
        leftArmCount={currentExercise?.detectorType === 'alternating-bicep-curl' ? leftArmCount : undefined}
        rightArmCount={currentExercise?.detectorType === 'alternating-bicep-curl' ? rightArmCount : undefined}
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
          <p className="text-2xl font-bold text-cyan-400">
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
        {isFromActiveWorkout ? (
          // When coming from active workout session - show Log & Return as primary action
          <>
            <Button
              onClick={handleLogAndReturn}
              size="lg"
            >
              <CheckCircle size={18} />
              <span className="ml-2">Log {repCount} Reps & Continue</span>
            </Button>
            <Button variant="ghost" onClick={handleRetryWorkout}>
              <RotateCcw size={18} />
              <span className="ml-2">Retry</span>
            </Button>
            <Button variant="ghost" onClick={handleDiscard}>
              <Trash2 size={18} />
              <span className="ml-2">Discard</span>
            </Button>
          </>
        ) : (
          // Normal flow - save to history
          <>
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
            <Button variant="ghost" onClick={handleRetryWorkout}>
              <RotateCcw size={18} />
              <span className="ml-2">Retry</span>
            </Button>
            <Button variant="ghost" onClick={handleDiscard}>
              <Trash2 size={18} />
              <span className="ml-2">Discard</span>
            </Button>
          </>
        )}
      </div>

      {/* Save Video Modal */}
      {showSaveVideoModal && (
        <SaveVideoModal
          onSave={handleSaveVideoAndReturn}
          onDiscard={handleDiscardVideoAndReturn}
        />
      )}
    </div>
  )
}
