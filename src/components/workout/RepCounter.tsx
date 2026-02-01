import { Minus, Plus } from 'lucide-react'

interface RepCounterProps {
  count: number
  onIncrement?: () => void
  onDecrement?: () => void
  editable?: boolean
  size?: 'normal' | 'large'
  // For alternating exercises
  leftArmCount?: number
  rightArmCount?: number
  showArmCounts?: boolean
}

export function RepCounter({
  count,
  onIncrement,
  onDecrement,
  editable = false,
  size = 'large',
  leftArmCount,
  rightArmCount,
  showArmCounts = true,
}: RepCounterProps) {
  const hasArmCounts = leftArmCount !== undefined && rightArmCount !== undefined

  if (hasArmCounts && showArmCounts) {
    // Show arm counts for alternating exercises
    return (
      <div className="text-center space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Arm */}
          <div className="bg-dark-800 rounded-lg p-4 border border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Left Arm
            </p>
            <span className="text-3xl font-bold text-blue-400 tabular-nums">
              {leftArmCount}
            </span>
          </div>

          {/* Right Arm */}
          <div className="bg-dark-800 rounded-lg p-4 border border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Right Arm
            </p>
            <span className="text-3xl font-bold text-blue-400 tabular-nums">
              {rightArmCount}
            </span>
          </div>
        </div>

        {/* Total */}
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">
            Total Reps
          </p>
          <span className={
            size === 'large'
              ? 'text-6xl font-bold text-cyan-400 tabular-nums'
              : 'text-4xl font-bold text-cyan-400 tabular-nums'
          }>
            {count}
          </span>
        </div>
      </div>
    )
  }

  // Regular rep counter (non-alternating)
  return (
    <div className="text-center">
      <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">
        Reps
      </p>
      <div className="flex items-center justify-center gap-4">
        {editable && (
          <button
            onClick={onDecrement}
            className="w-10 h-10 rounded-full bg-dark-700 border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-cyan-500 transition-all duration-200 transform hover:scale-110"
          >
            <Minus size={18} />
          </button>
        )}
        <span
          className={
            size === 'large'
              ? 'text-6xl font-bold text-cyan-400 tabular-nums'
              : 'text-4xl font-bold text-cyan-400 tabular-nums'
          }
        >
          {count}
        </span>
        {editable && (
          <button
            onClick={onIncrement}
            className="w-10 h-10 rounded-full bg-dark-700 border border-gray-600 flex items-center justify-center text-gray-300 hover:text-white hover:border-cyan-500 transition-all duration-200 transform hover:scale-110"
          >
            <Plus size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
