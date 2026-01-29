import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import type { GoalType, CreateGoalInput } from '@/types'
import { GOAL_TYPE_LABELS } from '@/types'

interface CreateGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (input: CreateGoalInput) => Promise<void>
}

export function CreateGoalModal({ isOpen, onClose, onCreate }: CreateGoalModalProps) {
  const [goalType, setGoalType] = useState<GoalType>('weekly_reps')
  const [targetValue, setTargetValue] = useState<string>('150')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const today = new Date().toISOString().split('T')[0]
      let endDate: string | undefined

      // Calculate end date based on goal type
      if (goalType === 'weekly_reps' || goalType === 'weekly_workouts') {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        endDate = nextWeek.toISOString().split('T')[0]
      } else if (goalType === 'monthly_workouts') {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        endDate = nextMonth.toISOString().split('T')[0]
      }

      await onCreate({
        goalType,
        targetValue: parseInt(targetValue),
        startDate: today,
        endDate,
      })

      // Reset form
      setGoalType('weekly_reps')
      setTargetValue('150')
      onClose()
    } catch (error) {
      console.error('Failed to create goal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Goal">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Type */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Goal Type
          </label>
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as GoalType)}
            className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {(Object.keys(GOAL_TYPE_LABELS) as GoalType[]).map((type) => (
              <option key={type} value={type}>
                {GOAL_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {/* Target Value */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Target {goalType.includes('reps') ? 'Reps' : 'Workouts'}
          </label>
          <input
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            min="1"
            required
            className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter target value"
          />
          <p className="text-xs text-gray-500 mt-1">
            {goalType === 'total_reps_milestone'
              ? 'Lifetime milestone (no deadline)'
              : 'Will reset at the end of the period'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Goal
          </Button>
        </div>
      </form>
    </Modal>
  )
}
