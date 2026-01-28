import { Minus, Plus } from 'lucide-react'

interface RepCounterProps {
  count: number
  onIncrement?: () => void
  onDecrement?: () => void
  editable?: boolean
  size?: 'normal' | 'large'
}

export function RepCounter({
  count,
  onIncrement,
  onDecrement,
  editable = false,
  size = 'large',
}: RepCounterProps) {
  return (
    <div className="text-center">
      <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">
        Reps
      </p>
      <div className="flex items-center justify-center gap-4">
        {editable && (
          <button
            onClick={onDecrement}
            className="w-10 h-10 rounded-full bg-dark-700 border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-green-500 transition-colors"
          >
            <Minus size={18} />
          </button>
        )}
        <span
          className={
            size === 'large'
              ? 'text-6xl font-bold text-green-500 tabular-nums'
              : 'text-4xl font-bold text-green-500 tabular-nums'
          }
        >
          {count}
        </span>
        {editable && (
          <button
            onClick={onIncrement}
            className="w-10 h-10 rounded-full bg-dark-700 border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-green-500 transition-colors"
          >
            <Plus size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
