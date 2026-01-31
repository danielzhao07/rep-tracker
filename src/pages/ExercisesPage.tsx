import { useState, useMemo, useEffect } from 'react'
import { Search, X, TrendingUp, Grid3X3, MoreHorizontal, Dumbbell, Circle, ArrowLeft, BarChart3, ChevronRight, Clock } from 'lucide-react'
import { useHistoryStore } from '@/store/historyStore'

// Equipment types for filtering
const EQUIPMENT_TYPES = [
  'All Equipment',
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Smith Machine',
  'Bodyweight',
  'Kettlebell',
  'Plate',
  'Resistance Band',
  'Other',
] as const

// Muscle groups for filtering (matches Hevy app)
const MUSCLE_GROUPS = [
  'All Muscles',
  'Abdominals',
  'Abductors',
  'Adductors',
  'Biceps',
  'Calves',
  'Cardio',
  'Chest',
  'Forearms',
  'Full Body',
  'Glutes',
  'Hamstrings',
  'Lats',
  'Lower Back',
  'Neck',
  'Quadriceps',
  'Shoulders',
  'Traps',
  'Triceps',
  'Upper Back',
  'Other',
] as const

type Equipment = typeof EQUIPMENT_TYPES[number]
type MuscleGroup = typeof MUSCLE_GROUPS[number]

// Muscle group to wger.de muscle ID mapping
const MUSCLE_IMAGE_IDS: Record<string, number> = {
  'Abdominals': 6,
  'Abductors': 10, // outer thigh/quads area
  'Adductors': 11, // inner thigh area
  'Biceps': 1,
  'Calves': 7,
  'Chest': 4,
  'Forearms': 13,
  'Glutes': 8,
  'Hamstrings': 11,
  'Lats': 12,
  'Lower Back': 9, // using traps/back
  'Quadriceps': 10,
  'Shoulders': 2,
  'Traps': 9,
  'Triceps': 5,
  'Upper Back': 12,
  'Neck': 9,
}

// Get muscle image URL from wger.de
function getMuscleImageUrl(muscleGroup: string): string | null {
  const muscleId = MUSCLE_IMAGE_IDS[muscleGroup]
  if (muscleId) {
    return `https://wger.de/static/images/muscles/main/muscle-${muscleId}.svg`
  }
  return null
}

