import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronDown, MoreVertical, Plus, Minus, Check, Clock, Video, Search, X, Volume2, VolumeX, Trash2 } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useWorkoutSessionStore, type WorkoutExercise } from '@/store/workoutSessionStore'
import { useWorkoutStore } from '@/store/workoutStore'
import { useAuthStore } from '@/store/authStore'
import { useExerciseStore } from '@/store/exerciseStore'
import { WorkoutSessionRepository } from '@/repositories/WorkoutSessionRepository'
import type { RoutineWithExercises } from '@/types/routine'
import type { Exercise } from '@/types/exercise'

// Rest timer options (0s to 5 minutes, 5 second intervals)
const REST_TIMER_OPTIONS: number[] = [0]
for (let i = 5; i <= 300; i += 5) {
  REST_TIMER_OPTIONS.push(i)
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) {
    return `${mins}min ${secs}s`
  }
  return `${secs}s`
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`
  }
  return `${secs}s`
}

// Detectable exercises (squat, bicep curl, push up variations)
const DETECTABLE_DETECTOR_TYPES = ['squat', 'bicep-curl', 'alternating-bicep-curl', 'pushup']

function isDetectableExercise(detectorType: string): boolean {
  return DETECTABLE_DETECTOR_TYPES.includes(detectorType)
}

// Rest Timer Picker Modal
function RestTimerPicker({ 
  exercise, 
  onClose, 
  onSelect 
}: { 
  exercise: WorkoutExercise
  onClose: () => void
  onSelect: (seconds: number) => void
}) {
  const [selectedValue, setSelectedValue] = useState(exercise.restTimerSeconds)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toggleRestTimerSound } = useWorkoutSessionStore()
  
  useEffect(() => {
    // Scroll to selected value
    if (scrollRef.current) {
      const index = REST_TIMER_OPTIONS.indexOf(selectedValue)
      if (index >= 0) {
        const itemHeight = 44
        scrollRef.current.scrollTop = index * itemHeight - 88 // Center the selected item
      }
    }
  }, [])
  
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop
      const itemHeight = 44
      const centerOffset = 88
      const index = Math.round((scrollTop + centerOffset) / itemHeight)
      const clampedIndex = Math.max(0, Math.min(index, REST_TIMER_OPTIONS.length - 1))
      setSelectedValue(REST_TIMER_OPTIONS[clampedIndex])
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-dark-900 rounded-t-2xl w-full max-w-lg pb-8 animate-slide-up">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-dark-600 rounded-full" />
        </div>
        
        <div className="flex items-center justify-between px-6 py-2">
          <div className="text-center flex-1">
            <h3 className="text-white font-semibold">Rest Timer</h3>
            <p className="text-gray-500 text-sm">{exercise.exerciseName}</p>
          </div>
          <button
            onClick={() => toggleRestTimerSound(exercise.exerciseId)}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            {exercise.soundEnabled ? (
              <Volume2 size={20} className="text-cyan-400" />
            ) : (
              <VolumeX size={20} className="text-gray-600" />
            )}
          </button>
        </div>
        
        {/* Timer Picker */}
        <div className="relative h-[220px] overflow-hidden">
          {/* Highlight band */}
          <div className="absolute top-1/2 left-4 right-4 h-[44px] -translate-y-1/2 bg-dark-700 rounded-lg pointer-events-none border border-dark-600" />
          
          {/* Scrollable options */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto snap-y snap-mandatory hide-scrollbar"
            style={{ paddingTop: 88, paddingBottom: 88 }}
          >
            {REST_TIMER_OPTIONS.map((value) => (
              <div
                key={value}
                className={`h-[44px] flex items-center justify-center snap-center transition-all ${
                  value === selectedValue ? 'text-white text-lg font-medium' : 'text-gray-500 text-base'
                }`}
              >
                {value === 0 ? 'OFF' : formatTime(value)}
              </div>
            ))}
          </div>
        </div>
        
        <div className="px-6 mt-4">
          <Button
            onClick={() => {
              onSelect(selectedValue)
              onClose()
            }}
            className="w-full"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}

// Active Rest Timer Display
function ActiveRestTimerDisplay({ 
  remainingSeconds, 
  onCancel 
}: { 
  remainingSeconds: number
  onCancel: () => void 
}) {
  return (
    <div className="fixed bottom-24 left-4 right-4 bg-cyan-900/90 backdrop-blur-sm rounded-xl p-4 border border-cyan-700/50 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock size={24} className="text-cyan-400" />
          <div>
            <p className="text-white font-medium">Rest Timer</p>
            <p className="text-cyan-400 text-2xl font-bold">{formatTime(remainingSeconds)}</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-white transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  )
}

// Add Exercise Modal - allows user to add more exercises during workout
function AddExerciseModal({
  onClose,
  onAddExercise
}: {
  onClose: () => void
  onAddExercise: (exercise: Exercise) => void
}) {
  const { exercises: allExercises, fetchExercises } = useExerciseStore()
  const [searchQuery, setSearchQuery] = useState('')
  
  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])
  
  const filteredExercises = allExercises.filter((ex: Exercise) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-dark-900 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col border border-dark-700">
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Add Exercise</h3>
            <button onClick={onClose} className="p-1 hover:bg-dark-700 rounded-lg transition-colors">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-800 border border-dark-600 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-700"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredExercises.map((ex: Exercise) => (
            <button
              key={ex.id}
              onClick={() => {
                onAddExercise(ex)
                onClose()
              }}
              className="w-full flex items-center gap-3 p-3 bg-dark-800 hover:bg-dark-700 rounded-lg transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-900/30 border border-cyan-700/40 flex items-center justify-center flex-shrink-0">
                <span className="text-cyan-400 text-sm font-bold">{ex.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-white font-medium">{ex.name}</p>
                <p className="text-gray-500 text-sm">{ex.category}</p>
              </div>
            </button>
          ))}
          {filteredExercises.length === 0 && (
            <p className="text-gray-500 text-center py-8">No exercises found</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Unfinished Sets Modal - shown when user tries to finish workout with incomplete sets
// When ALL sets are unfinished (no checkmarks), shows "Cancel Workout" option
function UnfinishedSetsModal({
  unfinishedCount,
  hasNoCompletedSets,
  onComplete,
  onDiscard,
  onCancelWorkout,
  onCancel,
}: {
  unfinishedCount: number
  hasNoCompletedSets: boolean
  onComplete: () => void
  onDiscard: () => void
  onCancelWorkout: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          You have {unfinishedCount} unfinished set{unfinishedCount > 1 ? 's' : ''}
        </h3>
        <p className="text-gray-500 mb-6">
          What would you like to do with the incomplete sets?
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onComplete}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-medium transition-colors"
          >
            Complete Unfinished Sets
          </button>
          {hasNoCompletedSets ? (
            <button
              onClick={onCancelWorkout}
              className="w-full py-3 bg-red-100 hover:bg-red-200 rounded-xl text-red-600 font-medium transition-colors"
            >
              Cancel Workout
            </button>
          ) : (
            <button
              onClick={onDiscard}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
            >
              Discard Unfinished Sets
            </button>
          )}
          <button
            onClick={onCancel}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Empty/Invalid Workout Modal - shown when there are no valid sets (need both weight and reps)
function InvalidWorkoutModal({
  message,
  onCancel,
}: {
  message: string
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <X size={24} className="text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Cannot Complete Workout
        </h3>
        <p className="text-gray-500 mb-6">
          {message}
        </p>
        
        <button
          onClick={onCancel}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-medium transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  )
}

// Exercise Card Component - REDESIGNED to match reference images
// Layout: SET | PREVIOUS | LBS (if weighted) | VIDEO (if detectable) | REPS | CHECKMARK all in ONE row
function ExerciseCard({ 
  exercise, 
  onOpenRestTimer,
  onVideoTrack,
  showInvalidFields
}: { 
  exercise: WorkoutExercise
  onOpenRestTimer: () => void
  onVideoTrack: (setIndex: number) => void
  showInvalidFields: boolean
}) {
  const { 
    toggleSetCompletion, 
    updateSetReps, 
    updateSetWeight, 
    addSet,
    updateExerciseNotes,
    startRestTimer
  } = useWorkoutSessionStore()
  
  const [editingSet, setEditingSet] = useState<{ index: number; field: 'reps' | 'weight' } | null>(null)
  
  // Determine if exercise uses weight
  const isBodyweight = ['push up', 'pushup', 'push-up', 'squat', 'squats', 'body weight', 'bodyweight', 'pull up', 'pullup', 'pull-up', 'dip', 'dips', 'plank', 'lunge', 'lunges', 'burpee', 'burpees']
    .some(bw => exercise.exerciseName.toLowerCase().includes(bw))
  
  const hasWeight = !isBodyweight
  const isDetectable = isDetectableExercise(exercise.detectorType)
  
  // Find which set is "current" (first incomplete set for this exercise)
  const currentSetIndex = exercise.sets.findIndex(s => !s.completed)
  
  // Handle set completion - auto-start rest timer when checkmark is pressed
  const handleToggleCompletion = (index: number) => {
    const set = exercise.sets[index]
    
    // If completing the set (not un-completing)
    if (!set.completed) {
      toggleSetCompletion(exercise.exerciseId, index)
      // Auto-start rest timer if configured
      if (exercise.restTimerSeconds > 0) {
        startRestTimer(exercise.exerciseId)
      }
    } else {
      // Just toggle off
      toggleSetCompletion(exercise.exerciseId, index)
    }
  }

  // Handle increment/decrement reps
  const handleIncrementReps = (index: number) => {
    const currentReps = exercise.sets[index].reps ?? 0
    updateSetReps(exercise.exerciseId, index, currentReps + 1)
  }

  const handleDecrementReps = (index: number) => {
    const currentReps = exercise.sets[index].reps ?? 0
    if (currentReps > 0) {
      updateSetReps(exercise.exerciseId, index, currentReps - 1)
    }
  }
  
  // Calculate column grid based on what columns are visible
  // Columns: SET(40px) | PREVIOUS(flex) | LBS(60px, optional) | VIDEO(40px, optional) | REPS(90px with buttons) | CHECK(36px)
  const getGridCols = () => {
    if (hasWeight && isDetectable) {
      return 'grid-cols-[40px_1fr_60px_40px_90px_36px]'
    } else if (hasWeight) {
      return 'grid-cols-[40px_1fr_60px_90px_36px]'
    } else if (isDetectable) {
      return 'grid-cols-[40px_1fr_40px_90px_36px]'
    } else {
      return 'grid-cols-[40px_1fr_90px_36px]'
    }
  }
  
  return (
    <div className="bg-dark-900/80 rounded-xl border border-dark-700/50 overflow-hidden">
      {/* Exercise Header */}
      <div className="p-4 border-b border-dark-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-900/30 border border-cyan-700/40 flex items-center justify-center flex-shrink-0">
              <span className="text-cyan-400 text-sm font-bold">
                {exercise.exerciseName.charAt(0)}
              </span>
            </div>
            <h3 className="text-cyan-400 font-medium">{exercise.exerciseName}</h3>
          </div>
          <button className="p-2 rounded-lg hover:bg-dark-700 transition-colors">
            <MoreVertical size={20} className="text-gray-400" />
          </button>
        </div>
        
        {/* Notes */}
        <input
          type="text"
          placeholder="Add notes here..."
          value={exercise.notes}
          onChange={(e) => updateExerciseNotes(exercise.exerciseId, e.target.value)}
          className="w-full mt-3 bg-transparent text-gray-400 text-sm placeholder-gray-600 focus:outline-none"
        />
        
        {/* Rest Timer Toggle */}
        <button
          onClick={onOpenRestTimer}
          className="mt-2 flex items-center gap-2 text-cyan-400 text-sm"
        >
          <Clock size={16} />
          <span>
            Rest Timer: {exercise.restTimerSeconds === 0 ? 'OFF' : formatTime(exercise.restTimerSeconds)}
            {exercise.restTimerSeconds > 0 && !exercise.soundEnabled && ' 🔇'}
          </span>
        </button>
      </div>
      
      {/* Sets Table */}
      <div className="p-3">
        {/* Header Row */}
        <div className={`grid ${getGridCols()} gap-2 mb-2 text-xs text-gray-500 font-medium uppercase tracking-wider px-2`}>
          <span>Set</span>
          <span className="text-center">Previous</span>
          {hasWeight && <span className="text-center">Lbs</span>}
          {isDetectable && <span className="text-center"></span>}
          <span className="text-center">Reps</span>
          <span></span>
        </div>
        
        {/* Set Rows - ALL columns in ONE row per set */}
        <div className="space-y-2">
          {exercise.sets.map((set, index) => {
            const isCurrentSet = index === currentSetIndex
            const isCompleted = set.completed
            const weightEmpty = !set.weight || set.weight.trim() === ''
            const repsEmpty = set.reps === null || set.reps === undefined || set.reps <= 0
            const showRedWeight = showInvalidFields && weightEmpty
            const showRedReps = showInvalidFields && repsEmpty
            
            // Determine row styling
            let rowBgClass = 'bg-dark-800/30'
            if (isCompleted) {
              rowBgClass = 'bg-green-900/20'
            } else if (isCurrentSet) {
              rowBgClass = 'bg-gray-700/40 border border-gray-600/50'
            }
            
            return (
              <div 
                key={index}
                className={`grid ${getGridCols()} gap-2 items-center rounded-lg px-2 py-2 transition-colors ${rowBgClass}`}
              >
                {/* Set Number */}
                <span className={`text-center font-semibold ${
                  isCompleted ? 'text-green-400' : isCurrentSet ? 'text-cyan-400' : 'text-gray-400'
                }`}>
                  {set.setNumber}
                </span>
                
                {/* Previous - shows last workout's data */}
                <div className="text-center text-gray-500 text-sm truncate">
                  {set.previousReps !== null && set.previousReps !== undefined ? (
                    hasWeight && set.previousWeight ? (
                      `${set.previousWeight} × ${set.previousReps}`
                    ) : (
                      `${set.previousReps} reps`
                    )
                  ) : (
                    '-'
                  )}
                </div>
                
                {/* Weight Input (if applicable) */}
                {hasWeight && (
                  <div 
                    className={`rounded-lg py-1.5 text-center border transition-colors cursor-pointer ${
                      showRedWeight
                        ? 'bg-red-900/30 border-red-500'
                        : isCompleted 
                          ? 'bg-green-900/30 border-green-700/40' 
                          : 'bg-dark-700/50 border-dark-600 hover:border-cyan-700/50'
                    }`}
                    onClick={() => setEditingSet({ index, field: 'weight' })}
                  >
                    {editingSet?.index === index && editingSet.field === 'weight' ? (
                      <input
                        type="text"
                        value={set.weight}
                        onChange={(e) => updateSetWeight(exercise.exerciseId, index, e.target.value)}
                        onBlur={() => setEditingSet(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingSet(null)}
                        autoFocus
                        className="w-full bg-transparent text-white text-center text-sm focus:outline-none"
                      />
                    ) : (
                      <span className={`text-sm ${showRedWeight ? 'text-red-400' : 'text-white'}`}>{set.weight || '-'}</span>
                    )}
                  </div>
                )}
                
                {/* Video Icon (if exercise is detectable) */}
                {isDetectable && (
                  <button
                    onClick={() => onVideoTrack(index)}
                    className={`flex items-center justify-center p-1.5 rounded-lg transition-colors ${
                      isCompleted ? 'opacity-50' : 'hover:bg-dark-600'
                    }`}
                    disabled={isCompleted}
                  >
                    <Video size={16} className="text-cyan-400" />
                  </button>
                )}
                
                {/* Reps Input with +/- buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDecrementReps(index)}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                      showRedReps
                        ? 'border border-red-500 text-red-400'
                        : 'border border-cyan-700/50 text-cyan-400 hover:bg-cyan-900/30'
                    }`}
                  >
                    <Minus size={12} />
                  </button>
                  <div 
                    className={`flex-1 rounded-lg py-1.5 text-center border transition-colors cursor-pointer ${
                      showRedReps
                        ? 'bg-red-900/30 border-red-500'
                        : isCompleted 
                          ? 'bg-green-900/30 border-green-700/40' 
                          : 'bg-dark-700/50 border-dark-600 hover:border-cyan-700/50'
                    }`}
                    onClick={() => setEditingSet({ index, field: 'reps' })}
                  >
                    {editingSet?.index === index && editingSet.field === 'reps' ? (
                      <input
                        type="number"
                        value={set.reps ?? ''}
                        onChange={(e) => updateSetReps(exercise.exerciseId, index, e.target.value ? parseInt(e.target.value) : null)}
                        onBlur={() => setEditingSet(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingSet(null)}
                        autoFocus
                        className="w-full bg-transparent text-white text-center text-sm focus:outline-none"
                      />
                    ) : (
                      <span className={`text-sm ${showRedReps ? 'text-red-400' : 'text-white'}`}>{set.reps ?? '-'}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleIncrementReps(index)}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                      showRedReps
                        ? 'border border-red-500 text-red-400'
                        : 'border border-cyan-700/50 text-cyan-400 hover:bg-cyan-900/30'
                    }`}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                
                {/* Checkmark Button */}
                <button
                  onClick={() => handleToggleCompletion(index)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all mx-auto ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-500 hover:border-cyan-500'
                  }`}
                >
                  {isCompleted && <Check size={14} />}
                </button>
              </div>
            )
          })}
        </div>
        
        {/* Add Set Button */}
        <button
          onClick={() => addSet(exercise.exerciseId)}
          className="w-full mt-3 py-2.5 bg-dark-700/50 hover:bg-dark-700 rounded-lg border border-dark-600/50 text-gray-300 font-medium flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <Plus size={16} />
          Add Set
        </button>
      </div>
    </div>
  )
}

