import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { VideoFeed } from './VideoFeed'
import { Volume2, VolumeX } from 'lucide-react'

interface CameraSetupModalProps {
  isOpen: boolean
  stream: MediaStream | null
  audioEnabled: boolean
  onToggleAudio: () => void
  onStart: () => void
  onClose: () => void
}

export function CameraSetupModal({
  isOpen,
  stream,
  audioEnabled,
  onToggleAudio,
  onStart,
  onClose,
}: CameraSetupModalProps) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [countdownText, setCountdownText] = useState('Position yourself in frame')
  const [isCountingDown, setIsCountingDown] = useState(false)

  const startCountdown = useCallback(() => {
    setIsCountingDown(true)

    const phases = [
      { text: 'Position yourself in frame', time: 2000 },
      { text: 'Get ready...', time: 2000 },
      { text: '3', time: 1000 },
      { text: '2', time: 1000 },
      { text: '1', time: 1000 },
      { text: 'GO!', time: 500 },
    ]

    let totalDelay = 0
    phases.forEach((phase, index) => {
      setTimeout(() => {
        setCountdownText(phase.text)
        if (['3', '2', '1'].includes(phase.text)) {
          setCountdown(parseInt(phase.text))
        } else if (phase.text === 'GO!') {
          setCountdown(0)
        }

        if (index === phases.length - 1) {
          setTimeout(() => {
            onStart()
          }, phase.time)
        }
      }, totalDelay)
      totalDelay += phase.time
    })
  }, [onStart])

  useEffect(() => {
    if (!isOpen) {
      setCountdown(null)
      setCountdownText('Position yourself in frame')
      setIsCountingDown(false)
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-1">Camera Setup</h2>
          <p className="text-gray-400 text-sm">
            Make sure your full body is visible in the frame
          </p>
        </div>

        <VideoFeed stream={stream} showOverlay={false} />

        {isCountingDown && (
          <div className="text-center">
            {countdown !== null && countdown > 0 ? (
              <span className="text-6xl font-bold text-cyan-400 animate-pulse">
                {countdown}
              </span>
            ) : countdown === 0 ? (
              <span className="text-4xl font-bold text-cyan-400 animate-pulse">GO!</span>
            ) : (
              <span className="text-lg text-gray-300">{countdownText}</span>
            )}
          </div>
        )}

        {!isCountingDown && (
          <div className="flex items-center justify-between">
            <button
              onClick={onToggleAudio}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              Audio {audioEnabled ? 'on' : 'off'}
            </button>

            <Button onClick={startCountdown} size="lg" disabled={!stream}>
              Start Workout
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
