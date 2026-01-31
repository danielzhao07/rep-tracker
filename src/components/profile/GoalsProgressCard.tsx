import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import type { UserGoal, GoalProgress } from '@/types'
import { GOAL_TYPE_LABELS, GOAL_TYPE_ICONS } from '@/types'
import { Target, Plus, Trash2 } from 'lucide-react'

interface GoalsProgressCardProps {
  goals: UserGoal[]
  onCreateGoal: () => void
  onDeleteGoal: (goalId: string) => void
}

export function GoalsProgressCard({ goals, onCreateGoal, onDeleteGoal }: GoalsProgressCardProps) {
  const calculateProgress = (goal: UserGoal): GoalProgress => {
    const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100)
    const remaining = Math.max(goal.targetValue - goal.currentValue, 0)
    const isComplete = goal.currentValue >= goal.targetValue

    // Calculate days remaining if there's an end date
    let daysRemaining: number | undefined
    if (goal.endDate) {
      const endDate = new Date(goal.endDate)
      const today = new Date()
      const diffTime = endDate.getTime() - today.getTime()
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    return {
      goal,
      progress,
      remaining,
      isComplete,
      daysRemaining,
    }
  }

  const activeGoals = goals.filter((g) => g.isActive)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target className="text-green-500" size={20} />
          Goals & Milestones
        </h3>
        <Button onClick={onCreateGoal} size="sm" className="flex items-center gap-1">
          <Plus size={16} />
          <span>New Goal</span>
        </Button>
      </div>

      {/* Goals List */}
      {activeGoals.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <Target className="mx-auto text-gray-500 mb-3" size={40} />
            <p className="text-gray-400">No active goals</p>
            <p className="text-sm text-gray-500 mt-1">
              Set a goal to track your progress
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => {
            const progress = calculateProgress(goal)
            return (
              <Card key={goal.id} className="relative">
                {/* Delete button */}
                <button
                  onClick={() => onDeleteGoal(goal.id)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors p-1"
                  title="Delete goal"
                >
                  <Trash2 size={14} />
                </button>

                {/* Goal Info */}
                <div className="pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{GOAL_TYPE_ICONS[goal.goalType]}</span>
                    <h4 className="font-semibold text-white">
                      {GOAL_TYPE_LABELS[goal.goalType]}
                    </h4>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">
                        {goal.currentValue} / {goal.targetValue}{' '}
                        {goal.goalType.includes('reps') ? 'reps' : 'workouts'}
                      </span>
                      <span className={`font-semibold ${
                        progress.isComplete ? 'text-green-500' : 'text-white'
                      }`}>
                        {progress.progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          progress.isComplete ? 'bg-green-500' : 'bg-green-500/70'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {!progress.isComplete && progress.remaining > 0 && (
                      <span>{progress.remaining} remaining</span>
                    )}
                    {progress.isComplete && (
                      <span className="text-green-500 font-semibold">✓ Complete!</span>
                    )}
                    {progress.daysRemaining !== undefined && progress.daysRemaining > 0 && (
                      <span>{progress.daysRemaining} days left</span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
