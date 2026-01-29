import { supabase } from '@/lib/supabase'
import type { UserGoal, CreateGoalInput, UpdateGoalInput } from '@/types'

export class GoalsRepository {
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Failed to fetch goals:', error.message)
      throw error
    }

    return data.map(this.mapFromDb)
  }

  async getActiveGoals(userId: string): Promise<UserGoal[]> {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Failed to fetch active goals:', error.message)
      throw error
    }

    return data.map(this.mapFromDb)
  }

  async createGoal(userId: string, input: CreateGoalInput): Promise<UserGoal> {
    const { data, error } = await supabase
      .from('user_goals')
      .insert({
        user_id: userId,
        goal_type: input.goalType,
        target_value: input.targetValue,
        start_date: input.startDate,
        end_date: input.endDate,
        current_value: 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to create goal:', error.message)
      throw error
    }

    return this.mapFromDb(data)
  }

  async updateGoal(
    goalId: string,
    userId: string,
    input: UpdateGoalInput
  ): Promise<UserGoal> {
    const updateData: any = {}

    if (input.targetValue !== undefined) updateData.target_value = input.targetValue
    if (input.currentValue !== undefined) updateData.current_value = input.currentValue
    if (input.endDate !== undefined) updateData.end_date = input.endDate
    if (input.isActive !== undefined) updateData.is_active = input.isActive

    const { data, error } = await supabase
      .from('user_goals')
      .update(updateData)
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to update goal:', error.message)
      throw error
    }

    return this.mapFromDb(data)
  }

  async deleteGoal(goalId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId)

    if (error) {
      console.error('❌ Failed to delete goal:', error.message)
      throw error
    }
  }

  async incrementGoalProgress(goalId: string, userId: string, amount: number): Promise<UserGoal> {
    // Get current value first
    const { data: currentGoal, error: fetchError } = await supabase
      .from('user_goals')
      .select('current_value')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single()

    if (fetchError) {
      console.error('❌ Failed to fetch goal for increment:', fetchError.message)
      throw fetchError
    }

    const newValue = (currentGoal.current_value || 0) + amount

    return this.updateGoal(goalId, userId, { currentValue: newValue })
  }

  // Map database snake_case to camelCase
  private mapFromDb(data: any): UserGoal {
    return {
      id: data.id,
      userId: data.user_id,
      goalType: data.goal_type,
      targetValue: data.target_value,
      currentValue: data.current_value,
      startDate: data.start_date,
      endDate: data.end_date,
      isActive: data.is_active,
      createdAt: data.created_at,
    }
  }
}
