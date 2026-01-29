import { Card } from '@/components/shared/Card'
import type { UserPreferences, FormStrictness } from '@/types'
import {
  FORM_STRICTNESS_LABELS,
  FORM_STRICTNESS_DESCRIPTIONS,
  REST_TIMER_PRESETS,
  CAMERA_POSITIONS,
} from '@/types'
import { Settings, Sliders } from 'lucide-react'

interface WorkoutPreferencesProps {
  preferences: UserPreferences
  onUpdate: (updates: Partial<UserPreferences>) => void
}

export function WorkoutPreferences({ preferences, onUpdate }: WorkoutPreferencesProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Sliders className="text-green-500" size={20} />
        Workout Preferences
      </h3>

      <Card className="space-y-5">
        {/* Form Strictness */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Form Strictness
          </label>
          <select
            value={preferences.formStrictness}
            onChange={(e) =>
              onUpdate({ formStrictness: e.target.value as FormStrictness })
            }
            className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {(Object.keys(FORM_STRICTNESS_LABELS) as FormStrictness[]).map((level) => (
              <option key={level} value={level}>
                {FORM_STRICTNESS_LABELS[level]}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {FORM_STRICTNESS_DESCRIPTIONS[preferences.formStrictness]}
          </p>
        </div>

        {/* Rep Detection Sensitivity */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Rep Detection Sensitivity
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={preferences.repDetectionSensitivity}
              onChange={(e) =>
                onUpdate({ repDetectionSensitivity: parseFloat(e.target.value) })
              }
              className="flex-1 h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <span className="text-sm font-semibold text-white w-12 text-right">
              {(preferences.repDetectionSensitivity * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher sensitivity detects smaller movements as reps
          </p>
        </div>

        {/* Default Rest Timer */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Default Rest Timer
          </label>
          <select
            value={preferences.defaultRestSeconds}
            onChange={(e) =>
              onUpdate({ defaultRestSeconds: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {REST_TIMER_PRESETS.map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds >= 60 ? `${seconds / 60} minute${seconds / 60 > 1 ? 's' : ''}` : `${seconds} seconds`}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Rest time between sets in routines
          </p>
        </div>

        {/* Camera Position */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Camera Position
          </label>
          <select
            value={preferences.cameraPosition}
            onChange={(e) => onUpdate({ cameraPosition: e.target.value })}
            className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {CAMERA_POSITIONS.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Preferred camera angle for exercises
          </p>
        </div>
      </Card>
    </div>
  )
}