// Equipment icon component
function EquipmentIcon({ equipment, size = 32 }: { equipment: string, size?: number }) {
  const iconClass = `text-gray-700`
  
  switch (equipment) {
    case 'Barbell':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={iconClass}>
          {/* Bar */}
          <rect x="2" y="23" width="44" height="2" fill="currentColor"/>
          {/* Left collar */}
          <rect x="6" y="21" width="2" height="6" fill="currentColor"/>
          {/* Left plates */}
          <rect x="8" y="16" width="3" height="16" fill="currentColor"/>
          <rect x="12" y="18" width="3" height="12" fill="currentColor"/>
          {/* Right collar */}
          <rect x="40" y="21" width="2" height="6" fill="currentColor"/>
          {/* Right plates */}
          <rect x="37" y="16" width="3" height="16" fill="currentColor"/>
          <rect x="33" y="18" width="3" height="12" fill="currentColor"/>
        </svg>
      )
    case 'Dumbbell':
      return <Dumbbell size={size} className={iconClass} />
    case 'Machine':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={iconClass}>
          {/* Top horizontal bar */}
          <rect x="12" y="6" width="24" height="3" fill="currentColor"/>
          {/* Center vertical pole */}
          <rect x="22" y="6" width="4" height="10" fill="currentColor"/>
          {/* Curved arms with handles */}
          <path d="M14 8 Q6 12 6 22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M34 8 Q42 12 42 22" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          {/* Handles */}
          <rect x="4" y="22" width="4" height="6" rx="1" fill="currentColor"/>
          <rect x="40" y="22" width="4" height="6" rx="1" fill="currentColor"/>
          {/* Seat back */}
          <rect x="20" y="16" width="8" height="12" fill="currentColor"/>
          {/* Seat */}
          <rect x="18" y="28" width="12" height="4" fill="currentColor"/>
          {/* Base legs */}
          <rect x="16" y="32" width="3" height="10" fill="currentColor"/>
          <rect x="29" y="32" width="3" height="10" fill="currentColor"/>
          {/* Bottom base */}
          <rect x="10" y="42" width="28" height="3" fill="currentColor"/>
        </svg>
      )
    case 'Cable':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={iconClass}>
          {/* Frame - vertical posts */}
          <rect x="4" y="6" width="3" height="38" fill="currentColor"/>
          <rect x="41" y="6" width="3" height="38" fill="currentColor"/>
          {/* Frame - top horizontal */}
          <rect x="4" y="4" width="40" height="3" fill="currentColor"/>
          {/* Weight stacks */}
          <circle cx="7" cy="24" r="5" fill="currentColor"/>
          <circle cx="7" cy="24" r="1.5" fill="white"/>
          <circle cx="41" cy="24" r="5" fill="currentColor"/>
          <circle cx="41" cy="24" r="1.5" fill="white"/>
          {/* Cables from top to hands */}
          <line x1="10" y1="8" x2="18" y2="26" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="38" y1="8" x2="30" y2="26" stroke="currentColor" strokeWidth="1.5"/>
          {/* Person - head */}
          <circle cx="24" cy="18" r="3" fill="currentColor"/>
          {/* Person - body */}
          <line x1="24" y1="21" x2="24" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Person - arms holding cables (raised outward) */}
          <line x1="24" y1="24" x2="18" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="24" y1="24" x2="30" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Person - legs */}
          <line x1="24" y1="34" x2="20" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="24" y1="34" x2="28" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      )
    case 'Smith Machine':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={iconClass}>
          {/* Vertical posts */}
          <rect x="8" y="4" width="4" height="40" fill="currentColor"/>
          <rect x="36" y="4" width="4" height="40" fill="currentColor"/>
          {/* Barbell with plates */}
          <rect x="2" y="14" width="2" height="4" fill="currentColor"/>
          <rect x="4" y="12" width="3" height="8" fill="currentColor"/>
          <rect x="44" y="14" width="2" height="4" fill="currentColor"/>
          <rect x="41" y="12" width="3" height="8" fill="currentColor"/>
          <rect x="7" y="15" width="34" height="2" fill="currentColor"/>
          {/* J-hooks */}
          <rect x="12" y="12" width="3" height="2" fill="currentColor"/>
          <rect x="33" y="12" width="3" height="2" fill="currentColor"/>
          {/* Bench */}
          <rect x="16" y="32" width="16" height="4" fill="currentColor"/>
          <rect x="14" y="36" width="4" height="8" fill="currentColor"/>
          <rect x="30" y="36" width="4" height="8" fill="currentColor"/>
          {/* Base */}
          <rect x="6" y="44" width="36" height="2" fill="currentColor"/>
        </svg>
      )
    case 'Bodyweight':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={iconClass}>
          <circle cx="24" cy="10" r="6" fill="currentColor"/>
          <path d="M24 18 L24 32 M16 24 L32 24 M24 32 L18 44 M24 32 L30 44" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      )
    case 'Kettlebell':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={iconClass}>
          <path d="M18 16 Q18 8 24 8 Q30 8 30 16" stroke="currentColor" strokeWidth="3" fill="none"/>
          <ellipse cx="24" cy="28" rx="12" ry="14" fill="currentColor"/>
        </svg>
      )
    case 'Plate':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={iconClass}>
          <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="none"/>
          <circle cx="24" cy="24" r="6" fill="currentColor"/>
        </svg>
      )
    case 'Resistance Band':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={iconClass}>
          <path d="M8 24 Q16 12 24 24 Q32 36 40 24" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
        </svg>
      )
    default:
      return <MoreHorizontal size={size} className={iconClass} />
  }
}

// Muscle group icon component
function MuscleIcon({ muscleGroup, size = 48 }: { muscleGroup: string, size?: number }) {
  const imageUrl = getMuscleImageUrl(muscleGroup)
  
  if (muscleGroup === 'All Muscles') {
    return <Grid3X3 size={size * 0.5} className="text-gray-700" />
  }
  
  if (muscleGroup === 'Cardio') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="14" r="6" fill="#666"/>
        <path d="M24 22 L24 32 M18 26 L30 26 M24 32 L20 42 M24 32 L28 42" stroke="#666" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M32 18 L38 12 M36 20 L42 14" stroke="#e53935" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }
  
  if (muscleGroup === 'Full Body') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="10" r="6" fill="#666"/>
        <path d="M24 18 L24 30 M16 22 L32 22 M24 30 L18 42 M24 30 L30 42" stroke="#666" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    )
  }
  
  if (muscleGroup === 'Other') {
    return <MoreHorizontal size={size * 0.5} className="text-gray-500" />
  }
  
  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={muscleGroup}
        className="object-contain"
        style={{ width: size, height: size }}
      />
    )
  }
  
  return <Circle size={size * 0.5} className="text-gray-400" />
}

