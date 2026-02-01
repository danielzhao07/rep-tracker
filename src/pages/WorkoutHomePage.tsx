import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, ClipboardList, Search, MoreVertical, ChevronDown, ChevronRight, Edit2, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { useRoutineStore } from '@/store/routineStore'

export function WorkoutHomePage() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const { user } = useAuthStore()
  const { routines, isLoading, fetchRoutines, deleteRoutine } = useRoutineStore()
  const [expandedRoutines, setExpandedRoutines] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [selectedRoutine, setSelectedRoutine] = useState<typeof routines[0] | null>(null)
  const [showRoutineDetail, setShowRoutineDetail] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, routineId: string, routineName: string}>({show: false, routineId: '', routineName: ''})

  useEffect(() => {
    if (user) {
      // Always fetch fresh routines on mount to ensure all routines (including duplicates) are loaded
      console.log('Fetching routines for user:', user.id)
      fetchRoutines(user.id).then(() => {
        console.log('All routines loaded:', routines.length)
      })
    }
  }, [user])

  // Refetch when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchRoutines(user.id)
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  // Auto-expand routines when coming back from creating one
  useEffect(() => {
    if (location.state?.fromCreateRoutine) {
      setExpandedRoutines(true)
    }
  }, [location.state])

  const handleStartEmptyWorkout = () => {
    // Navigate to workout tracking (future implementation)
    console.log('Start empty workout')
  }

  const handleNewRoutine = () => {
    navigate('/workout/create-routine')
  }

  const handleExploreRoutines = () => {
    // Navigate to routine templates (future implementation)
    console.log('Explore routines')
  }

  const handleStartRoutine = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId)
    if (routine) {
      navigate('/workout/active', { state: { routine } })
    }
  }
  const handleViewRoutine = (routine: typeof routines[0]) => {
    setSelectedRoutine(routine)
    setShowRoutineDetail(true)
    setMenuOpen(null)
  }

  const handleDuplicateRoutine = async (routine: typeof routines[0]) => {
    if (!user) return
    
    try {
      const { createRoutine } = useRoutineStore.getState()
      await createRoutine(user.id, {
        name: `${routine.name} (Copy)`,
        description: routine.description,
        exercises: routine.exercises.map((ex, idx) => ({
          exerciseId: ex.exerciseId,
          orderIndex: idx,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          restSeconds: ex.restSeconds
        }))
      })
      // Force refresh to ensure duplicate shows up with delete functionality
      await fetchRoutines(user.id)
      setExpandedRoutines(true)
    } catch (error) {
      console.error('Failed to duplicate routine:', error)
    }
    setMenuOpen(null)
  }

  const handleEditRoutine = (routine: typeof routines[0]) => {
    navigate('/workout/create-routine', {
      state: { editRoutine: routine }
    })
    setMenuOpen(null)
  }

  const handleDeleteRoutine = (routine: typeof routines[0]) => {
    setDeleteConfirmation({
      show: true,
      routineId: routine.id,
      routineName: routine.name
    })
    setMenuOpen(null)
  }

  const confirmDelete = async () => {
    if (!user) return
    
    try {
      console.log('Deleting routine:', deleteConfirmation.routineId)
      await deleteRoutine(deleteConfirmation.routineId)
      // Force refetch all routines after delete
      await fetchRoutines(user.id)
      console.log('Routines after delete:', routines)
    } catch (error) {
      console.error('Failed to delete routine:', error)
    }
    setDeleteConfirmation({show: false, routineId: '', routineName: ''})
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-3xl font-bold">Workout</h1>
      </div>

      {/* Start Empty Workout Button */}
      <div className="px-6 mb-6">
        <button
          onClick={handleStartEmptyWorkout}
          className="w-full bg-dark-800 hover:bg-dark-700 rounded-xl py-4 px-6 transition-all duration-200 transform hover:scale-[1.02] border border-dark-700"
        >
          <div className="flex items-center gap-3">
            <Plus size={24} className="text-white" />
            <span className="text-white text-lg font-medium">Start Empty Workout</span>
          </div>
        </button>
      </div>

      {/* Routines Section */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Routines</h2>
        </div>

        {/* New Routine and Explore Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleNewRoutine}
            className="bg-dark-800 hover:bg-dark-700 rounded-xl py-8 transition-all duration-200 transform hover:scale-[1.02] border border-dark-700 flex flex-col items-center justify-center gap-3"
          >
            <ClipboardList size={32} className="text-white" />
            <span className="text-white font-medium">New Routine</span>
          </button>

          <button
            onClick={handleExploreRoutines}
            className="bg-dark-800 hover:bg-dark-700 rounded-xl py-8 transition-all duration-200 transform hover:scale-[1.02] border border-dark-700 flex flex-col items-center justify-center gap-3"
          >
            <Search size={32} className="text-white" />
            <span className="text-white font-medium">Explore</span>
          </button>
        </div>
      </div>

      {/* My Routines List */}
      {routines.length > 0 && (
        <div className="px-6">
          <button
            onClick={() => setExpandedRoutines(!expandedRoutines)}
            className="w-full flex items-center gap-2 mb-4 text-gray-400 hover:text-white transition-colors"
          >
            {expandedRoutines ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <span className="text-sm font-medium">My Routines ({routines.length})</span>
          </button>

          {expandedRoutines && (
            <div className="space-y-3 overflow-visible">
              {/* Click outside to close menu */}
              {menuOpen && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setMenuOpen(null)}
                />
              )}
              {routines.length === 0 && (
                <p className="text-gray-500 text-center py-4">No routines found. Create one to get started!</p>
              )}
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className="bg-dark-800 rounded-xl p-4 border border-dark-700 hover:border-cyan-700/40 transition-all duration-200 overflow-visible relative"
                  style={{ zIndex: menuOpen === routine.id ? 50 : 1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <button 
                      onClick={() => handleViewRoutine(routine)}
                      className="flex-1 text-left"
                    >
                      <h3 className="text-white font-semibold text-lg mb-1">{routine.name}</h3>
                      <p className="text-gray-500 text-sm">
                        {routine.exercises.map(e => e.exerciseName).join(', ')}
                      </p>
                    </button>
                    
                    {/* Three-dot menu button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(menuOpen === routine.id ? null : routine.id)
                      }}
                      className="text-gray-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-dark-700 relative"
                    >
                      <MoreVertical size={20} />
                      
                      {/* Dropdown menu */}
                      {menuOpen === routine.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 bg-dark-900 border border-cyan-700/30 rounded-lg shadow-2xl py-1 min-w-[160px]"
                          style={{ zIndex: 9999 }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditRoutine(routine)
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-cyan-600/10 transition-colors flex items-center gap-3"
                          >
                            <Edit2 size={16} className="text-cyan-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicateRoutine(routine)
                            }}
                            className="w-full px-4 py-3 text-left text-white hover:bg-cyan-600/10 transition-colors flex items-center gap-3"
                          >
                            <Copy size={16} className="text-cyan-400" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRoutine(routine)
                            }}
                            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-600/10 transition-colors flex items-center gap-3"
                          >
                            <Trash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </button>
                  </div>

                  <Button
                    onClick={() => handleStartRoutine(routine.id)}
                    className="w-full"
                  >
                    Start Routine
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteConfirmation({show: false, routineId: '', routineName: ''})} />
          <div className="relative bg-dark-900 rounded-xl w-full max-w-md p-6 border border-dark-700">
            <h3 className="text-xl font-bold mb-2">Delete Routine</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete <span className="text-white font-semibold">{deleteConfirmation.routineName}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteConfirmation({show: false, routineId: '', routineName: ''})}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                variant="secondary"
                className="flex-1 !text-red-400"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Routine Detail Modal */}
      {showRoutineDetail && selectedRoutine && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowRoutineDetail(false)} />
          <div className="relative bg-dark-900 rounded-t-2xl w-full max-w-lg max-h-[80vh] overflow-hidden border-t border-dark-700 animate-slide-up">
            {/* Modal Header */}
            <div className="sticky top-0 bg-dark-900 border-b border-dark-700 px-6 py-4 z-10">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-bold text-white">{selectedRoutine.name}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowRoutineDetail(false)
                      handleEditRoutine(selectedRoutine)
                    }}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Edit Routine
                  </button>
                  <button
                    onClick={() => setShowRoutineDetail(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Last edited {new Date(selectedRoutine.updatedAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-180px)] px-6 py-4">
              <h3 className="text-gray-400 text-sm font-medium mb-4">Exercises</h3>
              
              <div className="space-y-6">
                {selectedRoutine.exercises.map((exercise) => {
                  const isBodyweight = ['push up', 'pushup', 'push-up', 'squat', 'squats', 'pull up', 'pullup', 'pull-up', 'dip', 'dips', 'plank', 'lunge', 'lunges', 'burpee', 'burpees']
                    .some(bw => exercise.exerciseName.toLowerCase().includes(bw))
                  
                  // Get sets data from setsData if available, otherwise create from targetSets
                  const sets = exercise.setsData && Array.isArray(exercise.setsData) && exercise.setsData.length > 0
                    ? exercise.setsData
                    : Array.from({ length: exercise.targetSets }, () => ({
                        reps: exercise.targetReps,
                        weight: exercise.targetWeight || (isBodyweight ? 'BW' : '')
                      }))
                  
                  return (
                    <div key={exercise.exerciseId} className="space-y-3">
                      {/* Exercise Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-900/30 border border-cyan-700/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-cyan-400 text-sm font-bold">
                            {exercise.exerciseName.charAt(0)}
                          </span>
                        </div>
                        <h4 className="text-cyan-400 font-medium">{exercise.exerciseName}</h4>
                      </div>

                      {/* Sets Table */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-[50px_1fr_1fr] gap-2 text-xs text-gray-500 px-1">
                          <span>SET</span>
                          <span className="text-center">LBS</span>
                          <span className="text-center">REPS</span>
                        </div>
                        
                        {sets.map((set, index) => (
                          <div key={index} className="grid grid-cols-[50px_1fr_1fr] gap-2 items-center">
                            <span className="text-white text-lg">{index + 1}</span>
                            <div className="bg-dark-800 rounded-lg py-2 px-3 text-center border border-dark-700">
                              <span className="text-white">
                                {set.weight || '-'}
                              </span>
                            </div>
                            <div className="bg-dark-800 rounded-lg py-2 px-3 text-center border border-dark-700">
                              <span className="text-white">
                                {set.reps ?? '-'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-dark-900 border-t border-dark-700 px-6 py-4">
              <Button
                onClick={() => {
                  setShowRoutineDetail(false)
                  handleStartRoutine(selectedRoutine.id)
                }}
                className="w-full"
              >
                Start Routine
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
