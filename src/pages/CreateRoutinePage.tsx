import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Minus, X, Timer, MoreVertical } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useAuthStore } from '@/store/authStore'
import { useRoutineStore } from '@/store/routineStore'
import { ROUTES } from '@/utils/constants'
import type { Exercise } from '@/types/exercise'

interface SetData {
  reps: number | null
  weight: string
}

interface RoutineExerciseData {
  exercise: Exercise
  setsData: SetData[]
  restSeconds: number
  notes: string
}

export function CreateRoutinePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { createRoutine, updateRoutine, isLoading } = useRoutineStore()
  
  const [routineName, setRoutineName] = useState('')
  const [routineNotes, setRoutineNotes] = useState('')
  const [exercises, setExercises] = useState<RoutineExerciseData[]>([])
  const [showSaveError, setShowSaveError] = useState(false)
  const [showNoExercisesError, setShowNoExercisesError] = useState(false)
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false)
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
  const [exerciseMenuOpen, setExerciseMenuOpen] = useState<string | null>(null)

  // Initialize state based on location state (only runs once on mount)
  useEffect(() => {
    const state = location.state
    
    // Case 1: Coming back from add exercises page without selecting anything
    if (state?.preservedExercises && !state?.selectedExercises && !state?.editRoutine) {
      console.log('Restoring preserved state')
      setExercises(state.preservedExercises)
      if (state.routineName) setRoutineName(state.routineName)
      if (state.routineNotes) setRoutineNotes(state.routineNotes)
      if (state.editingRoutineId) setEditingRoutineId(state.editingRoutineId)
    }
    // Case 2: Coming back from add exercises with new selections
    else if (state?.selectedExercises) {
      console.log('Adding selected exercises')
      const selectedExercises = state.selectedExercises as Exercise[]
      const preservedExercises = state.preservedExercises as RoutineExerciseData[] || []
      
      if (state.routineName) setRoutineName(state.routineName)
      if (state.routineNotes) setRoutineNotes(state.routineNotes)
      if (state.editingRoutineId) setEditingRoutineId(state.editingRoutineId)
      
      const existingIds = new Set(preservedExercises.map(e => e.exercise.id))
      const newExercises: RoutineExerciseData[] = selectedExercises
        .filter(ex => !existingIds.has(ex.id))
        .map((ex: Exercise) => ({
          exercise: ex,
          setsData: [{ reps: null, weight: '' }, { reps: null, weight: '' }, { reps: null, weight: '' }],
          restSeconds: 90,
          notes: ''
        }))
      
      setExercises([...preservedExercises, ...newExercises])
    }
    // Case 3: Editing an existing routine
    else if (state?.editRoutine) {
      console.log('Loading routine for editing:', state.editRoutine.id)
      const routine = state.editRoutine
      setEditingRoutineId(routine.id)
      setRoutineName(routine.name)
      setRoutineNotes(routine.description || '')
      
      const exerciseData: RoutineExerciseData[] = routine.exercises.map((ex: any) => {
        // Use saved setsData if available, otherwise fall back to creating from targetSets
        let setsData: { reps: number | null; weight: string }[]
        
        if (ex.setsData && Array.isArray(ex.setsData) && ex.setsData.length > 0) {
          // Use the saved individual set data
          setsData = ex.setsData.map((set: any) => ({
            reps: set.reps,
            weight: set.weight || ''
          }))
        } else {
          // Fall back to creating sets from targetSets (for old data)
          setsData = Array.from({ length: ex.targetSets }, () => ({ 
            reps: ex.targetReps, 
            weight: ex.targetWeight || '' 
          }))
        }
        
        return {
          exercise: {
            id: ex.exerciseId,
            name: ex.exerciseName,
            category: ex.targetCategory || 'strength',
            description: '',
            thumbnailUrl: '',
            detectorType: ex.exerciseDetectorType || 'squat',
            createdAt: new Date().toISOString()
          } as Exercise,
          setsData,
          restSeconds: ex.restSeconds,
          notes: ''
        }
      })
      setExercises(exerciseData)
    }
    
    // Clear the state to prevent re-running
    window.history.replaceState({}, document.title)
  }, []) // Empty deps - only run once on mount

  const handleAddExercise = () => {
    navigate('/workout/create-routine/add-exercises', {
      state: { 
        returnTo: '/workout/create-routine',
        currentExercises: exercises.map(e => e.exercise.id),
        preservedExercises: exercises,
        routineName: routineName,
        routineNotes: routineNotes,
        editingRoutineId: editingRoutineId
      }
    })
  }

  const handleRemoveExercise = (index: number) => {
    setExercises(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateExercise = (index: number, field: keyof RoutineExerciseData, value: any) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ))
  }

  const handleAddSet = (index: number) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index ? { ...ex, setsData: [...ex.setsData, { reps: null, weight: '' }] } : ex
    ))
  }

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(prev => prev.map((ex, i) => 
      i === exerciseIndex && ex.setsData.length > 1
        ? { ...ex, setsData: ex.setsData.filter((_, si) => si !== setIndex) } 
        : ex
    ))
  }

  const handleUpdateSetReps = (exerciseIndex: number, setIndex: number, reps: number | null) => {
    setExercises(prev => prev.map((ex, i) => 
      i === exerciseIndex 
        ? { 
            ...ex, 
            setsData: ex.setsData.map((set, si) => 
              si === setIndex ? { ...set, reps } : set
            ) 
          } 
        : ex
    ))
  }

  const handleIncrementReps = (exerciseIndex: number, setIndex: number) => {
    const currentReps = exercises[exerciseIndex].setsData[setIndex].reps || 0
    handleUpdateSetReps(exerciseIndex, setIndex, currentReps + 1)
  }

  const handleDecrementReps = (exerciseIndex: number, setIndex: number) => {
    const currentReps = exercises[exerciseIndex].setsData[setIndex].reps || 0
    if (currentReps > 0) {
      handleUpdateSetReps(exerciseIndex, setIndex, currentReps - 1)
    }
  }

  const handleCancel = () => {
    if (exercises.length > 0) {
      setShowCancelConfirmation(true)
    } else {
      navigate(ROUTES.WORKOUT)
    }
  }

  // Helper function to check if exercise is bodyweight
  const isBodyweightExercise = (name: string) => {
    const bodyweightExercises = ['push up', 'pushup', 'push-up', 'squat', 'squats', 'pull up', 'pullup', 'pull-up', 'dip', 'dips', 'plank', 'lunge', 'lunges', 'burpee', 'burpees']
    return bodyweightExercises.some(bw => name.toLowerCase().includes(bw))
  }

  const handleSave = async () => {
    // Validate routine name
    if (!routineName.trim()) {
      setShowSaveError(true)
      return
    }

    if (!user) return

    // Prepare exercises data - save ALL sets with their individual reps and weight
    const exercisesData = exercises.map((ex, index) => {
      // Process each set - for bodyweight exercises with no weight, use 'BW'
      const setsData = ex.setsData.map(set => ({
        reps: set.reps,
        weight: set.weight || (isBodyweightExercise(ex.exercise.name) ? 'BW' : '')
      }))
      
      return {
        exerciseId: ex.exercise.id,
        orderIndex: index,
        targetSets: ex.setsData.length,
        targetReps: setsData[0]?.reps ?? undefined,
        targetWeight: setsData[0]?.weight || undefined,
        setsData: setsData,
        restSeconds: ex.restSeconds
      }
    })

    console.log('Saving routine:', {
      editingRoutineId,
      name: routineName,
      exercises: exercisesData
    })

    try {
      if (editingRoutineId) {
        // Update existing routine
        await updateRoutine(editingRoutineId, {
          name: routineName,
          description: routineNotes,
          exercises: exercisesData
        })
        console.log('Routine updated successfully')
      } else {
        // Create new routine
        await createRoutine(user.id, {
          name: routineName,
          description: routineNotes,
          exercises: exercisesData
        })
        console.log('Routine created successfully')
      }

      navigate(ROUTES.WORKOUT, { state: { fromCreateRoutine: true } })
    } catch (error) {
      console.error('Failed to save routine:', error)
    }
  }

  const canSave = routineName.trim().length > 0

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-900 border-b border-dark-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleCancel}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Cancel
          </button>
          <h1 className="text-lg font-semibold">{editingRoutineId ? 'Edit Routine' : 'Create Routine'}</h1>
          <button
            onClick={() => {
              if (!canSave) {
                setShowSaveError(true)
              } else if (exercises.length === 0) {
                setShowNoExercisesError(true)
              } else {
                handleSave()
              }
            }}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium text-sm min-w-[70px] transition-all duration-200 ${
              canSave && exercises.length > 0
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                : 'bg-dark-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Routine Name Input */}
      <div className="px-4 py-4 border-b border-dark-700">
        <input
          type="text"
          placeholder="Routine title"
          value={routineName}
          onChange={(e) => {
            setRoutineName(e.target.value)
            setShowSaveError(false)
          }}
          className="w-full bg-transparent text-xl text-gray-400 placeholder-gray-600 focus:outline-none"
        />
      </div>

      {/* Exercises List */}
      {exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-24 h-24 rounded-full border-2 border-dark-700 flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 text-center mb-8">
            Get started by adding an exercise to your routine.
          </p>
          <Button onClick={handleAddExercise} className="w-full max-w-md">
            <Plus size={20} />
            Add exercise
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-dark-700">
          {exercises.map((exerciseData, index) => (
            <div key={exerciseData.exercise.id} className="bg-dark-900 px-4 py-4">{/* Exercise Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-cyan-900/30 border border-cyan-700/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-cyan-400 text-lg font-bold">{exerciseData.exercise.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-cyan-400 font-medium text-base">{exerciseData.exercise.name}</h3>
                  <input
                    type="text"
                    placeholder="Add routine notes here"
                    value={exerciseData.notes}
                    onChange={(e) => handleUpdateExercise(index, 'notes', e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-500 placeholder-gray-600 focus:outline-none mt-1"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setExerciseMenuOpen(exerciseMenuOpen === exerciseData.exercise.id ? null : exerciseData.exercise.id)}
                    className="text-gray-500 hover:text-gray-300 transition-colors p-1"
                  >
                    <MoreVertical size={20} />
                  </button>
                  
                  {exerciseMenuOpen === exerciseData.exercise.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setExerciseMenuOpen(null)}
                      />
                      <div className="absolute right-0 top-8 z-20 bg-dark-900 border border-dark-700 rounded-lg shadow-xl py-2 min-w-[140px]">
                        <button
                          onClick={() => {
                            handleRemoveExercise(index)
                            setExerciseMenuOpen(null)
                          }}
                          className="w-full px-4 py-2 text-left text-red-400 hover:bg-dark-800 transition-colors flex items-center gap-3"
                        >
                          <X size={16} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Rest Timer */}
              <div className="flex items-center gap-2 mb-3">
                <Timer size={18} className="text-cyan-400" />
                <span className="text-cyan-400 text-sm">Rest Timer: OFF</span>
              </div>

              {/* Sets Configuration */}
              <div className="space-y-2">
                <div className="grid grid-cols-[40px_1fr_1fr] gap-2 text-sm text-gray-400 mb-2 px-1">
                  <span>SET</span>
                  <span className="text-center">LBS</span>
                  <span className="text-center">REPS</span>
                </div>

                {exerciseData.setsData.map((setData, setIndex) => (
                  <div key={setIndex} className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center group">
                    <span className="text-white text-lg font-medium">{setIndex + 1}</span>
                    <input
                      type="text"
                      placeholder={isBodyweightExercise(exerciseData.exercise.name) ? 'BW' : '-'}
                      value={setData.weight}
                      onChange={(e) => {
                        setExercises(prev => prev.map((ex, i) => 
                          i === index 
                            ? { 
                                ...ex, 
                                setsData: ex.setsData.map((s, si) => 
                                  si === setIndex ? { ...s, weight: e.target.value } : s
                                ) 
                              } 
                            : ex
                        ))
                      }}
                      className="w-full bg-dark-800 text-white text-lg text-center rounded-lg py-2 border border-dark-700 focus:border-cyan-600 focus:outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDecrementReps(index, setIndex)}
                        className="w-8 h-8 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-700/50 hover:border-cyan-500 text-cyan-400 flex items-center justify-center transition-all duration-200 flex-shrink-0"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={setData.reps ?? ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '')
                          handleUpdateSetReps(index, setIndex, val ? parseInt(val) : null)
                        }}
                        placeholder="-"
                        className="w-full min-w-0 bg-dark-800 text-white text-lg text-center rounded-lg py-2 border border-dark-700 focus:border-cyan-600 focus:outline-none"
                      />
                      <button
                        onClick={() => handleIncrementReps(index, setIndex)}
                        className="w-8 h-8 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-700/50 hover:border-cyan-500 text-cyan-400 flex items-center justify-center transition-all duration-200 flex-shrink-0"
                      >
                        <Plus size={14} />
                      </button>
                      {exerciseData.setsData.length > 1 && (
                        <button
                          onClick={() => handleRemoveSet(index, setIndex)}
                          className="w-8 h-8 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 flex items-center justify-center"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}  
              </div>

              {/* Add Set Button */}
              <button
                onClick={() => handleAddSet(index)}
                className="w-full mt-3 py-3 bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 hover:from-cyan-600/30 hover:to-cyan-500/30 text-cyan-400 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-cyan-700/40 hover:border-cyan-600/60 transform hover:scale-[1.02]"
              >
                <Plus size={18} />
                <span className="font-medium">Add Set</span>
              </button>
            </div>
          ))}

          {/* Add Exercise Button */}
          <div className="px-4 py-4">
            <Button onClick={handleAddExercise} variant="primary" className="w-full">
              <Plus size={20} />
              Add exercise
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCancelConfirmation(false)} />
          <div className="relative bg-dark-900 rounded-xl w-full max-w-md p-6 border border-dark-700">
            <h3 className="text-xl font-bold mb-2">Discard Changes?</h3>
            <p className="text-gray-400 mb-6">
              You have exercises added to this routine. Are you sure you want to cancel?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelConfirmation(false)}
                variant="secondary"
                className="flex-1"
              >
                Keep Editing
              </Button>
              <Button
                onClick={() => navigate(ROUTES.WORKOUT)}
                variant="secondary"
                className="flex-1 !text-red-400"
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Error Modal - No Name */}
      {showSaveError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSaveError(false)} />
          <div className="relative bg-dark-900 rounded-xl w-full max-w-md p-6 border border-dark-700 text-center">
            <h3 className="text-xl font-bold mb-2 text-red-400">Routine Name Required</h3>
            <p className="text-gray-400 mb-6">
              Please enter a name for your routine before saving.
            </p>
            <Button
              onClick={() => setShowSaveError(false)}
              className="w-full"
            >
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* Save Error Modal - No Exercises */}
      {showNoExercisesError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNoExercisesError(false)} />
          <div className="relative bg-dark-900 rounded-xl w-full max-w-md p-6 border border-dark-700 text-center">
            <h3 className="text-xl font-bold mb-2 text-red-400">No Exercises Added</h3>
            <p className="text-gray-400 mb-6">
              Please add at least one exercise to your routine before saving.
            </p>
            <Button
              onClick={() => setShowNoExercisesError(false)}
              className="w-full"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
