export class VideoRecordingService {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private startTime = 0
  private compositeCanvas: HTMLCanvasElement | null = null
  private compositeCtx: CanvasRenderingContext2D | null = null
  private videoElement: HTMLVideoElement | null = null
  private skeletonCanvas: HTMLCanvasElement | null = null
  private animationFrameId: number | null = null
  private isRecording = false

  /**
   * Start recording with composite video + skeleton overlay
   * @param stream - Original camera stream (for audio if needed in future)
   * @param videoElement - The video element showing the camera feed
   * @param skeletonCanvas - The canvas with skeleton overlay drawn on it
   */
  startRecording(
    stream: MediaStream,
    videoElement?: HTMLVideoElement,
    skeletonCanvas?: HTMLCanvasElement
  ): void {
    this.chunks = []
    this.videoElement = videoElement || null
    this.skeletonCanvas = skeletonCanvas || null

    let recordingStream: MediaStream

    // If we have both video element and skeleton canvas, create composite
    if (videoElement && skeletonCanvas) {
      console.log('[Recording] Starting composite recording (video + skeleton)')
      
      // Create composite canvas
      this.compositeCanvas = document.createElement('canvas')
      this.compositeCanvas.width = videoElement.videoWidth || 1280
      this.compositeCanvas.height = videoElement.videoHeight || 720
      this.compositeCtx = this.compositeCanvas.getContext('2d')!

      // Start drawing composite frames
      this.isRecording = true
      this.drawCompositeFrame()

      // Get stream from composite canvas
      recordingStream = this.compositeCanvas.captureStream(30) // 30 fps
    } else {
      console.log('[Recording] Starting simple recording (raw stream)')
      recordingStream = stream
    }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

    this.mediaRecorder = new MediaRecorder(recordingStream, { mimeType })

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.start(1000) // Collect data every second
    this.startTime = Date.now()
    console.log('[Recording] Started')
  }

  private drawCompositeFrame(): void {
    if (!this.isRecording || !this.compositeCtx || !this.compositeCanvas) return

    const ctx = this.compositeCtx
    const canvas = this.compositeCanvas

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw video frame (mirrored to match the live preview)
    if (this.videoElement && this.videoElement.readyState >= 2) {
      ctx.save()
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1) // Mirror horizontally
      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height)
      ctx.restore()
    }

    // Draw skeleton overlay (already mirrored from PoseDetectionService)
    if (this.skeletonCanvas) {
      ctx.save()
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1) // Mirror to match
      ctx.drawImage(this.skeletonCanvas, 0, 0, canvas.width, canvas.height)
      ctx.restore()
    }

    // Continue drawing frames
    this.animationFrameId = requestAnimationFrame(() => this.drawCompositeFrame())
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'))
        return
      }

      // Stop the composite frame drawing
      this.isRecording = false
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' })
        this.chunks = []
        this.compositeCanvas = null
        this.compositeCtx = null
        this.videoElement = null
        this.skeletonCanvas = null
        console.log('[Recording] Stopped, blob size:', (blob.size / 1024 / 1024).toFixed(2), 'MB')
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  pauseRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause()
      this.isRecording = false
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume()
      this.isRecording = true
      this.drawCompositeFrame()
    }
  }

  getRecordingDuration(): number {
    return this.startTime > 0 ? Date.now() - this.startTime : 0
  }

  getIsRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }
}
