import { Card } from '@/components/shared/Card'
import { Button } from '@/components/shared/Button'
import type { UserPreferences } from '@/types'
import { Settings, Bell, BellOff, Download, Trash2, LogOut } from 'lucide-react'

interface AccountSettingsProps {
  preferences: UserPreferences
  onUpdateNotifications: (enabled: boolean) => void
  onSignOut: () => void
}

export function AccountSettings({
  preferences,
  onUpdateNotifications,
  onSignOut,
}: AccountSettingsProps) {
  const handleExportData = () => {
    // TODO: Implement data export
    alert('Data export feature coming soon!')
  }

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion with confirmation
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      alert('Account deletion feature coming soon!')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Settings className="text-green-500" size={20} />
        Account Settings
      </h3>

      <Card className="space-y-4">
        {/* Notifications Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            {preferences.notificationsEnabled ? (
              <Bell className="text-green-500" size={20} />
            ) : (
              <BellOff className="text-gray-500" size={20} />
            )}
            <div>
              <p className="text-sm font-medium text-white">Notifications</p>
              <p className="text-xs text-gray-500">Workout reminders and achievements</p>
            </div>
          </div>
          <button
            onClick={() => onUpdateNotifications(!preferences.notificationsEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.notificationsEnabled ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-600"></div>

        {/* Dark Mode (Always On) */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-white">Dark Mode</p>
            <p className="text-xs text-gray-500">Always enabled</p>
          </div>
          <div className="h-6 w-11 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-xs text-black font-semibold">✓</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-600"></div>

        {/* Data Export */}
        <button
          onClick={handleExportData}
          className="flex items-center gap-3 w-full py-2 text-gray-400 hover:text-white transition-colors"
        >
          <Download size={20} />
          <div className="text-left">
            <p className="text-sm font-medium">Export Data</p>
            <p className="text-xs text-gray-500">Download your workout history</p>
          </div>
        </button>

        {/* Divider */}
        <div className="border-t border-gray-600"></div>

        {/* Delete Account */}
        <button
          onClick={handleDeleteAccount}
          className="flex items-center gap-3 w-full py-2 text-gray-400 hover:text-red-400 transition-colors"
        >
          <Trash2 size={20} />
          <div className="text-left">
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-xs text-gray-500">Permanently delete your account and data</p>
          </div>
        </button>
      </Card>

      {/* Sign Out Button */}
      <Card className="bg-dark-700">
        <Button
          onClick={onSignOut}
          variant="ghost"
          className="w-full justify-center text-gray-400 hover:text-white flex items-center gap-2"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </Button>
      </Card>
    </div>
  )
}
