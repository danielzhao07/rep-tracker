import { Modal } from '@/components/shared/Modal'
import type { SquatDifficultyMode } from '@/utils/constants'

interface SquatDifficultyModalProps {
  isOpen: boolean
  onSelect: (difficulty: SquatDifficultyMode) => void
  onClose: () => void
}

const difficultyOptions: {
  mode: SquatDifficultyMode
  title: string
  description: string
  icon: string
  color: string
}[] = [
  {
    mode: 'easy',
    title: 'Easy Mode',
    description: 'Detects at an easier depth. Good for beginners or warm-ups.',
    icon: '🟢',
    color: 'border-cyan-500 hover:bg-cyan-500/10',
  },
  {
    mode: 'ninety-degree',
    title: '90° Depth',
    description: 'Thighs parallel to the ground. Standard squat depth.',
    icon: '🟡',
    color: 'border-yellow-500 hover:bg-yellow-500/10',
  },
  {
    mode: 'atg',
    title: 'ATG Mode',
    description: 'Ass To Grass - maximum depth. For advanced lifters.',
    icon: '🔴',
    color: 'border-red-500 hover:bg-red-500/10',
  },
]

export function SquatDifficultyModal({
  isOpen,
  onSelect,
  onClose,
}: SquatDifficultyModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Squat Depth">
      <div className="space-y-4">
        <p className="text-gray-400 text-sm text-center mb-6">
          Choose how deep you need to squat for a rep to count
        </p>

        <div className="space-y-3">
          {difficultyOptions.map((option) => (
            <button
              key={option.mode}
              onClick={() => onSelect(option.mode)}
              className={`w-full p-4 rounded-lg border-2 ${option.color} bg-dark-800 text-left transition-all duration-200 hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{option.icon}</span>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {option.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
