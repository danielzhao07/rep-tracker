import { useEffect, useRef, useCallback, useState } from 'react'
import { PoseDetectionService } from '@/services/pose/PoseDetectionService'
import { RepCounterService } from '@/services/pose/RepCounterService'
import { useWorkoutStore } from '@/store/workoutStore'
import type { ExerciseDetectorType, Pose } from '@/types'

export function usePoseDetection(exerciseType: ExerciseDetectorType) {
  const poseServiceRef = useRef<PoseDetectionService | null>(null)
  const repCounterRef = useRef<RepCounterService | null>(null)
  const lastRepCountRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { addRep, setRepPhase, updateFormFeedback, setFormScore, setDebugInfo, setArmCounts } =
    useWorkoutStore()

  const initialize = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Initializing pose detection...')
      const poseService = new PoseDetectionService()
      await poseService.initialize()
      poseServiceRef.current = poseService

      const repCounter = new RepCounterService(exerciseType)
      repCounterRef.current = repCounter
      lastRepCountRef.current = 0
      frameCountRef.current = 0

      setIsInitialized(true)
      console.log('✅ Pose detection initialized successfully')
    } catch (err) {
      console.error('❌ Failed to initialize pose detection:', err)
    } finally {
      setIsLoading(false)
    }
  }, [exerciseType])

  const startDetection = useCallback(
    (videoElement: HTMLVideoElement, canvas?: HTMLCanvasElement) => {
      if (!poseServiceRef.current || !repCounterRef.current) {
        console.warn('⚠️ Cannot start detection: services not initialized')
        return
      }

      console.log('🎥 Starting pose detection on video element...')
      console.log('   Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight)
      console.log('   Video readyState:', videoElement.readyState)

      // Clear any previous callbacks to avoid duplicates
      poseServiceRef.current.clearCallbacks()

      poseServiceRef.current.onPoseDetected((pose: Pose) => {
        frameCountRef.current++
        
        // Get isPaused fresh from store to avoid closure issues
        const { isPaused } = useWorkoutStore.getState()
        if (isPaused) return

        const result = repCounterRef.current!.processFrame(
          pose,
          pose.timestamp
        )

        // Get elbow angle from detector for debugging
        const detector = repCounterRef.current!.getDetector()
        const elbowAngle = detector.getElbowAngle?.() ?? 0
        
        // Update debug info in store (throttled to avoid too many updates)
        if (frameCountRef.current % 5 === 0) {
          setDebugInfo(elbowAngle, true, frameCountRef.current)
        }

        setRepPhase(result.phase)
        updateFormFeedback(result.feedback)

        // Update arm counts if present (for alternating exercises)
        if (result.leftArmCount !== undefined && result.rightArmCount !== undefined) {
          setArmCounts(result.leftArmCount, result.rightArmCount)
        }

        // Check if a NEW rep was completed by comparing with last known count
        if (result.count > lastRepCountRef.current) {
          const history = repCounterRef.current!.getRepHistory()
          const lastRep = history[history.length - 1]
          if (lastRep) {
            console.log(`🔥 Rep ${result.count} detected!`, lastRep)
            addRep(lastRep)
            setFormScore(lastRep.formScore)
          }
          lastRepCountRef.current = result.count
        }
      })

      poseServiceRef.current.startDetection(videoElement, canvas)
      console.log('✅ Pose detection started successfully')
    },
    [addRep, setRepPhase, updateFormFeedback, setFormScore, setDebugInfo, setArmCounts]
  )

  const stopDetection = useCallback(() => {
    console.log('🛑 Stopping pose detection...')
    poseServiceRef.current?.stopDetection()
    setDebugInfo(0, false, 0)
  }, [setDebugInfo])

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
