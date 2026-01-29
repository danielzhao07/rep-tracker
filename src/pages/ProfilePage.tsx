import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useProfileStore } from '@/store/profileStore'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { GoalsProgressCard } from '@/components/profile/GoalsProgressCard'
import { WorkoutPreferences } from '@/components/profile/WorkoutPreferences'
import { AccountSettings } from '@/components/profile/AccountSettings'
import { CreateGoalModal } from '@/components/profile/CreateGoalModal'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { CreateGoalInput, UpdatePreferencesInput } from '@/types'

export function ProfilePage() {
  const { user, signOut } = useAuthStore()
  const {
    activeGoals,
    isLoadingGoals,
    preferences,
    isLoadingPreferences,
    loadActiveGoals,
    createGoal,
    deleteGoal,
    loadPreferences,
    updatePreferences,
  } = useProfileStore()

  const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false)

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      loadActiveGoals(user.id)
      loadPreferences(user.id)
    }
  }, [user?.id, loadActiveGoals, loadPreferences])

  const handleCreateGoal = async (input: CreateGoalInput) => {
    if (!user?.id) return
    await createGoal(user.id, input)
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!user?.id) return
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(goalId, user.id)
    }
  }

  const handleUpdatePreferences = async (updates: UpdatePreferencesInput) => {
    if (!user?.id) return
    await updatePreferences(user.id, updates)
  }

  const handleUpdateNotifications = async (enabled: boolean) => {
    await handleUpdatePreferences({ notificationsEnabled: enabled })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Please sign in to view your profile</p>
      </div>
    )
  }

  const isLoading = isLoadingGoals || isLoadingPreferences

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="space-y-6">
        {/* Profile Header */}
        <ProfileHeader email={user.email || ''} />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <>
            {/* Goals & Milestones */}
            <GoalsProgressCard
              goals={activeGoals}
              onCreateGoal={() => setIsCreateGoalModalOpen(true)}
              onDeleteGoal={handleDeleteGoal}
            />

            {/* Workout Preferences */}
            {preferences && (
              <WorkoutPreferences
                preferences={preferences}
                onUpdate={handleUpdatePreferences}
              />
            )}

            {/* Account Settings */}
            {preferences && (
              <AccountSettings
                preferences={preferences}
                onUpdateNotifications={handleUpdateNotifications}
                onSignOut={signOut}
              />
            )}
          </>
        )}
      </div>

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateGoalModalOpen}
        onClose={() => setIsCreateGoalModalOpen(false)}
        onCreate={handleCreateGoal}
      />
    </div>
  )
}
