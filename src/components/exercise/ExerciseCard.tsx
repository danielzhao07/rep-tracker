import { Card } from '@/components/shared/Card'
import { Dumbbell } from 'lucide-react'
import type { Exercise } from '@/types'

interface ExerciseCardProps {
  exercise: Exercise
  onClick: (exercise: Exercise) => void
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  return (
    <Card hover onClick={() => onClick(exercise)}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="text-green-500" size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-lg">{exercise.name}</h3>
          <p className="text-gray-400 text-sm mt-1">{exercise.description}</p>
          <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
            {exercise.category}
          </span>
        </div>
      </div>
    </Card>
  )
}
