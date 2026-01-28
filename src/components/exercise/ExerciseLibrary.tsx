import { ExerciseCard } from './ExerciseCard'
import { EXERCISES_SEED } from '@/utils/constants'
import type { Exercise } from '@/types'

interface ExerciseLibraryProps {
  onSelectExercise: (exercise: Exercise) => void
}

export function ExerciseLibrary({ onSelectExercise }: ExerciseLibraryProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Exercises</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXERCISES_SEED.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onClick={onSelectExercise}
          />
        ))}
      </div>
    </div>
  )
}
