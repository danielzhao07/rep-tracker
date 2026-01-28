export class AudioCueService {
  private synth: SpeechSynthesis | null = null
  private enabled = true

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  speak(text: string): void {
    if (!this.enabled || !this.synth) return

    // Cancel any pending speech
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    this.synth.speak(utterance)
  }

  async playCountdown(): Promise<void> {
    const phases = [
      { text: 'Get ready', delay: 2000 },
      { text: '3', delay: 1000 },
      { text: '2', delay: 1000 },
      { text: '1', delay: 1000 },
      { text: 'Go!', delay: 0 },
    ]

    for (const phase of phases) {
      this.speak(phase.text)
      if (phase.delay > 0) {
        await this.delay(phase.delay)
      }
    }
  }

  playRepComplete(): void {
    this.playBeep(800, 100)
  }

  playWorkoutComplete(): void {
    this.speak('Great job! Workout complete.')
  }

  private playBeep(frequency: number, duration: number): void {
    if (!this.enabled) return

    try {
      const audioCtx = new AudioContext()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      oscillator.start()
      oscillator.stop(audioCtx.currentTime + duration / 1000)

      setTimeout(() => audioCtx.close(), duration + 100)
    } catch {
      // Audio not available
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
