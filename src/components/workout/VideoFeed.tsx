import { useEffect, useRef } from 'react'
import { useWorkoutStore } from '@/store/workoutStore'

interface VideoFeedProps {
  stream: MediaStream | null
  onVideoReady?: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => void
  showOverlay?: boolean
}

export function VideoFeed({ stream, onVideoReady, showOverlay = true }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { currentRepPhase, repCount, debugElbowAngle, debugPoseDetected, debugFrameCount } = useWorkoutStore()

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play()
        if (onVideoReady && videoRef.current && canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight
          console.log('📐 Canvas sized to:', canvasRef.current.width, 'x', canvasRef.current.height)
          onVideoReady(videoRef.current, canvasRef.current)
        }
      }
    }
  }, [stream, onVideoReady])

  // Phase color indicator
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'top': return 'bg-cyan-500'
      case 'eccentric': return 'bg-yellow-500'
      case 'bottom': return 'bg-red-500'
      case 'concentric': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  // Get angle bar color based on value
  const getAngleBarColor = (angle: number) => {
    if (angle > 150) return 'bg-cyan-500' // Extended
    if (angle > 120) return 'bg-yellow-500' // Mid
    if (angle > 100) return 'bg-orange-500' // Lowering
    return 'bg-red-500' // Bottom
  }

  return (
    <div className="relative w-full aspect-video bg-dark-900 rounded-lg overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
        style={{ transform: 'scaleX(-1)' }}
      />
      {showOverlay && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10 object-contain"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}
      
      {/* Debug overlay - left side */}
      <div className="absolute top-4 left-4 space-y-2 z-20">
        {/* Phase indicator */}
        <div className="flex items-center gap-2 bg-black/80 px-3 py-2 rounded-lg">
          <div className={`w-3 h-3 rounded-full ${getPhaseColor(currentRepPhase)} animate-pulse`} />
          <span className="text-white text-sm font-mono uppercase">{currentRepPhase}</span>
        </div>
        
        {/* Elbow angle display */}
        <div className="bg-black/80 px-3 py-2 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Elbow Angle</div>
          <div className="text-2xl font-bold text-white font-mono">
            {debugElbowAngle.toFixed(0)}°
          </div>
          {/* Visual angle bar */}
          <div className="w-32 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
            <div 
              className={`h-full ${getAngleBarColor(debugElbowAngle)} transition-all duration-100`}
              style={{ width: `${Math.min(100, (debugElbowAngle / 180) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>0°</span>
            <span>90°</span>
            <span>180°</span>
          </div>
        </div>

        {/* Detection status */}
        <div className="bg-black/80 px-3 py-2 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${debugPoseDetected ? 'bg-cyan-500' : 'bg-red-500'}`} />
            <span className="text-gray-300">
              {debugPoseDetected ? 'Pose detected' : 'No pose'}
            </span>
          </div>
          <div className="text-gray-500 mt-1">Frames: {debugFrameCount}</div>
        </div>
      </div>
      
      {/* Rep count overlay - right side */}
      <div className="absolute top-4 right-4 bg-cyan-500 text-black font-bold text-3xl px-5 py-3 rounded-lg shadow-lg shadow-cyan-500/50 z-20 animate-pulse">
        {repCount}
      </div>

      {/* Camera position tip */}
      <div className="absolute bottom-4 left-4 right-4 bg-black/70 px-4 py-2 rounded-lg z-20">
        <p className="text-xs text-gray-300 text-center">
          💡 Position camera to your <strong>side</strong> for best detection. Your full arm (shoulder→elbow→wrist) should be visible.
        </p>
      </div>
    </div>
  )
}
