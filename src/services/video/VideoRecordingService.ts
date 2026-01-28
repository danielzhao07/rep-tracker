export class VideoRecordingService {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private startTime = 0

  startRecording(stream: MediaStream): void {
    this.chunks = []

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

    this.mediaRecorder = new MediaRecorder(stream, { mimeType })

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.mediaRecorder.start(1000) // Collect data every second
    this.startTime = Date.now()
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'video/webm' })
        this.chunks = []
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  pauseRecording(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }

  getRecordingDuration(): number {
    return this.startTime > 0 ? Date.now() - this.startTime : 0
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }
}
