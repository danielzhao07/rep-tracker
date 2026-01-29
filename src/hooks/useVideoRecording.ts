import { useRef, useCallback } from 'react'
import { VideoRecordingService } from '@/services/video/VideoRecordingService'
import { useWorkoutStore } from '@/store/workoutStore'

export function useVideoRecording() {
  const serviceRef = useRef<VideoRecordingService | null>(null)
  const { setRecordingBlob, setIsRecording } = useWorkoutStore()

  /**
   * Start recording with optional composite canvas support
   * @param stream - Camera stream
   * @param videoElement - Optional: The video element showing camera feed
   * @param skeletonCanvas - Optional: The canvas with skeleton overlay
   */
  const startRecording = useCallback(
    (
      stream: MediaStream,
      videoElement?: HTMLVideoElement,
      skeletonCanvas?: HTMLCanvasElement
    ) => {
      const service = new VideoRecordingService()
      service.startRecording(stream, videoElement, skeletonCanvas)
      serviceRef.current = service
      setIsRecording(true)
    },
    [setIsRecording]
  )

  const stopRecording = useCallback(async () => {
    if (!serviceRef.current) return null

    const blob = await serviceRef.current.stopRecording()
    setRecordingBlob(blob)
    setIsRecording(false)
    serviceRef.current = null
    return blob
  }, [setRecordingBlob, setIsRecording])

  const pauseRecording = useCallback(() => {
    serviceRef.current?.pauseRecording()
  }, [])

  const resumeRecording = useCallback(() => {
    serviceRef.current?.resumeRecording()
  }, [])

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  }
}
