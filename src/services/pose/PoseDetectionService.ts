import { Pose as MPPose } from '@mediapipe/pose'
import type { Pose } from '@/types'

type PoseCallback = (pose: Pose) => void

export class PoseDetectionService {
  private pose: MPPose | null = null
  private callbacks: PoseCallback[] = []
  private animationFrameId: number | null = null
  private videoElement: HTMLVideoElement | null = null
  private canvasCtx: CanvasRenderingContext2D | null = null
  private isRunning = false

  async initialize(): Promise<void> {
    this.pose = new MPPose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    })

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    this.pose.onResults((results) => {
      if (results.poseLandmarks) {
        const pose: Pose = {
          landmarks: results.poseLandmarks.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 0,
          })),
          timestamp: Date.now(),
        }
        this.callbacks.forEach((cb) => cb(pose))
      }

      // Draw pose on canvas if available
      if (this.canvasCtx && results.poseLandmarks) {
        this.drawPose(results)
      }
    })

    await this.pose.initialize()
  }

  startDetection(
    videoElement: HTMLVideoElement,
    canvas?: HTMLCanvasElement
  ): void {
    this.videoElement = videoElement
    if (canvas) {
      this.canvasCtx = canvas.getContext('2d')
    }
    this.isRunning = true
    this.processFrame()
  }

  stopDetection(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  onPoseDetected(callback: PoseCallback): () => void {
    this.callbacks.push(callback)
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback)
    }
  }

  destroy(): void {
    this.stopDetection()
    this.pose?.close()
    this.pose = null
    this.callbacks = []
  }

  private async processFrame(): Promise<void> {
    if (!this.isRunning || !this.pose || !this.videoElement) return

    if (this.videoElement.readyState >= 2) {
      await this.pose.send({ image: this.videoElement })
    }

    this.animationFrameId = requestAnimationFrame(() => this.processFrame())
  }

  private drawPose(results: { poseLandmarks?: Array<{ x: number; y: number; z: number; visibility?: number }> }): void {
    if (!this.canvasCtx) return

    const canvas = this.canvasCtx.canvas
    this.canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

    if (!results.poseLandmarks) return

    // Draw connections
    const connections = [
      [11, 13], [13, 15], // Left arm
      [12, 14], [14, 16], // Right arm
      [11, 12], // Shoulders
      [11, 23], [12, 24], // Torso
      [23, 24], // Hips
      [23, 25], [25, 27], // Left leg
      [24, 26], [26, 28], // Right leg
    ]

    this.canvasCtx.strokeStyle = '#10b981'
    this.canvasCtx.lineWidth = 3

    for (const [start, end] of connections) {
      const a = results.poseLandmarks[start]
      const b = results.poseLandmarks[end]
      if (a && b && (a.visibility ?? 0) > 0.5 && (b.visibility ?? 0) > 0.5) {
        this.canvasCtx.beginPath()
        this.canvasCtx.moveTo(a.x * canvas.width, a.y * canvas.height)
        this.canvasCtx.lineTo(b.x * canvas.width, b.y * canvas.height)
        this.canvasCtx.stroke()
      }
    }

    // Draw landmarks
    for (const landmark of results.poseLandmarks) {
      if ((landmark.visibility ?? 0) > 0.5) {
        this.canvasCtx.fillStyle = '#10b981'
        this.canvasCtx.beginPath()
        this.canvasCtx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          5,
          0,
          2 * Math.PI
        )
        this.canvasCtx.fill()
      }
    }
  }
}
