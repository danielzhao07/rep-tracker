import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision'
import type { Pose } from '@/types'

type PoseCallback = (pose: Pose) => void

/**
 * PoseDetectionService - Modern MediaPipe Tasks Vision API
 *
 * Uses the NEW @mediapipe/tasks-vision package (not legacy @mediapipe/pose)
 * Matches the architecture of the working Python implementation
 *
 * References:
 * - https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 * - https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js
 * - https://codepen.io/mediapipe-preview/pen/abRLMxN
 */
export class PoseDetectionService {
  private poseLandmarker: PoseLandmarker | null = null
  private callbacks: PoseCallback[] = []
  private animationFrameId: number | null = null
  private videoElement: HTMLVideoElement | null = null
  private canvasCtx: CanvasRenderingContext2D | null = null
  private drawingUtils: DrawingUtils | null = null
  private isRunning = false
  private frameCount = 0
  private lastLogTime = 0
  private lastVideoTime = -1

  async initialize(): Promise<void> {
    console.log('[PoseDetection] Initializing MediaPipe Tasks Vision PoseLandmarker...')

    try {
      // Load WASM files for MediaPipe Tasks Vision
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      )
      console.log('[PoseDetection] WASM files loaded')

      // Create PoseLandmarker (equivalent to Python's mp.tasks.vision.PoseLandmarker)
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU', // Use GPU acceleration for better performance
        },
        runningMode: 'VIDEO', // VIDEO mode for real-time webcam (like Python's LIVE_STREAM)
        numPoses: 1, // Detect single person
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      console.log('[PoseDetection] MediaPipe Tasks Vision PoseLandmarker initialized successfully')
    } catch (error) {
      console.error('[PoseDetection] Failed to initialize PoseLandmarker:', error)
      throw error
    }
  }

  startDetection(
    videoElement: HTMLVideoElement,
    canvas?: HTMLCanvasElement
  ): void {
    console.log(
      '[PoseDetection] Starting detection with video:',
      videoElement.videoWidth,
      'x',
      videoElement.videoHeight
    )

    this.videoElement = videoElement
    if (canvas) {
      this.canvasCtx = canvas.getContext('2d')
      if (this.canvasCtx) {
        this.drawingUtils = new DrawingUtils(this.canvasCtx)
        console.log('Canvas context acquired:', canvas.width, 'x', canvas.height)
      }
    } else {
      console.warn('No canvas provided - skeleton will not be drawn')
    }

    this.isRunning = true
    this.frameCount = 0
    this.lastLogTime = Date.now()
    this.lastVideoTime = -1
    this.processFrame()
  }

  stopDetection(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    console.log('Pose detection stopped')
  }

  onPoseDetected(callback: PoseCallback): () => void {
    this.callbacks.push(callback)
    console.log(`Pose callback registered (total: ${this.callbacks.length})`)
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback)
    }
  }

  clearCallbacks(): void {
    this.callbacks = []
    console.log('🧹 Pose callbacks cleared')
  }

  destroy(): void {
    this.stopDetection()
    this.poseLandmarker?.close()
    this.poseLandmarker = null
    this.callbacks = []
    this.drawingUtils = null
    console.log('💥 PoseDetectionService destroyed')
  }

  /**
   * Real-time detection loop
   * Uses detectForVideo() - equivalent to Python's detect_async()
   */
  private processFrame(): void {
    if (!this.isRunning || !this.poseLandmarker || !this.videoElement) return

    const now = performance.now()

    // Prevent processing same frame twice (like Python's timestamp check)
    if (this.videoElement.currentTime !== this.lastVideoTime) {
      try {
        // detectForVideo() equivalent to Python's detect_async()
        const results = this.poseLandmarker.detectForVideo(
          this.videoElement,
          now
        )

        this.handleResults(results)
        this.lastVideoTime = this.videoElement.currentTime
        this.frameCount++
      } catch (err) {
        console.error('Detection error:', err)
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.processFrame())
  }

  /**
   * Handle detection results from MediaPipe
   */
  private handleResults(results: PoseLandmarkerResult): void {
    // Log every 2 seconds
    const now = Date.now()
    if (now - this.lastLogTime > 2000) {
      console.log(
        `Pose detection - Frame ${this.frameCount}, Landmarks: ${
          results.landmarks && results.landmarks.length > 0
            ? 'YES (' + results.landmarks[0].length + ')'
            : 'NO'
        }`
      )
      this.lastLogTime = now
    }

    // Draw skeleton on canvas
    if (this.canvasCtx && this.drawingUtils) {
      this.drawSkeleton(results)
    }

    // Send pose data to callbacks
    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0] // First person

      const pose: Pose = {
        landmarks: landmarks.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility ?? 0,
        })),
        timestamp: Date.now(),
      }

      this.callbacks.forEach((cb) => cb(pose))
    }
  }

  /**
   * Draw skeleton using MediaPipe's DrawingUtils
   * Draws GREEN skeleton matching user's Python implementation style
   * Only draws landmarks with high visibility to prevent glitching
   *
   * CRITICAL: Use MANUAL drawing approach (do NOT use drawingUtils.drawLandmarks/drawConnectors)
   * Even though Google examples use DrawingUtils methods directly, they DO NOT work reliably here.
   * Manual drawing with visibility filtering is required for stable skeleton rendering.
   * See DEVELOPMENT.md for detailed explanation.
   */
  private drawSkeleton(results: PoseLandmarkerResult): void {
    if (!this.canvasCtx || !this.drawingUtils) return

    const canvas = this.canvasCtx.canvas

    // Clear canvas completely
    this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

    if (!results.landmarks || results.landmarks.length === 0) {
      return
    }

    const landmarks = results.landmarks[0] // First person

    // Filter landmarks to only show those with high visibility (reduces glitching)
    const MIN_VISIBILITY = 0.6 // Only draw if landmark is clearly visible

    // Draw connections manually with visibility check to prevent glitchy lines
    this.canvasCtx.strokeStyle = '#00FF00' // Green lines
    this.canvasCtx.lineWidth = 3
    this.canvasCtx.lineCap = 'round'

    // Get connection pairs from PoseLandmarker.POSE_CONNECTIONS
    const connections = PoseLandmarker.POSE_CONNECTIONS

    for (const connection of connections) {
      const startIdx = connection.start
      const endIdx = connection.end
      const startLandmark = landmarks[startIdx]
      const endLandmark = landmarks[endIdx]

      // Only draw connection if BOTH endpoints are clearly visible
      const startVis = startLandmark?.visibility ?? 0
      const endVis = endLandmark?.visibility ?? 0

      if (startVis > MIN_VISIBILITY && endVis > MIN_VISIBILITY) {
        this.canvasCtx.beginPath()
        this.canvasCtx.moveTo(startLandmark.x * canvas.width, startLandmark.y * canvas.height)
        this.canvasCtx.lineTo(endLandmark.x * canvas.width, endLandmark.y * canvas.height)
        this.canvasCtx.stroke()
      }
    }

    // Draw landmark nodes (green circles) only for visible landmarks
    this.canvasCtx.fillStyle = '#00FF00'
    this.canvasCtx.strokeStyle = '#FFFFFF'
    this.canvasCtx.lineWidth = 2

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i]
      const visibility = lm.visibility ?? 0

      if (visibility > MIN_VISIBILITY) {
        const x = lm.x * canvas.width
        const y = lm.y * canvas.height

        // Larger circles for key joints
        const isKeyJoint = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26].includes(i)
        const radius = isKeyJoint ? 6 : 4

        this.canvasCtx.beginPath()
        this.canvasCtx.arc(x, y, radius, 0, 2 * Math.PI)
        this.canvasCtx.fill()
        this.canvasCtx.stroke()
      }
    }

    // Highlight elbows in yellow for debugging push-up detection
    const leftElbow = landmarks[13]
    const rightElbow = landmarks[14]

    this.canvasCtx.fillStyle = '#FFFF00' // Yellow
    this.canvasCtx.strokeStyle = '#000000' // Black outline
    this.canvasCtx.lineWidth = 2

    if (leftElbow && (leftElbow.visibility ?? 0) > MIN_VISIBILITY) {
      this.canvasCtx.beginPath()
      this.canvasCtx.arc(
        leftElbow.x * canvas.width,
        leftElbow.y * canvas.height,
        8,
        0,
        2 * Math.PI
      )
      this.canvasCtx.fill()
      this.canvasCtx.stroke()
    }
    if (rightElbow && (rightElbow.visibility ?? 0) > MIN_VISIBILITY) {
      this.canvasCtx.beginPath()
      this.canvasCtx.arc(
        rightElbow.x * canvas.width,
        rightElbow.y * canvas.height,
        8,
        0,
        2 * Math.PI
      )
      this.canvasCtx.fill()
      this.canvasCtx.stroke()
    }
  }
}
