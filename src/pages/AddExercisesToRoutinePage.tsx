import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, X, ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import type { Exercise } from '@/types/exercise'

export function AddExercisesToRoutinePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = location.state?.returnTo || '/workout/create-routine'
  const currentExercises = location.state?.currentExercises || []
  const preservedExercises = location.state?.preservedExercises || []
  const routineName = location.state?.routineName || ''
  const routineNotes = location.state?.routineNotes || ''
  const editingRoutineId = location.state?.editingRoutineId || null

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name')

      if (error) throw error
      setExercises((data || []) as Exercise[])
    } catch (error) {
      console.error('Failed to load exercises:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => 
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [exercises, searchQuery])

  const toggleExercise = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      const isSelected = prev.some(e => e.id === exercise.id)
      if (isSelected) {
        return prev.filter(e => e.id !== exercise.id)
      } else {
        return [...prev, exercise]
      }
    })
  }

  const isExerciseSelected = (exerciseId: string) => {
    return selectedExercises.some(e => e.id === exerciseId)
  }

  const handleAddExercises = () => {
    navigate(returnTo, { 
      state: { 
        selectedExercises,
        preservedExercises,
        routineName,
        routineNotes,
        editingRoutineId
      } 
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-900 border-b border-dark-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(returnTo, {
              state: {
                preservedExercises,
                routineName,
                routineNotes,
                editingRoutineId
              }
            })}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold flex-1">Add Exercises</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="divide-y divide-dark-700">
        {filteredExercises.map((exercise) => {
          const selected = isExerciseSelected(exercise.id)
          const alreadyInRoutine = currentExercises.includes(exercise.id)

          return (
            <button
              key={exercise.id}
              onClick={() => !alreadyInRoutine && toggleExercise(exercise)}
              disabled={alreadyInRoutine}
              className={`w-full flex items-center gap-3 px-4 py-4 transition-colors ${
                alreadyInRoutine
                  ? 'opacity-50 cursor-not-allowed'
                  : selected
                  ? 'bg-cyan-500/10'
                  : 'hover:bg-dark-800'
              }`}
            >
              {/* Exercise Image */}
              <div className="w-12 h-12 rounded-lg bg-cyan-900/30 border border-cyan-700/40 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-lg font-bold">{exercise.name.charAt(0)}</span>
              </div>

              {/* Exercise Info */}
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-white font-medium truncate">{exercise.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{exercise.category}</p>
              </div>

              {/* Selection Indicator */}
              {selected && !alreadyInRoutine && (
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Check size={16} className="text-black" />
                </div>
              )}
              {alreadyInRoutine && (
                <span className="text-xs text-gray-500">Added</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Floating Add Button */}
      {selectedExercises.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-4">
          <Button
            onClick={handleAddExercises}
            className="w-full shadow-2xl shadow-cyan-500/20"
          >
            Add {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  )
}
