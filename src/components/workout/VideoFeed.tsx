import { useEffect, useRef } from 'react'

interface VideoFeedProps {
  stream: MediaStream | null
  onVideoReady?: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => void
  showOverlay?: boolean
}

export function VideoFeed({ stream, onVideoReady, showOverlay = true }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play()
        if (onVideoReady && videoRef.current && canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight
          onVideoReady(videoRef.current, canvasRef.current)
        }
      }
    }
  }, [stream, onVideoReady])

  return (
    <div className="relative w-full aspect-video bg-dark-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover mirror"
        style={{ transform: 'scaleX(-1)' }}
      />
      {showOverlay && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}
    </div>
  )
}
