import { useRef, useCallback, useState } from 'react'
import { AudioCueService } from '@/services/audio/AudioCueService'

export function useAudioCues() {
  const serviceRef = useRef<AudioCueService>(new AudioCueService())
  const [isEnabled, setIsEnabled] = useState(true)

  const toggleAudio = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev
      serviceRef.current.setEnabled(next)
      return next
    })
  }, [])

  const playCountdown = useCallback(async () => {
    await serviceRef.current.playCountdown()
  }, [])

  const speak = useCallback((text: string) => {
    serviceRef.current.speak(text)
  }, [])

  const playWorkoutComplete = useCallback(() => {
    serviceRef.current.playWorkoutComplete()
  }, [])

  return {
    isEnabled,
    toggleAudio,
    playCountdown,
    speak,
    playWorkoutComplete,
  }
}
