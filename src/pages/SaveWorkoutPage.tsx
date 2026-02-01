import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Image, AlertTriangle, Edit2, X, Video, Trash2 } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { useWorkoutSessionStore } from '@/store/workoutSessionStore'
import { useAuthStore } from '@/store/authStore'
import { useRoutineStore } from '@/store/routineStore'
import { WorkoutSessionRepository } from '@/repositories/WorkoutSessionRepository'

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${mins}min`
  }
  return `${mins}min`
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ', ' + date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// Discard Confirmation Modal
function DiscardConfirmationModal({
  onDiscard,
  onCancel,
}: {
  onDiscard: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-dark-900 rounded-xl w-full max-w-md p-6 border border-dark-700">
        <p className="text-white text-center text-lg mb-6">
          Are you sure you want to discard this workout?
        </p>
        <div className="space-y-3">
          <button
            onClick={onDiscard}
            className="w-full py-3 bg-dark-800 hover:bg-dark-700 rounded-xl text-red-400 font-medium transition-colors border border-dark-600"
          >
            Discard Workout
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-dark-800 hover:bg-dark-700 rounded-xl text-white font-medium transition-colors border border-dark-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Update Routine Modal
function UpdateRoutineModal({
  routineName,
  changesDescription,
  onUpdate,
  onKeepOriginal,
}: {
  routineName: string
  changesDescription: string
  onUpdate: () => void
  onKeepOriginal: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-dark-900 rounded-t-2xl w-full max-w-lg pb-8 animate-slide-up">
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-10 h-1 bg-dark-600 rounded-full" />
        </div>
        
        <div className="px-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-dark-800 rounded-lg flex items-center justify-center">
            <AlertTriangle size={24} className="text-gray-400" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Update "{routineName}"</h3>
          <p className="text-gray-400 mb-6">{changesDescription}</p>
          
          <div className="space-y-3">
            <Button onClick={onUpdate} className="w-full">
              Update Routine
            </Button>
            <button
              onClick={onKeepOriginal}
              className="w-full py-3 text-white font-medium"
            >
              Keep Original Routine
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Delete Video Confirmation Modal
function DeleteVideoModal({
  onDelete,
  onCancel,
}: {
  onDelete: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Delete this video?
        </h3>
        <p className="text-gray-500 mb-6">
          Are you sure you want to delete this video? This action cannot be undone.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onDelete}
            className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white font-medium transition-colors"
          >
            Delete Video
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export function SaveWorkoutPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { updateRoutine } = useRoutineStore()
  
  const {
    routine,
    routineName,
    exercises,
    elapsedSeconds,
    totalVolume,
    completedSets,
    totalSets,
    startTime,
    savedVideos,
    getChanges,
    hasChanges,
    reset,
    updateWorkoutName,
    removeSavedVideo,
  } = useWorkoutSessionStore()
  
  const [description, setDescription] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [showUpdateRoutineModal, setShowUpdateRoutineModal] = useState(false)
  const [showDeleteVideoModal, setShowDeleteVideoModal] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(routineName || 'Workout')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const workoutDate = startTime ? new Date(startTime) : new Date()
  
  const handleSave = async () => {
    if (!user) return
    
    // Check if there are changes to the routine
    if (hasChanges() && routine) {
      setShowUpdateRoutineModal(true)
      return
    }
    
    await saveWorkout(false)
  }
  
  const saveWorkout = async (updateRoutineFirst: boolean) => {
    if (!user) return
    
    setIsSaving(true)
    
    try {
      // Update routine if requested
      if (updateRoutineFirst && routine) {
        await updateRoutine(routine.id, {
          name: routine.name,
          description: routine.description,
          exercises: exercises.map((ex, idx) => ({
            exerciseId: ex.exerciseId,
            orderIndex: idx,
            targetSets: ex.sets.length,
            targetReps: ex.sets[0]?.reps ?? undefined,
            targetWeight: ex.sets[0]?.weight || undefined,
            setsData: ex.sets.map(s => ({
              reps: s.reps,
              weight: s.weight,
            })),
            restSeconds: ex.restTimerSeconds,
          })),
        })
      }
      
      // Save workout session
      await WorkoutSessionRepository.saveWorkoutSession({
        userId: user.id,
        routineId: routine?.id || null,
        routineName: routineName || 'Quick Workout',
        durationSeconds: elapsedSeconds,
        totalVolume,
        completedSets,
        totalSets,
        exercises,
        description: description || undefined,
        photoUrl: photoUrl || undefined,
      })
      
      // Reset and navigate
      reset()
      navigate('/history')
    } catch (error) {
      console.error('Failed to save workout:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDiscard = () => {
    reset()
    navigate('/workout')
  }
  
  const handlePhotoUpload = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For now, just create a local URL. In production, upload to storage.
      const url = URL.createObjectURL(file)
      setPhotoUrl(url)
    }
  }
  
  const handleRemovePhoto = () => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl)
    }
    setPhotoUrl(null)
  }

  const handleDeleteVideoClick = (videoId: string) => {
    setVideoToDelete(videoId)
    setShowDeleteVideoModal(true)
  }

  const handleConfirmDeleteVideo = () => {
    if (videoToDelete) {
      removeSavedVideo(videoToDelete)
    }
    setVideoToDelete(null)
    setShowDeleteVideoModal(false)
  }
  
  const getChangesDescription = () => {
    const changes = getChanges()
    const parts: string[] = []
    
    if (changes.addedExercises.length > 0) {
      parts.push(`added ${changes.addedExercises.length} exercise${changes.addedExercises.length > 1 ? 's' : ''}`)
    }
    if (changes.removedExercises.length > 0) {
      parts.push(`removed ${changes.removedExercises.length} exercise${changes.removedExercises.length > 1 ? 's' : ''}`)
    }
    if (changes.addedSets > 0) {
      parts.push(`added ${changes.addedSets} set${changes.addedSets > 1 ? 's' : ''}`)
    }
    if (changes.removedSets > 0) {
      parts.push(`removed ${changes.removedSets} set${changes.removedSets > 1 ? 's' : ''}`)
    }
    
    if (parts.length === 0) return ''
    
    // Join with "and" for natural language
    if (parts.length === 1) {
      return `You ${parts[0]}.`
    }
    return `You ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}.`
  }
  
  return (
    <div className="min-h-screen bg-black pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black border-b border-dark-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/workout/active')}
            className="p-2 -ml-2"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <span className="text-white font-medium">Save Workout</span>
          <Button onClick={handleSave} size="sm" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Workout Title - Editable */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false)
                if (editedTitle.trim()) {
                  updateWorkoutName(editedTitle.trim())
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false)
                  if (editedTitle.trim()) {
                    updateWorkoutName(editedTitle.trim())
                  }
                }
              }}
              autoFocus
              className="text-2xl font-bold text-white bg-transparent border-b-2 border-cyan-500 focus:outline-none flex-1"
            />
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white">{routineName || 'Workout'}</h1>
              <button 
                onClick={() => {
                  setEditedTitle(routineName || 'Workout')
                  setIsEditingTitle(true)
                }}
                className="p-1 text-gray-500 hover:text-cyan-400 transition-colors"
              >
                <Edit2 size={18} />
              </button>
            </>
          )}
        </div>
        
        {/* Stats Row */}
        <div className="flex gap-8">
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-cyan-400 font-semibold">{formatDuration(elapsedSeconds)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Volume</p>
            <p className="text-white font-semibold">{Math.round(totalVolume)} lbs</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Sets</p>
            <p className="text-white font-semibold">{completedSets}</p>
          </div>
        </div>
        
        {/* When */}
        <div>
          <p className="text-xs text-gray-500 mb-1">When</p>
          <p className="text-cyan-400">{formatDateTime(workoutDate)}</p>
        </div>
        
        {/* Photo/Video Upload */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />
          
          {photoUrl ? (
            <div className="relative">
              <img 
                src={photoUrl} 
                alt="Workout" 
                className="w-full h-48 object-cover rounded-xl border border-dark-600"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={handlePhotoUpload}
              className="w-full py-8 border-2 border-dashed border-dark-600 rounded-xl flex items-center justify-center gap-3 text-gray-500 hover:border-cyan-700/50 hover:text-gray-400 transition-colors"
            >
              <Image size={24} />
              <span>Add a photo / video</span>
            </button>
          )}
        </div>
        
        {/* Saved Videos Section */}
        {savedVideos.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-3">Saved Videos ({savedVideos.length})</p>
            <div className="space-y-3">
              {savedVideos.map((video) => (
                <div key={video.id} className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
                  <div className="relative">
                    <video
                      src={video.videoUrl}
                      controls
                      className="w-full aspect-video"
                    />
                    <button
                      onClick={() => handleDeleteVideoClick(video.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video size={16} className="text-cyan-400" />
                      <span className="text-white text-sm font-medium">{video.exerciseName}</span>
                    </div>
                    <span className="text-gray-400 text-sm">Set {video.setIndex + 1} • {video.repCount} reps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Description */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Description</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="How did your workout go? Leave some notes here..."
            className="w-full bg-transparent text-white placeholder-gray-600 resize-none focus:outline-none"
            rows={3}
          />
        </div>
        
        {/* Discard Workout */}
        <button
          onClick={() => setShowDiscardModal(true)}
          className="w-full text-center text-red-400 py-4 border-t border-dark-700"
        >
          Discard Workout
        </button>
      </div>
      
      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <DiscardConfirmationModal
          onDiscard={handleDiscard}
          onCancel={() => setShowDiscardModal(false)}
        />
      )}
      
      {/* Update Routine Modal */}
      {showUpdateRoutineModal && (
        <UpdateRoutineModal
          routineName={routineName}
          changesDescription={getChangesDescription()}
          onUpdate={() => {
            setShowUpdateRoutineModal(false)
            saveWorkout(true)
          }}
          onKeepOriginal={() => {
            setShowUpdateRoutineModal(false)
            saveWorkout(false)
          }}
        />
      )}

      {/* Delete Video Confirmation Modal */}
      {showDeleteVideoModal && (
        <DeleteVideoModal
          onDelete={handleConfirmDeleteVideo}
          onCancel={() => {
            setShowDeleteVideoModal(false)
            setVideoToDelete(null)
          }}
        />
      )}
    </div>
  )
}
