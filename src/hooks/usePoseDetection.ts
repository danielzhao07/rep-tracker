import { useEffect, useRef, useCallback, useState } from 'react'
import { PoseDetectionService } from '@/services/pose/PoseDetectionService'
import { RepCounterService } from '@/services/pose/RepCounterService'
import { useWorkoutStore } from '@/store/workoutStore'
import type { ExerciseDetectorType, Pose } from '@/types'

export function usePoseDetection(exerciseType: ExerciseDetectorType) {
  const poseServiceRef = useRef<PoseDetectionService | null>(null)
  const repCounterRef = useRef<RepCounterService | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { addRep, setRepPhase, updateFormFeedback, isPaused } =
    useWorkoutStore()

  const initialize = useCallback(async () => {
    setIsLoading(true)
    try {
      const poseService = new PoseDetectionService()
      await poseService.initialize()
      poseServiceRef.current = poseService

      const repCounter = new RepCounterService(exerciseType)
      repCounterRef.current = repCounter

      setIsInitialized(true)
    } catch (err) {
      console.error('Failed to initialize pose detection:', err)
    } finally {
      setIsLoading(false)
    }
  }, [exerciseType])

  const startDetection = useCallback(
    (videoElement: HTMLVideoElement, canvas?: HTMLCanvasElement) => {
      if (!poseServiceRef.current || !repCounterRef.current) return

      poseServiceRef.current.onPoseDetected((pose: Pose) => {
        if (isPaused) return

        const result = repCounterRef.current!.processFrame(
          pose,
          pose.timestamp
        )

        setRepPhase(result.phase)
        updateFormFeedback(result.feedback)

        if (result.count > repCounterRef.current!.getCurrentCount() - 1) {
          const history = repCounterRef.current!.getRepHistory()
          const lastRep = history[history.length - 1]
          if (lastRep) {
            addRep(lastRep)
          }
        }
      })

      poseServiceRef.current.startDetection(videoElement, canvas)
    },
    [isPaused, addRep, setRepPhase, updateFormFeedback]
  )

  const stopDetection = useCallback(() => {
    poseServiceRef.current?.stopDetection()
  }, [])

  useEffect(() => {
    return () => {
      poseServiceRef.current?.destroy()
      poseServiceRef.current = null
      repCounterRef.current = null
    }
  }, [])

  return {
    isInitialized,
    isLoading,
    initialize,
    startDetection,
    stopDetection,
    getRepHistory: () => repCounterRef.current?.getRepHistory() ?? [],
  }
}
