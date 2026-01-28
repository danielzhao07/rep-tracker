import { useEffect, useRef, useCallback } from 'react'
import { useCameraStore } from '@/store/cameraStore'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { stream, permissions, error, initializeCamera, stopCamera } =
    useCameraStore()

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const startCamera = useCallback(
    async (deviceId?: string) => {
      await initializeCamera(deviceId)
    },
    [initializeCamera]
  )

  return {
    videoRef,
    stream,
    permissions,
    error,
    startCamera,
    stopCamera,
  }
}
