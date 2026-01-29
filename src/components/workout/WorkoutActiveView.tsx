import { useEffect, useState, useCallback, useRef } from 'react'
import { VideoFeed } from './VideoFeed'
import { RepCounter } from './RepCounter'
import { FormFeedbackPanel } from './FormFeedbackPanel'
import { Button } from '@/components/shared/Button'
import { useWorkoutStore } from '@/store/workoutStore'
import { useCameraStore } from '@/store/cameraStore'
import { usePoseDetection } from '@/hooks/usePoseDetection'
import { useVideoRecording } from '@/hooks/useVideoRecording'
import { formatDuration } from '@/utils/helpers'
import { Pause, Play, Square, Plus, Minus } from 'lucide-react'

interface WorkoutActiveViewProps {
  onEnd: () => void
}

export function WorkoutActiveView({ onEnd }: WorkoutActiveViewProps) {
  const {
    currentExercise,
    repCount,
    isPaused,
    formFeedback,
    formScore,
    startTime,
    incrementRep,
    decrementRep,
    pauseWorkout,
    resumeWorkout,
    endWorkout,
    isCameraMode,
  } = useWorkoutStore()

  const { stream } = useCameraStore()
  const [elapsed, setElapsed] = useState(0)
  const [detectionStarted, setDetectionStarted] = useState(false)
  const [showAutoEndWarning, setShowAutoEndWarning] = useState(false)
  const [autoEndCountdown, setAutoEndCountdown] = useState(0)

  // Store video/canvas refs to start detection when initialization completes
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastRepCountRef = useRef(0)
  const lastRepTimeRef = useRef(Date.now())
  const autoEndTimerRef = useRef<number | null>(null)
  const hasPlayedWarningSound = useRef(false)
  const lastCountdownValue = useRef(0)

  const { isInitialized, isLoading, initialize, startDetection, stopDetection } =
    usePoseDetection(currentExercise?.detectorType || 'pushup')

  // Create beep sound for inactivity warning
  const playWarningBeep = useCallback((frequency: number = 800) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }, [])

  const { startRecording, stopRecording, pauseRecording, resumeRecording } =
    useVideoRecording()

  // Define handleEnd early so it can be used in useEffects
  const handleEnd = useCallback(async () => {
    stopDetection()
    await stopRecording()
    endWorkout()
    onEnd()
  }, [stopDetection, stopRecording, endWorkout, onEnd])

  // Initialize pose detection when in camera mode
  useEffect(() => {
    if (isCameraMode) {
      initialize()
    }
  }, [isCameraMode, initialize])

  // Start detection when BOTH video is ready AND pose detection is initialized
  useEffect(() => {
    if (isInitialized && videoRef.current && canvasRef.current && !detectionStarted) {
      console.log('🚀 Both video and pose detection ready, starting...')
      startDetection(videoRef.current, canvasRef.current)
      setDetectionStarted(true)
    }
  }, [isInitialized, detectionStarted, startDetection])

  useEffect(() => {
    if (!startTime || isPaused) return

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime)
    }, 100)

    return () => clearInterval(interval)
  }, [startTime, isPaused])

  // Auto-end workout after inactivity (10 seconds with no new reps)
  useEffect(() => {
    if (!isCameraMode || isPaused || repCount === 0) {
      // Don't auto-end in manual mode, when paused, or if no reps completed yet
      return
    }

    // Reset timer when rep count changes
    if (repCount !== lastRepCountRef.current) {
      lastRepCountRef.current = repCount
      lastRepTimeRef.current = Date.now()
      setShowAutoEndWarning(false)
      setAutoEndCountdown(0)
      hasPlayedWarningSound.current = false
      lastCountdownValue.current = 0

      if (autoEndTimerRef.current) {
        clearTimeout(autoEndTimerRef.current)
        autoEndTimerRef.current = null
      }
    }

    // Check for inactivity every second
    const inactivityCheck = setInterval(() => {
      const timeSinceLastRep = Date.now() - lastRepTimeRef.current
      const INACTIVITY_THRESHOLD = 7000 // 7 seconds (faster detection)
      const WARNING_THRESHOLD = 4000 // Show warning at 4 seconds

      if (timeSinceLastRep >= INACTIVITY_THRESHOLD) {
        // Auto-end workout
        console.log('⏰ Auto-ending workout due to inactivity')
        handleEnd()
      } else if (timeSinceLastRep >= WARNING_THRESHOLD) {
        // Show warning and countdown
        const secondsLeft = Math.ceil((INACTIVITY_THRESHOLD - timeSinceLastRep) / 1000)

        // Play beep sound for each countdown second (3, 2, 1)
        if (secondsLeft !== lastCountdownValue.current && secondsLeft > 0) {
          // Different pitch for each second (higher = more urgent)
          const frequency = secondsLeft === 3 ? 600 : secondsLeft === 2 ? 800 : 1000
          playWarningBeep(frequency)
          lastCountdownValue.current = secondsLeft
        }

        setShowAutoEndWarning(true)
        setAutoEndCountdown(secondsLeft)
      } else {
        setShowAutoEndWarning(false)
        setAutoEndCountdown(0)
        hasPlayedWarningSound.current = false
        lastCountdownValue.current = 0
      }
    }, 1000)

    return () => {
      clearInterval(inactivityCheck)
      if (autoEndTimerRef.current) {
        clearTimeout(autoEndTimerRef.current)
      }
    }
  }, [isCameraMode, isPaused, repCount, handleEnd, playWarningBeep])

  const handleVideoReady = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
      console.log('📹 Video feed ready')
      videoRef.current = video
      canvasRef.current = canvas

      // If already initialized, start detection immediately
      if (isInitialized && !detectionStarted) {
        console.log('🚀 Pose detection already initialized, starting immediately...')
        startDetection(video, canvas)
        setDetectionStarted(true)
      }

      // Start recording with composite canvas (video + skeleton overlay)
      if (stream) {
        startRecording(stream, video, canvas)
      }
    },
    [isInitialized, detectionStarted, startDetection, stream, startRecording]
  )

  const handlePause = () => {
    if (isPaused) {
      resumeWorkout()
      resumeRecording()
    } else {
      pauseWorkout()
      pauseRecording()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading pose detection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {currentExercise?.name || 'Workout'}
        </h1>
        <span className="text-2xl font-mono text-gray-300 tabular-nums">
          {formatDuration(elapsed)}
        </span>
      </div>

      {showAutoEndWarning && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold">
              {autoEndCountdown}
            </div>
            <p className="text-yellow-200 font-medium">
              No reps detected. Workout will end automatically in {autoEndCountdown} second{autoEndCountdown !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              lastRepTimeRef.current = Date.now()
              setShowAutoEndWarning(false)
              hasPlayedWarningSound.current = false
              lastCountdownValue.current = 0
            }}
          >
            Keep Going
          </Button>
        </div>
      )}

      {isCameraMode && stream ? (
        <VideoFeed stream={stream} onVideoReady={handleVideoReady} />
      ) : (
        <div className="w-full aspect-video bg-dark-800 rounded-lg flex items-center justify-center">
          <p className="text-gray-400">Manual tracking mode</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <RepCounter count={repCount} />

          {!isCameraMode && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={decrementRep}
                className="w-12 h-12 rounded-full bg-dark-700 border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-green-500 transition-colors"
              >
                <Minus size={20} />
              </button>
              <button
                onClick={incrementRep}
                className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-black hover:bg-green-600 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>

        {isCameraMode && (
          <FormFeedbackPanel feedback={formFeedback} formScore={formScore} />
        )}
      </div>

      <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-600">
        <Button variant="secondary" onClick={handlePause} size="lg">
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
          <span className="ml-2">{isPaused ? 'Resume' : 'Pause'}</span>
        </Button>
        <Button variant="danger" onClick={handleEnd} size="lg">
          <Square size={20} />
          <span className="ml-2">End Workout</span>
        </Button>
      </div>
    </div>
  )
}
