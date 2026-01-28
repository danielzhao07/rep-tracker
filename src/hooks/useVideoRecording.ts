import { useRef, useCallback } from 'react'
import { VideoRecordingService } from '@/services/video/VideoRecordingService'
import { useWorkoutStore } from '@/store/workoutStore'

export function useVideoRecording() {
  const serviceRef = useRef<VideoRecordingService | null>(null)
  const { setRecordingBlob, setIsRecording } = useWorkoutStore()

  const startRecording = useCallback(
    (stream: MediaStream) => {
      const service = new VideoRecordingService()
      service.startRecording(stream)
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
