import { EXERCISES_SEED } from '@/utils/constants'
import type { Exercise } from '@/types'

interface ExerciseSelectorProps {
  selectedId: string
  onChange: (exercise: Exercise) => void
}

export function ExerciseSelector({
  selectedId,
  onChange,
}: ExerciseSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Exercise
      </label>
      <select
        value={selectedId}
        onChange={(e) => {
          const exercise = EXERCISES_SEED.find((ex) => ex.id === e.target.value)
          if (exercise) onChange(exercise)
        }}
        className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      >
        {EXERCISES_SEED.map((exercise) => (
          <option key={exercise.id} value={exercise.id}>
            {exercise.name}
          </option>
        ))}
      </select>
    </div>
  )
}
