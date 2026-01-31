export type GoalType =
  | 'weekly_reps'
  | 'monthly_workouts'
  | 'total_reps_milestone'
  | 'weekly_workouts'

export interface UserGoal {
  id: string
  userId: string
  goalType: GoalType
  targetValue: number
  currentValue: number
  startDate: string
  endDate?: string
  isActive: boolean
  createdAt: string
}

// For creating new goals
export interface CreateGoalInput {
  goalType: GoalType
  targetValue: number
  startDate: string
  endDate?: string
}

// For updating goals
export interface UpdateGoalInput {
  targetValue?: number
  currentValue?: number
  endDate?: string
  isActive?: boolean
}

// Goal progress calculation
export interface GoalProgress {
  goal: UserGoal
  progress: number // 0-100 percentage
  remaining: number
  isComplete: boolean
  daysRemaining?: number
}

// Goal display helpers
export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  weekly_reps: 'Weekly Reps Goal',
  monthly_workouts: 'Monthly Workouts Goal',
  total_reps_milestone: 'Total Reps Milestone',
  weekly_workouts: 'Weekly Workouts Goal',
}

export const GOAL_TYPE_ICONS: Record<GoalType, string> = {
  weekly_reps: '💪',
  monthly_workouts: '📅',
  total_reps_milestone: '🏆',
  weekly_workouts: '🔥',
}
