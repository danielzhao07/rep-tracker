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
      console.log('[VideoRecording] startRecording called with:', {
        hasStream: !!stream,
        hasVideoElement: !!videoElement,
        hasSkeletonCanvas: !!skeletonCanvas
      })
      const service = new VideoRecordingService()
      service.startRecording(stream, videoElement, skeletonCanvas)
      serviceRef.current = service
      console.log('[VideoRecording] Service ref set:', !!serviceRef.current)
      setIsRecording(true)
    },
    [setIsRecording]
  )

  const stopRecording = useCallback(async () => {
    console.log('[VideoRecording] stopRecording called, serviceRef:', !!serviceRef.current)
    if (!serviceRef.current) {
      console.log('[VideoRecording] No service ref, returning null')
      return null
    }

    try {
      const blob = await serviceRef.current.stopRecording()
      console.log('[VideoRecording] Got blob from service:', blob ? `${blob.size} bytes` : 'null')
      if (blob && blob.size > 0) {
        setRecordingBlob(blob)
        console.log('[VideoRecording] setRecordingBlob called with valid blob')
      } else {
        console.log('[VideoRecording] Blob is empty or null, not setting')
      }
      setIsRecording(false)
      serviceRef.current = null
      return blob
    } catch (error) {
      console.error('[VideoRecording] Error stopping recording:', error)
      setIsRecording(false)
      serviceRef.current = null
      return null
    }
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
