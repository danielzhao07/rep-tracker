import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { ExerciseSelector } from '@/components/exercise/ExerciseSelector'
import { useWorkoutStore } from '@/store/workoutStore'
import { useHistoryStore } from '@/store/historyStore'
import { useAuthStore } from '@/store/authStore'
import { showToast } from '@/components/shared/Toast'
import { ROUTES, EXERCISES_SEED } from '@/utils/constants'
import type { Exercise } from '@/types'
import { Save, ArrowLeft } from 'lucide-react'

export function ManualEntryPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { currentExercise, resetWorkout } = useWorkoutStore()
  const { saveWorkout } = useHistoryStore()

  const [exercise, setExercise] = useState<Exercise>(
    currentExercise || EXERCISES_SEED[0]
  )
  const [reps, setReps] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !reps) return

    setIsSaving(true)
    try {
      await saveWorkout({
        userId: user.id,
        exerciseId: exercise.id,
        repCount: parseInt(reps, 10),
        durationMs: 0,
        formScore: null,
        avgTimePerRep: null,
        videoUrl: null,
        manualEntry: true,
        notes: notes || null,
      })

      showToast('Workout saved!', 'success')
      resetWorkout()
      navigate(ROUTES.HISTORY)
    } catch {
      showToast('Failed to save workout', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => {
          resetWorkout()
          navigate(ROUTES.HOME)
        }}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Manual Entry</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ExerciseSelector
            selectedId={exercise.id}
            onChange={setExercise}
          />

          <div>
            <label
              htmlFor="reps"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Reps
            </label>
            <input
              id="reps"
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              required
              min={1}
              max={999}
              className="w-full bg-dark-800 border border-cyan-700/40 rounded-lg px-4 py-2.5 text-white placeholder-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-[0_0_0_2px_#0891b233] transition-all duration-200"
              placeholder="Number of reps"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              placeholder="Any notes about this workout"
            />
          </div>

          <Button
            type="submit"
            isLoading={isSaving}
            className="w-full"
            size="lg"
          >
            <Save size={18} />
            <span className="ml-2">Save Workout</span>
          </Button>
        </form>
      </Card>
    </div>
  )
}
