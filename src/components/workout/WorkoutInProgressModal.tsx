interface WorkoutInProgressModalProps {
  isOpen: boolean
  onResume: () => void
  onStartNew: () => void
  onCancel: () => void
}

export function WorkoutInProgressModal({ isOpen, onResume, onStartNew, onCancel }: WorkoutInProgressModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          You have a workout in progress
        </h3>
        <p className="text-gray-500 mb-6">
          If you start a new workout, your old workout will be permanently deleted.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-medium transition-colors"
          >
            Resume workout in progress
          </button>
          <button
            onClick={onStartNew}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-cyan-500 font-medium transition-colors"
          >
            Start new workout
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
