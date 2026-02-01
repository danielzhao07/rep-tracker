import { Card } from '@/components/shared/Card'
import { Dumbbell, Video } from 'lucide-react'
import type { Exercise } from '@/types'

interface ExerciseCardProps {
  exercise: Exercise
  onClick: (exercise: Exercise) => void
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  // Exercises that support video detection
  const supportsVideoDetection = ['pushup', 'bicep-curl', 'alternating-bicep-curl', 'squat'].includes(exercise.detectorType)
  
  return (
    <Card hover onClick={() => onClick(exercise)} className="border-cyan-700/30 hover:border-cyan-600/50 transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-900/40 to-dark-800 flex items-center justify-center flex-shrink-0 border border-cyan-700/30 relative">
          <Dumbbell className="text-cyan-400" size={28} />
          {supportsVideoDetection && (
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Video className="text-white" size={14} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-lg">{exercise.name}</h3>
          </div>
          <p className="text-gray-400 text-sm mt-1">{exercise.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {exercise.category}
            </span>
            {supportsVideoDetection && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-cyan-600/20 text-cyan-300 border border-cyan-500/40">
                <Video size={10} />
                AI Detection
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