export function ActiveWorkoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { setCurrentExercise, setCameraMode } = useWorkoutStore()
  
  const {
    isActive,
    exercises,
    elapsedSeconds,
    totalVolume,
    completedSets,
    totalSets,
    activeRestTimer,
    startWorkout,
    tick,
    stopRestTimer,
    tickRestTimer,
    toggleSetCompletion,
    reset,
  } = useWorkoutSessionStore()
  
  const [restTimerExercise, setRestTimerExercise] = useState<WorkoutExercise | null>(null)
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)
  const [showUnfinishedSetsModal, setShowUnfinishedSetsModal] = useState(false)
  const [showInvalidWorkoutModal, setShowInvalidWorkoutModal] = useState(false)
  const [invalidWorkoutMessage, setInvalidWorkoutMessage] = useState('')
  const [showInvalidFields, setShowInvalidFields] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Initialize workout from navigation state
  useEffect(() => {
    const routine = location.state?.routine as RoutineWithExercises | undefined
    
    if (routine && !isActive) {
      // Fetch previous workout data and start
      const initWorkout = async () => {
        let previousData: Map<string, { reps: number | null; weight: string }[]> | undefined
        
        if (user) {
          try {
            previousData = await WorkoutSessionRepository.getPreviousWorkoutData(user.id, routine.id)
          } catch (error) {
            console.error('Failed to fetch previous workout data:', error)
          }
        }
        
        startWorkout(routine, previousData)
      }
      
      initWorkout()
    } else if (!routine && !isActive) {
      // No routine provided and no active workout, go back
      navigate('/workout')
    }
  }, [location.state, isActive, user, startWorkout, navigate])
  
  // Timer tick
  useEffect(() => {
    if (!isActive) return
    
    const interval = setInterval(() => {
      tick()
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isActive, tick])
  
  // Rest timer tick
  useEffect(() => {
    if (!activeRestTimer?.isRunning) return
    
    const interval = setInterval(() => {
      tickRestTimer()
      // Check if timer finished (remaining is 0 or less)
      const current = useWorkoutSessionStore.getState().activeRestTimer
      if (!current || current.remainingSeconds <= 0) {
        // Play sound
        const exercise = exercises.find(ex => ex.exerciseId === activeRestTimer.exerciseId)
        if (exercise?.soundEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {})
        }
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [activeRestTimer?.isRunning, activeRestTimer?.exerciseId, exercises, tickRestTimer])

  // Count unfinished sets (sets that are not completed)
  const unfinishedSets = exercises.flatMap(ex => 
    ex.sets.filter(s => !s.completed).map((s) => ({ exercise: ex, set: s, index: ex.sets.indexOf(s) }))
  )

  // Helper to check if a set is valid (has both weight/BW AND reps)
  const isSetValid = (set: { weight: string; reps: number | null }) => {
    const hasWeight = set.weight.trim() !== '' && (set.weight.toUpperCase() === 'BW' || !isNaN(parseFloat(set.weight)))
    const hasReps = set.reps !== null && set.reps > 0
    return hasWeight && hasReps
  }

  // Check if ANY set (completed or not) has valid data - this makes the workout saveable
  const hasAnyValidSet = exercises.some(ex => 
    ex.sets.some(s => isSetValid(s))
  )
  
  const handleFinish = () => {
    // Reset invalid field highlighting
    setShowInvalidFields(false)
    
    // Check if there are no exercises
    if (exercises.length === 0) {
      setInvalidWorkoutMessage('Please add at least one exercise to your workout.')
      setShowInvalidWorkoutModal(true)
      return
    }
    
    // FIRST: Check if at least one set has BOTH weight and reps
    // This check happens BEFORE the unfinished sets modal
    if (!hasAnyValidSet) {
      setShowInvalidFields(true)
      setInvalidWorkoutMessage('Please fill in both weight (or BW) and reps for at least one set.')
      setShowInvalidWorkoutModal(true)
      return
    }
    
    // Check if there are unfinished sets (after we know workout is valid)
    if (unfinishedSets.length > 0) {
      setShowUnfinishedSetsModal(true)
      return
    }
    
    navigate('/workout/save')
  }

  // Complete unfinished sets that have valid data (weight/BW AND reps)
  const handleCompleteUnfinishedSets = () => {
    exercises.forEach(ex => {
      ex.sets.forEach((set, index) => {
        if (!set.completed && isSetValid(set)) {
          toggleSetCompletion(ex.exerciseId, index)
        }
      })
    })
    
    setShowUnfinishedSetsModal(false)
    navigate('/workout/save')
  }

  // Discard unfinished sets (just go to save without completing them)
  // Only valid sets that are already completed will be saved
  const handleDiscardUnfinishedSets = () => {
    setShowUnfinishedSetsModal(false)
    navigate('/workout/save')
  }

  // Cancel entire workout
  const handleCancelWorkout = () => {
    setShowUnfinishedSetsModal(false)
    reset()
    navigate('/workout')
  }
  
  // Skip the modal and go DIRECTLY to camera
  const handleDirectVideoTrack = (exercise: WorkoutExercise, setIndex: number) => {
    // Set the video tracking context in the session store
    useWorkoutSessionStore.getState().setVideoTrackingContext(exercise.exerciseId, setIndex)
    
    // Set up the workout store with the exercise for camera tracking
    // Using 'as any' to avoid type issues since the exercise from workout may not have all fields
    setCurrentExercise({
      id: exercise.exerciseId,
      name: exercise.exerciseName,
      detectorType: exercise.detectorType as 'squat' | 'bicep-curl' | 'pushup' | 'alternating-bicep-curl',
      category: exercise.exerciseCategory as 'upper-body' | 'lower-body' | 'core' | 'full-body',
      description: '',
      thumbnailUrl: null,
      createdAt: new Date().toISOString(),
    })
    setCameraMode(true)
    
    // Navigate directly to the camera workout page
    navigate('/workout/start', {
      state: {
        returnTo: '/workout/active',
        setIndex: setIndex,
        exerciseId: exercise.exerciseId,
      }
    })
  }
  
  // Handle adding an exercise to the current workout
  const handleAddExercise = (exercise: Exercise) => {
    useWorkoutSessionStore.getState().addExercise(exercise)
  }
  
  // Progress percentage
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  
  if (!isActive) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Audio element for rest timer */}
      <audio ref={audioRef} src="/sounds/timer-complete.mp3" preload="auto" />
      
      {/* Progress Bar */}
      <div className="h-1 bg-dark-800">
        <div 
          className="h-full bg-cyan-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black border-b border-dark-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-white"
          >
            <ChevronDown size={20} />
            <span className="font-medium">Log Workout</span>
          </button>
          
          <Button onClick={handleFinish} size="sm">
            Finish
          </Button>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-dark-600">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Duration</p>
            <p className="text-cyan-400 font-bold">{formatDuration(elapsedSeconds)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Volume</p>
            <p className="text-white font-bold">{Math.round(totalVolume)} lbs</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Sets</p>
            <p className="text-white font-bold">{completedSets}</p>
          </div>
        </div>
      </div>
      
      {/* Exercises */}
      <div className="p-4 space-y-4">
        {exercises.length === 0 ? (
          // Empty workout state
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-dark-800 flex items-center justify-center mb-4">
              <Plus size={32} className="text-cyan-400" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Get started!</h3>
            <p className="text-gray-400 mb-6">
              Add an exercise to begin your workout
            </p>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setShowAddExerciseModal(true)}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-medium flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Add Exercise
              </button>
              <button
                onClick={() => {
                  useWorkoutSessionStore.getState().reset()
                  navigate('/workout')
                }}
                className="px-6 py-3 text-gray-400 hover:text-white font-medium flex items-center gap-2 transition-colors"
              >
                <Trash2 size={18} />
                Discard Workout
              </button>
            </div>
          </div>
        ) : (
          <>
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.exerciseId}
                exercise={exercise}
                onOpenRestTimer={() => setRestTimerExercise(exercise)}
                onVideoTrack={(setIndex) => handleDirectVideoTrack(exercise, setIndex)}
                showInvalidFields={showInvalidFields}
              />
            ))}
            
            {/* Add Exercise Button */}
            <button
              onClick={() => setShowAddExerciseModal(true)}
              className="w-full py-4 bg-dark-800/50 hover:bg-dark-800 rounded-xl border border-dashed border-dark-600 text-cyan-400 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add Exercise
            </button>
          </>
        )}
      </div>
      
      {/* Rest Timer Picker Modal */}
      {restTimerExercise && (
        <RestTimerPicker
          exercise={restTimerExercise}
          onClose={() => setRestTimerExercise(null)}
          onSelect={(seconds) => {
            useWorkoutSessionStore.getState().updateRestTimer(restTimerExercise.exerciseId, seconds)
          }}
        />
      )}
      
      {/* Active Rest Timer Display */}
      {activeRestTimer && activeRestTimer.isRunning && (
        <ActiveRestTimerDisplay
          remainingSeconds={activeRestTimer.remainingSeconds}
          onCancel={stopRestTimer}
        />
      )}
      
      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <AddExerciseModal
          onClose={() => setShowAddExerciseModal(false)}
          onAddExercise={handleAddExercise}
        />
      )}

      {/* Unfinished Sets Modal */}
      {showUnfinishedSetsModal && (
        <UnfinishedSetsModal
          unfinishedCount={unfinishedSets.length}
          hasNoCompletedSets={completedSets === 0}
          onComplete={handleCompleteUnfinishedSets}
          onDiscard={handleDiscardUnfinishedSets}
          onCancelWorkout={handleCancelWorkout}
          onCancel={() => setShowUnfinishedSetsModal(false)}
        />
      )}

      {/* Invalid Workout Modal */}
      {showInvalidWorkoutModal && (
        <InvalidWorkoutModal
          message={invalidWorkoutMessage}
          onCancel={() => {
            setShowInvalidWorkoutModal(false)
          }}
        />
      )}
    </div>
  )
}