// Extended exercise type for the library
interface LibraryExercise {
  id: string
  name: string
  muscleGroup: string
  secondaryMuscles?: string[]
  equipment: string
  isRecent?: boolean
  hasVideoDetection?: boolean
  instructions?: string[]
}

// Sample exercise data
const SAMPLE_EXERCISES: LibraryExercise[] = [
  { id: '1', name: 'Bench Press (Barbell)', muscleGroup: 'Chest', equipment: 'Barbell' },
  { id: '2', name: 'Bicep Curl (Dumbbell)', muscleGroup: 'Biceps', equipment: 'Dumbbell', hasVideoDetection: true },
  { id: '3', name: 'Deadlift (Barbell)', muscleGroup: 'Glutes', equipment: 'Barbell' },
  { id: '4', name: 'Incline Bench Press (Dumbbell)', muscleGroup: 'Chest', equipment: 'Dumbbell' },
  { id: '5', name: '21s Bicep Curl', muscleGroup: 'Biceps', equipment: 'Barbell', hasVideoDetection: true },
  { id: '6', name: 'Ab Scissors', muscleGroup: 'Abdominals', equipment: 'Bodyweight' },
  { id: '7', name: 'Ab Wheel', muscleGroup: 'Abdominals', equipment: 'Other' },
  { id: '8', name: 'Arnold Press (Dumbbell)', muscleGroup: 'Shoulders', equipment: 'Dumbbell' },
  { id: '9', name: 'Back Extension', muscleGroup: 'Lower Back', equipment: 'Bodyweight' },
  { id: '10', name: 'Back Extension (Machine)', muscleGroup: 'Lower Back', equipment: 'Machine' },
  { id: '11', name: 'Ball Slams', muscleGroup: 'Full Body', equipment: 'Other' },
  { id: '12', name: 'Barbell Row', muscleGroup: 'Upper Back', equipment: 'Barbell' },
  { id: '13', name: 'Bench Press (Smith Machine)', muscleGroup: 'Chest', equipment: 'Smith Machine' },
  { id: '14', name: 'Box Jump', muscleGroup: 'Quadriceps', equipment: 'Bodyweight' },
  { id: '15', name: 'Bulgarian Split Squat', muscleGroup: 'Quadriceps', equipment: 'Dumbbell' },
  { id: '16', name: 'Cable Crossover', muscleGroup: 'Chest', equipment: 'Cable' },
  { id: '17', name: 'Cable Fly', muscleGroup: 'Chest', equipment: 'Cable' },
  { id: '18', name: 'Calf Raise (Machine)', muscleGroup: 'Calves', equipment: 'Machine' },
  { id: '19', name: 'Calf Raise (Smith Machine)', muscleGroup: 'Calves', equipment: 'Smith Machine' },
  { id: '20', name: 'Chest Press (Machine)', muscleGroup: 'Chest', equipment: 'Machine' },
  { id: '21', name: 'Chin Up', muscleGroup: 'Lats', equipment: 'Bodyweight' },
  { id: '22', name: 'Clean', muscleGroup: 'Full Body', equipment: 'Barbell' },
  { id: '23', name: 'Clean and Jerk', muscleGroup: 'Full Body', equipment: 'Barbell' },
  { id: '24', name: 'Concentration Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', hasVideoDetection: true },
  { id: '25', name: 'Crunch', muscleGroup: 'Abdominals', equipment: 'Bodyweight' },
  { id: '26', name: 'Deadlift (Smith Machine)', muscleGroup: 'Glutes', equipment: 'Smith Machine' },
  { id: '27', name: 'Decline Bench Press (Barbell)', muscleGroup: 'Chest', equipment: 'Barbell' },
  { id: '28', name: 'Decline Bench Press (Smith Machine)', muscleGroup: 'Chest', equipment: 'Smith Machine' },
  { id: '29', name: 'Dip', muscleGroup: 'Triceps', equipment: 'Bodyweight' },
  { id: '30', name: 'Dumbbell Fly', muscleGroup: 'Chest', equipment: 'Dumbbell' },
  { id: '31', name: 'Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbell' },
  { id: '32', name: 'Face Pull', muscleGroup: 'Shoulders', equipment: 'Cable' },
  { id: '33', name: 'Front Raise (Dumbbell)', muscleGroup: 'Shoulders', equipment: 'Dumbbell' },
  { id: '34', name: 'Front Raise (Cable)', muscleGroup: 'Shoulders', equipment: 'Cable' },
  { id: '35', name: 'Goblet Squat', muscleGroup: 'Quadriceps', equipment: 'Dumbbell' },
  { id: '36', name: 'Good Morning', muscleGroup: 'Hamstrings', equipment: 'Barbell' },
  { id: '37', name: 'Hack Squat (Machine)', muscleGroup: 'Quadriceps', equipment: 'Machine' },
  { id: '38', name: 'Hammer Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', hasVideoDetection: true },
  { id: '39', name: 'Hanging Leg Raise', muscleGroup: 'Abdominals', equipment: 'Bodyweight' },
  { id: '40', name: 'Hip Thrust (Barbell)', muscleGroup: 'Glutes', equipment: 'Barbell' },
  { id: '41', name: 'Hip Thrust (Smith Machine)', muscleGroup: 'Glutes', equipment: 'Smith Machine' },
  { id: '42', name: 'Incline Bench Press (Barbell)', muscleGroup: 'Chest', equipment: 'Barbell' },
  { id: '43', name: 'Incline Bench Press (Smith Machine)', muscleGroup: 'Chest', equipment: 'Smith Machine' },
  { id: '44', name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', hasVideoDetection: true },
  { id: '45', name: 'Kettlebell Swing', muscleGroup: 'Full Body', equipment: 'Kettlebell' },
  { id: '46', name: 'Lat Pulldown', muscleGroup: 'Lats', equipment: 'Cable' },
  { id: '47', name: 'Lateral Raise (Dumbbell)', muscleGroup: 'Shoulders', equipment: 'Dumbbell' },
  { id: '48', name: 'Lateral Raise (Cable)', muscleGroup: 'Shoulders', equipment: 'Cable' },
  { id: '49', name: 'Leg Curl (Machine)', muscleGroup: 'Hamstrings', equipment: 'Machine' },
  { id: '50', name: 'Leg Extension (Machine)', muscleGroup: 'Quadriceps', equipment: 'Machine' },
  { id: '51', name: 'Leg Press (Machine)', muscleGroup: 'Quadriceps', equipment: 'Machine' },
  { id: '52', name: 'Lunge', muscleGroup: 'Quadriceps', equipment: 'Bodyweight' },
  { id: '53', name: 'Lunge (Smith Machine)', muscleGroup: 'Quadriceps', equipment: 'Smith Machine' },
  { id: '54', name: 'Mountain Climbers', muscleGroup: 'Cardio', equipment: 'Bodyweight' },
  { id: '55', name: 'Overhead Press (Barbell)', muscleGroup: 'Shoulders', equipment: 'Barbell' },
  { id: '56', name: 'Overhead Press (Smith Machine)', muscleGroup: 'Shoulders', equipment: 'Smith Machine' },
  { id: '57', name: 'Pendlay Row', muscleGroup: 'Upper Back', equipment: 'Barbell' },
  { id: '58', name: 'Plank', muscleGroup: 'Abdominals', equipment: 'Bodyweight' },
  { id: '59', name: 'Preacher Curl (Machine)', muscleGroup: 'Biceps', equipment: 'Machine' },
  { id: '60', name: 'Pull Up', muscleGroup: 'Lats', equipment: 'Bodyweight' },
  { id: '61', name: 'Push Up', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Bodyweight', hasVideoDetection: true, instructions: ['Get down on all fours.', 'Extend your body into a push-up position. Have your hands flat on the floor, fingertips rotated slightly out, and shoulder blades retracted.', 'Have your legs straight and your toes supporting your lower body. Your ankles, knees, hips, and shoulders should be in a straight line.', 'Take a breath and lower yourself by bending your elbows.', 'Descend as low as possible—ideally, until your face is an inch or two from the floor.', 'Hold the bottom position for a moment and press yourself back to the top as you exhale.'] },
  { id: '62', name: 'Romanian Deadlift (Barbell)', muscleGroup: 'Hamstrings', equipment: 'Barbell' },
  { id: '63', name: 'Romanian Deadlift (Smith Machine)', muscleGroup: 'Hamstrings', equipment: 'Smith Machine' },
  { id: '64', name: 'Rowing Machine', muscleGroup: 'Cardio', equipment: 'Machine' },
  { id: '65', name: 'Russian Twist', muscleGroup: 'Abdominals', equipment: 'Bodyweight' },
  { id: '66', name: 'Seated Row (Cable)', muscleGroup: 'Upper Back', equipment: 'Cable' },
  { id: '67', name: 'Shoulder Press (Machine)', muscleGroup: 'Shoulders', equipment: 'Machine' },
  { id: '68', name: 'Shrug (Dumbbell)', muscleGroup: 'Traps', equipment: 'Dumbbell' },
  { id: '69', name: 'Shrug (Smith Machine)', muscleGroup: 'Traps', equipment: 'Smith Machine' },
  { id: '70', name: 'Side Plank', muscleGroup: 'Abdominals', equipment: 'Bodyweight' },
  { id: '71', name: 'Sit Up', muscleGroup: 'Abdominals', equipment: 'Bodyweight' },
  { id: '72', name: 'Skull Crusher', muscleGroup: 'Triceps', equipment: 'Barbell' },
  { id: '73', name: 'Snatch', muscleGroup: 'Full Body', equipment: 'Barbell' },
  { id: '74', name: 'Squat (Barbell)', muscleGroup: 'Quadriceps', equipment: 'Barbell', hasVideoDetection: true },
  { id: '75', name: 'Squat (Smith Machine)', muscleGroup: 'Quadriceps', equipment: 'Smith Machine', hasVideoDetection: true },
  { id: '76', name: 'Step Up', muscleGroup: 'Quadriceps', equipment: 'Bodyweight' },
  { id: '77', name: 'Tricep Dip', muscleGroup: 'Triceps', equipment: 'Bodyweight' },
  { id: '78', name: 'Tricep Extension (Cable)', muscleGroup: 'Triceps', equipment: 'Cable' },
  { id: '79', name: 'Tricep Pushdown', muscleGroup: 'Triceps', equipment: 'Cable' },
  { id: '80', name: 'Upright Row (Barbell)', muscleGroup: 'Traps', equipment: 'Barbell' },
  { id: '81', name: 'Upright Row (Smith Machine)', muscleGroup: 'Traps', equipment: 'Smith Machine' },
  { id: '82', name: 'Walking Lunge', muscleGroup: 'Quadriceps', equipment: 'Bodyweight' },
  { id: '83', name: 'Wall Sit', muscleGroup: 'Quadriceps', equipment: 'Bodyweight' },
  { id: '84', name: 'Seated Leg Press (Machine)', muscleGroup: 'Quadriceps', equipment: 'Machine' },
  { id: '85', name: 'Chest Fly (Pec Deck)', muscleGroup: 'Chest', equipment: 'Machine' },
]

// Bottom sheet modal for filter selection
function FilterModal({ 
  isOpen, 
  onClose, 
  title,
  options, 
  selected, 
  onSelect,
  filterType
}: { 
  isOpen: boolean
  onClose: () => void
  title: string
  options: readonly string[]
  selected: string
  onSelect: (option: string) => void
  filterType: 'muscle' | 'equipment'
}) {
  if (!isOpen) return null

  const renderIcon = (option: string) => {
    if (filterType === 'muscle') {
      return <MuscleIcon muscleGroup={option} size={48} />
    } else if (filterType === 'equipment') {
      if (option === 'All Equipment') {
        return <Grid3X3 size={24} className="text-gray-700" />
      } else if (option === 'Other') {
        return <MoreHorizontal size={24} className="text-gray-500" />
      } else {
        return <EquipmentIcon equipment={option} size={32} />
      }
    }
    return <Circle size={24} className="text-gray-400" />
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-800 rounded-t-2xl z-50 max-h-[70vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>
        
        {/* Title */}
        <h2 className="text-white text-center text-lg font-semibold pb-3">{title}</h2>
        
        {/* Options */}
        <div className="overflow-y-auto flex-1 pb-8">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onSelect(option)
                onClose()
              }}
              className="w-full flex items-center gap-4 px-5 py-3 hover:bg-dark-700 transition-colors border-t border-dark-700"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                {renderIcon(option)}
              </div>
              
              <span className="text-white text-[17px] flex-1 text-left">{option}</span>
              
              {selected === option && (
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// Exercise Detail Modal
function ExerciseDetailModal({ 
  exercise, 
  isOpen, 
  onClose,
  workouts 
}: { 
  exercise: LibraryExercise | null
  isOpen: boolean
  onClose: () => void
  workouts: any[]
}) {
  const [activeTab, setActiveTab] = useState<'summary' | 'history' | 'howto'>('summary')
  const [chartMode, setChartMode] = useState<'set' | 'session'>('set')
  
  if (!isOpen || !exercise) return null
  
  // Get workouts for this exercise
  const exerciseWorkouts = workouts.filter(w => 
    w.exerciseId === exercise.id ||
    w.exerciseId?.toLowerCase().includes(exercise.name.toLowerCase().split(' ')[0].toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  // Get most recent workout stats
  const mostRecentWorkout = exerciseWorkouts[0]
  const bestReps = exerciseWorkouts.length > 0 
    ? Math.max(...exerciseWorkouts.map(w => w.repCount || 0))
    : null
  
  return (
    <div className="fixed inset-0 bg-dark-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
        <button onClick={onClose} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-white text-[17px] font-semibold">{exercise.name}</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-dark-700">
        {(['summary', 'history', 'howto'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[15px] font-medium transition-colors relative ${
              activeTab === tab ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            {tab === 'summary' ? 'Summary' : tab === 'history' ? 'History' : 'How to'}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'summary' && (
          <div>
            {/* Exercise Image Placeholder */}
            <div className="bg-gradient-to-b from-dark-800 to-dark-900 py-8 flex justify-center">
              <div className="w-48 h-32 bg-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm">Exercise Image</span>
              </div>
            </div>
            
            {/* Exercise Info */}
            <div className="px-4 py-4">
              <h2 className="text-white text-xl font-bold">{exercise.name}</h2>
              <p className="text-gray-400 text-[14px] mt-1">Primary: {exercise.muscleGroup}</p>
              {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                <p className="text-gray-400 text-[14px]">Secondary: {exercise.secondaryMuscles.join(', ')}</p>
              )}
              
              {/* Chart Area */}
              <div className="mt-4">
                {exerciseWorkouts.length > 0 && mostRecentWorkout ? (
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-white text-2xl font-bold">{mostRecentWorkout.repCount} reps</span>
                      <span className="text-blue-500 text-sm">
                        {new Date(mostRecentWorkout.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ) : null}
                
                <div className="bg-dark-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[140px]">
                  {exerciseWorkouts.length > 0 ? (
                    <div className="w-full h-24 flex items-end justify-center gap-2">
                      {exerciseWorkouts.slice(0, 10).reverse().map((w, i) => (
                        <div 
                          key={i}
                          className="bg-blue-500 rounded-t w-6"
                          style={{ height: `${Math.max(20, (w.repCount / (bestReps || 1)) * 80)}%` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      <BarChart3 className="w-12 h-12 text-gray-600 mb-2" />
                      <p className="text-gray-500">No data yet</p>
                    </>
                  )}
                </div>
                
                {/* Chart Toggle */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setChartMode('set')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      chartMode === 'set' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-dark-700 text-gray-400'
                    }`}
                  >
                    Most Reps (Set)
                  </button>
                  <button
                    onClick={() => setChartMode('session')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      chartMode === 'session' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-dark-700 text-gray-400'
                    }`}
                  >
                    Session Reps
                  </button>
                </div>
              </div>
              
              {/* Personal Records */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏆</span>
                  <span className="text-white font-semibold">Personal Records</span>
                </div>
                
                <div className="border-t border-dark-700">
                  <div className="flex justify-between py-3 border-b border-dark-700">
                    <span className="text-white">Best Set</span>
                    <span className="text-gray-400">{bestReps ? `${bestReps} reps` : '-'}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-white">Most Session Reps</span>
                    <span className="text-gray-400">{bestReps ? `${bestReps} reps` : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="px-4 py-4">
            {exerciseWorkouts.length > 0 ? (
              exerciseWorkouts.map((workout, index) => {
                const date = new Date(workout.createdAt)
                const hour = date.getHours()
                let emoji = '☀️'
                if (hour >= 5 && hour < 12) emoji = '🌅'
                else if (hour >= 12 && hour < 17) emoji = '☀️'
                else if (hour >= 17 && hour < 21) emoji = '🌆'
                else emoji = '🌙'
                
                return (
                  <div key={workout.id || index} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium flex items-center gap-2">
                          Workout {emoji}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}, {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                      </div>
                      <span className="text-white font-medium">{exercise.name}</span>
                    </div>
                    
                    <div className="ml-13">
                      <div className="flex gap-8 text-gray-500 text-sm mb-1">
                        <span>SET</span>
                        <span>REPS</span>
                      </div>
                      <div className="flex gap-8 text-white">
                        <span className="w-8">1</span>
                        <span>{workout.repCount}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full border-2 border-gray-600 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">No exercise history</h3>
                <p className="text-gray-500 text-center text-sm">
                  When you log a workout with this exercise,<br />your history will appear here.
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'howto' && (
          <div>
            {/* Exercise Image */}
            <div className="bg-gradient-to-b from-dark-800 to-dark-900 py-8 flex justify-center">
              <div className="w-48 h-32 bg-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm">Exercise Image</span>
              </div>
            </div>
            
            <div className="px-4 py-4">
              <h2 className="text-white text-xl font-bold mb-4">{exercise.name}</h2>
              
              {exercise.instructions && exercise.instructions.length > 0 ? (
                <ol className="space-y-4">
                  {exercise.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-blue-500 font-bold">{index + 1}.</span>
                      <span className="text-white leading-relaxed">{instruction}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-gray-500">Instructions not available for this exercise.</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Add Exercise Button */}
      <div className="p-4 border-t border-dark-700">
        <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-[16px]">
          Add exercise
        </button>
      </div>
    </div>
  )
}

// Exercise list item
function ExerciseListItem({ exercise, onTrendClick }: { exercise: LibraryExercise, onTrendClick: () => void }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-dark-700">
      {/* Placeholder for exercise image */}
      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-white text-[15px] font-medium">{exercise.name}</h3>
        <p className="text-gray-500 text-[14px]">{exercise.muscleGroup}</p>
      </div>
      
      {/* Trend icon - Green with hover effect */}
      <button 
        onClick={onTrendClick}
        className="w-10 h-10 rounded-full border border-green-600 flex items-center justify-center transition-all hover:bg-green-600 hover:border-green-500 group"
      >
        <TrendingUp className="w-5 h-5 text-green-500 group-hover:text-white transition-colors" />
      </button>
    </div>
  )
}

export function ExercisesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment>('All Equipment')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>('All Muscles')
  const [aiDetectionEnabled, setAiDetectionEnabled] = useState(false)
  const [hideRecentExercises, setHideRecentExercises] = useState(false)
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false)
  const [muscleModalOpen, setMuscleModalOpen] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<LibraryExercise | null>(null)
  
  const { workouts, loadWorkouts } = useHistoryStore()
  
  // Load workout history on mount
  useEffect(() => {
    loadWorkouts()
  }, [loadWorkouts])
  
  // Get recent exercise IDs from workout history (unique, most recent first)
  const recentExerciseIds = useMemo(() => {
    const sortedWorkouts = [...workouts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const seen = new Set<string>()
    const recentIds: string[] = []
    for (const workout of sortedWorkouts) {
      if (!seen.has(workout.exerciseId) && recentIds.length < 5) {
        seen.add(workout.exerciseId)
        recentIds.push(workout.exerciseId)
      }
    }
    return recentIds
  }, [workouts])

  // Filter exercises
  const filteredExercises = useMemo(() => {
    let exercises = [...SAMPLE_EXERCISES]
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      exercises = exercises.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.muscleGroup.toLowerCase().includes(query) ||
        e.equipment.toLowerCase().includes(query)
      )
    }
    
    // Apply equipment filter
    if (selectedEquipment !== 'All Equipment') {
      exercises = exercises.filter(e => e.equipment === selectedEquipment)
    }
    
    // Apply muscle filter
    if (selectedMuscle !== 'All Muscles') {
      exercises = exercises.filter(e => e.muscleGroup === selectedMuscle)
    }
    
    // Apply AI detection filter
    if (aiDetectionEnabled) {
      exercises = exercises.filter(e => e.hasVideoDetection)
    }
    
    return exercises
  }, [searchQuery, selectedEquipment, selectedMuscle, aiDetectionEnabled])

  const hasActiveFilters = selectedEquipment !== 'All Equipment' || selectedMuscle !== 'All Muscles' || aiDetectionEnabled

  // Split into recent (from history) and all exercises
  const recentExercises = useMemo(() => {
    if (hideRecentExercises || hasActiveFilters) return []
    return recentExerciseIds
      .map(id => {
        // Try to match by exercise ID or by name similarity
        return filteredExercises.find(e => 
          e.id === id || 
          e.name.toLowerCase().includes(id.toLowerCase()) ||
          id.toLowerCase().includes(e.name.toLowerCase().split(' ')[0])
        )
      })
      .filter((e): e is LibraryExercise => e !== undefined)
  }, [recentExerciseIds, filteredExercises, hideRecentExercises, hasActiveFilters])
  
  const allExercises = filteredExercises
    .filter(e => !recentExercises.some(r => r.id === e.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-dark-900 pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-4">
          <button className="text-blue-400 text-[17px] font-medium">Cancel</button>
          <h1 className="text-white text-[17px] font-semibold">Add Exercise</h1>
          <button className="text-blue-400 text-[17px] font-medium">Create</button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search exercise"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-700 text-white placeholder-gray-500 rounded-xl py-3 pl-12 pr-4 text-[16px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setEquipmentModalOpen(true)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
              selectedEquipment !== 'All Equipment' 
                ? 'bg-blue-600 text-white' 
                : 'bg-dark-700 text-gray-300'
            }`}
          >
            <span className="truncate">{selectedEquipment === 'All Equipment' ? 'Equipment' : selectedEquipment}</span>
            {selectedEquipment !== 'All Equipment' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEquipment('All Equipment')
                }}
                className="ml-0.5 hover:bg-blue-700 rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </button>
          
          <button
            onClick={() => setMuscleModalOpen(true)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
              selectedMuscle !== 'All Muscles' 
                ? 'bg-blue-600 text-white' 
                : 'bg-dark-700 text-gray-300'
            }`}
          >
            <span className="truncate">{selectedMuscle === 'All Muscles' ? 'Muscles' : selectedMuscle}</span>
            {selectedMuscle !== 'All Muscles' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedMuscle('All Muscles')
                }}
                className="ml-0.5 hover:bg-blue-700 rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </button>
          
          <button
            onClick={() => setAiDetectionEnabled(!aiDetectionEnabled)}
            className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
              aiDetectionEnabled 
                ? 'bg-blue-600 text-white' 
                : 'bg-dark-700 text-gray-300'
            }`}
          >
            <span>AI Detection</span>
          </button>
        </div>
      </div>

      {/* Exercise Lists */}
      <div className="px-4">
        {/* Recent Exercises */}
        {recentExercises.length > 0 && !hasActiveFilters && !hideRecentExercises && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-gray-500 text-[14px] font-medium">Recent Exercises</h2>
              <button
                onClick={() => setHideRecentExercises(true)}
                className="text-gray-500 hover:text-gray-400 p-1"
              >
                <X size={16} />
              </button>
            </div>
            {recentExercises.map((exercise) => (
              <ExerciseListItem 
                key={exercise.id} 
                exercise={exercise} 
                onTrendClick={() => setSelectedExercise(exercise)}
              />
            ))}
          </div>
        )}

        {/* All Exercises */}
        <div>
          <h2 className="text-gray-500 text-[14px] font-medium mb-2">All Exercises</h2>
          {allExercises.length > 0 ? (
            allExercises.map((exercise) => (
              <ExerciseListItem 
                key={exercise.id} 
                exercise={exercise} 
                onTrendClick={() => setSelectedExercise(exercise)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No exercises found</p>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modals */}
      <FilterModal
        isOpen={equipmentModalOpen}
        onClose={() => setEquipmentModalOpen(false)}
        title="Equipment"
        options={EQUIPMENT_TYPES}
        selected={selectedEquipment}
        onSelect={(option) => setSelectedEquipment(option as Equipment)}
        filterType="equipment"
      />
      
      <FilterModal
        isOpen={muscleModalOpen}
        onClose={() => setMuscleModalOpen(false)}
        title="Muscle Group"
        options={MUSCLE_GROUPS}
        selected={selectedMuscle}
        onSelect={(option) => setSelectedMuscle(option as MuscleGroup)}
        filterType="muscle"
      />
      
      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        isOpen={selectedExercise !== null}
        onClose={() => setSelectedExercise(null)}
        workouts={workouts}
      />
    </div>
  )
}
