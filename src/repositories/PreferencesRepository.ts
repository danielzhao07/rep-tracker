import { supabase } from '@/lib/supabase'
import type { UserPreferences, UpdatePreferencesInput, FormStrictness } from '@/types'
import { DEFAULT_PREFERENCES } from '@/types'

export class PreferencesRepository {
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If no preferences exist yet, that's okay - we'll create them
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('❌ Failed to fetch preferences:', error.message)
      throw error
    }

    return this.mapFromDb(data)
  }

  async createPreferences(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        form_strictness: DEFAULT_PREFERENCES.formStrictness,
        rep_detection_sensitivity: DEFAULT_PREFERENCES.repDetectionSensitivity,
        default_rest_seconds: DEFAULT_PREFERENCES.defaultRestSeconds,
        camera_position: DEFAULT_PREFERENCES.cameraPosition,
        notifications_enabled: DEFAULT_PREFERENCES.notificationsEnabled,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to create preferences:', error.message)
      throw error
    }

    return this.mapFromDb(data)
  }

  async updatePreferences(
    userId: string,
    input: UpdatePreferencesInput
  ): Promise<UserPreferences> {
    const updateData: any = {}

    if (input.formStrictness !== undefined) {
      updateData.form_strictness = input.formStrictness
    }
    if (input.repDetectionSensitivity !== undefined) {
      updateData.rep_detection_sensitivity = input.repDetectionSensitivity
    }
    if (input.defaultRestSeconds !== undefined) {
      updateData.default_rest_seconds = input.defaultRestSeconds
    }
    if (input.cameraPosition !== undefined) {
      updateData.camera_position = input.cameraPosition
    }
    if (input.notificationsEnabled !== undefined) {
      updateData.notifications_enabled = input.notificationsEnabled
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('❌ Failed to update preferences:', error.message)
      throw error
    }

    return this.mapFromDb(data)
  }

  async getOrCreatePreferences(userId: string): Promise<UserPreferences> {
    const existing = await this.getUserPreferences(userId)
    if (existing) {
      return existing
    }
    return this.createPreferences(userId)
  }

  // Map database snake_case to camelCase
  private mapFromDb(data: any): UserPreferences {
    return {
      userId: data.user_id,
      formStrictness: data.form_strictness as FormStrictness,
      repDetectionSensitivity: data.rep_detection_sensitivity,
      defaultRestSeconds: data.default_rest_seconds,
      cameraPosition: data.camera_position,
      notificationsEnabled: data.notifications_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }
}
