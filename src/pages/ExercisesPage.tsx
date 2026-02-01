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
  { id: '1', name: 'Bench Press (Barbell)', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Barbell', instructions: ['Lie flat on the bench with your feet flat on the floor.', 'Grip the barbell slightly wider than shoulder width.', 'Unrack the bar and position it above your chest with arms fully extended.', 'Lower the bar slowly to your mid-chest.', 'Press the bar back up explosively to the starting position.', 'Keep your shoulder blades retracted throughout the movement.'] },
  { id: '2', name: 'Bicep Curl (Dumbbell)', muscleGroup: 'Biceps', equipment: 'Dumbbell', hasVideoDetection: true, instructions: ['Stand with feet shoulder-width apart, holding dumbbells at your sides.', 'Keep your elbows close to your torso and palms facing forward.', 'Curl the weights while contracting your biceps.', 'Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level.', 'Hold the contracted position briefly.', 'Slowly lower the dumbbells back to the starting position.'] },
  { id: '3', name: 'Deadlift (Barbell)', muscleGroup: 'Glutes', secondaryMuscles: ['Hamstrings', 'Lower Back', 'Traps'], equipment: 'Barbell', instructions: ['Stand with feet hip-width apart, barbell over mid-foot.', 'Bend at the hips and knees, grip the bar just outside your legs.', 'Keep your back straight, chest up, and shoulders back.', 'Drive through your heels and extend your hips and knees.', 'Stand tall with the bar at hip level, shoulders back.', 'Lower the bar by pushing your hips back and bending your knees.'] },
  { id: '4', name: 'Incline Bench Press (Dumbbell)', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders', 'Triceps'], equipment: 'Dumbbell', instructions: ['Set an adjustable bench to a 30-45 degree incline.', 'Sit back with dumbbells resting on your thighs.', 'Lie back and position the dumbbells at chest level.', 'Press the dumbbells up until arms are extended.', 'Lower the dumbbells slowly to chest level.', 'Keep your feet flat on the floor and back pressed against the bench.'] },
  { id: '5', name: '21s Bicep Curl', muscleGroup: 'Biceps', equipment: 'Barbell', hasVideoDetection: true, instructions: ['Hold a barbell with an underhand grip, arms fully extended.', 'Perform 7 partial reps from bottom to halfway up.', 'Immediately perform 7 partial reps from halfway to full contraction.', 'Finish with 7 full range of motion reps.', 'Keep your elbows stationary throughout all 21 reps.', 'Control the weight on the eccentric (lowering) phase.'] },
  { id: '6', name: 'Ab Scissors', muscleGroup: 'Abdominals', secondaryMuscles: ['Hip Flexors'], equipment: 'Bodyweight', instructions: ['Lie flat on your back with legs extended and hands under your glutes.', 'Lift both legs off the ground about 6 inches.', 'Alternate crossing one leg over the other in a scissoring motion.', 'Keep your lower back pressed to the floor.', 'Continue the scissoring motion for the desired duration.', 'Keep your core engaged throughout.'] },
  { id: '7', name: 'Ab Wheel', muscleGroup: 'Abdominals', secondaryMuscles: ['Lower Back', 'Shoulders'], equipment: 'Other', instructions: ['Kneel on a mat with the ab wheel in front of you.', 'Grip the handles with both hands.', 'Roll the wheel forward slowly, extending your body.', 'Keep your arms straight and core tight.', 'Roll out as far as possible while maintaining form.', 'Pull yourself back to the starting position using your abs.'] },
  { id: '8', name: 'Arnold Press (Dumbbell)', muscleGroup: 'Shoulders', secondaryMuscles: ['Triceps', 'Upper Chest'], equipment: 'Dumbbell', instructions: ['Sit on a bench with back support, dumbbells at shoulder height.', 'Start with palms facing your body, elbows bent.', 'Press the dumbbells up while rotating your palms forward.', 'At the top, palms should face forward with arms extended.', 'Reverse the motion, rotating palms back toward you.', 'Lower to starting position with controlled motion.'] },
  { id: '9', name: 'Back Extension', muscleGroup: 'Lower Back', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Bodyweight', instructions: ['Position yourself face down on a back extension bench.', 'Cross your arms over your chest or behind your head.', 'Lower your upper body toward the floor by bending at the waist.', 'Keep your back straight during the movement.', 'Raise your torso back up until aligned with your legs.', 'Squeeze your glutes and lower back at the top.'] },
  { id: '10', name: 'Back Extension (Machine)', muscleGroup: 'Lower Back', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Machine', instructions: ['Adjust the machine pad to fit your body size.', 'Position yourself with feet secured and pad against lower back.', 'Start with your body at a 90-degree angle.', 'Extend your back until your body is in a straight line.', 'Squeeze your lower back and glutes at the top.', 'Lower back down with control to the starting position.'] },
  { id: '11', name: 'Ball Slams', muscleGroup: 'Full Body', secondaryMuscles: ['Core', 'Shoulders'], equipment: 'Other', instructions: ['Stand with feet shoulder-width apart holding a slam ball overhead.', 'Engage your core and raise the ball above your head.', 'Forcefully slam the ball to the ground using your entire body.', 'Catch or pick up the ball on the bounce.', 'Immediately raise it overhead again.', 'Repeat for the desired number of reps with explosive power.'] },
  { id: '12', name: 'Barbell Row', muscleGroup: 'Upper Back', secondaryMuscles: ['Lats', 'Biceps'], equipment: 'Barbell', instructions: ['Stand with feet shoulder-width apart, knees slightly bent.', 'Bend forward at the hips with back straight, holding the barbell.', 'Let the bar hang at arm\'s length from your shoulders.', 'Pull the bar to your upper abdomen.', 'Squeeze your shoulder blades together at the top.', 'Lower the bar with control to the starting position.'] },
  { id: '13', name: 'Bench Press (Smith Machine)', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Smith Machine', instructions: ['Lie flat on a bench positioned under the Smith machine bar.', 'Grip the bar slightly wider than shoulder width.', 'Unrack the bar and lower it to your mid-chest.', 'Press the bar back up explosively.', 'Keep your feet flat on the floor.', 'Maintain tension in your chest throughout.'] },
  { id: '14', name: 'Box Jump', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Calves'], equipment: 'Bodyweight', instructions: ['Stand facing a sturdy box or platform.', 'Bend your knees and swing your arms back.', 'Explosively jump onto the box, landing softly.', 'Land with both feet flat on the box, knees slightly bent.', 'Stand tall on the box.', 'Step down carefully and repeat.'] },
  { id: '15', name: 'Bulgarian Split Squat', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Dumbbell', instructions: ['Stand about 2 feet in front of a bench with dumbbells.', 'Place one foot behind you on the bench.', 'Lower your body by bending your front knee.', 'Keep your torso upright and front knee behind toes.', 'Lower until your back knee nearly touches the ground.', 'Push through your front heel to return to start.'] },
  { id: '16', name: 'Cable Crossover', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Cable', instructions: ['Stand in the middle of a cable machine with handles at shoulder height.', 'Grab the handles with arms extended to the sides.', 'Step forward slightly, lean forward with one foot ahead.', 'Bring the handles together in front of your chest.', 'Squeeze your chest muscles at the peak contraction.', 'Slowly return to the starting position with control.'] },
  { id: '17', name: 'Cable Fly', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Cable', instructions: ['Set the pulleys to chest height on both sides.', 'Grab the handles and stand in the center with arms extended.', 'Step forward with a slight lean, one foot in front.', 'Bring your hands together in front of your chest.', 'Keep a slight bend in your elbows throughout.', 'Return to the starting position with controlled motion.'] },
  { id: '18', name: 'Calf Raise (Machine)', muscleGroup: 'Calves', equipment: 'Machine', instructions: ['Position yourself in the calf raise machine with shoulders under pads.', 'Place the balls of your feet on the platform, heels off.', 'Lower your heels as far as possible for a full stretch.', 'Push through the balls of your feet to raise your heels.', 'Rise up as high as possible onto your toes.', 'Hold the peak contraction briefly, then lower with control.'] },
  { id: '19', name: 'Calf Raise (Smith Machine)', muscleGroup: 'Calves', equipment: 'Smith Machine', instructions: ['Position a step or platform under the Smith machine bar.', 'Place the bar across your shoulders and unrack it.', 'Stand on the platform with balls of feet on the edge.', 'Lower your heels below the platform for a stretch.', 'Raise up onto your toes as high as possible.', 'Hold briefly at the top, then lower with control.'] },
  { id: '20', name: 'Chest Press (Machine)', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Machine', instructions: ['Sit on the machine with back firmly against the pad.', 'Adjust the seat so handles are at chest level.', 'Grasp the handles with a firm grip.', 'Press the handles forward until arms are extended.', 'Keep your back pressed against the pad.', 'Return to the starting position with control.'] },
  { id: '21', name: 'Chin Up', muscleGroup: 'Lats', secondaryMuscles: ['Biceps', 'Upper Back'], equipment: 'Bodyweight', instructions: ['Hang from a pull-up bar with an underhand grip, hands shoulder-width apart.', 'Start with arms fully extended.', 'Pull yourself up by squeezing your back and bending your elbows.', 'Continue pulling until your chin is over the bar.', 'Hold briefly at the top.', 'Lower yourself with control to the starting position.'] },
  { id: '22', name: 'Clean', muscleGroup: 'Full Body', secondaryMuscles: ['Traps', 'Shoulders', 'Quadriceps'], equipment: 'Barbell', instructions: ['Stand with feet hip-width apart, barbell over mid-foot.', 'Bend down and grip the bar just outside your legs.', 'Explosively pull the bar up while extending your hips and knees.', 'As the bar reaches chest height, drop under it and catch it on your shoulders.', 'Stand up fully with the bar at shoulder level.', 'Lower the bar back to the starting position with control.'] },
  { id: '23', name: 'Clean and Jerk', muscleGroup: 'Full Body', secondaryMuscles: ['Traps', 'Shoulders', 'Quadriceps', 'Triceps'], equipment: 'Barbell', instructions: ['Perform a clean to bring the bar to your shoulders.', 'Dip slightly by bending your knees.', 'Explosively drive the bar overhead.', 'Drop into a split or squat stance to catch the bar.', 'Stand up fully with arms locked overhead.', 'Lower the bar back to your shoulders, then to the floor.'] },
  { id: '24', name: 'Concentration Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', hasVideoDetection: true, instructions: ['Sit on a bench with legs spread, dumbbell in one hand.', 'Place the back of your upper arm on your inner thigh.', 'Let the dumbbell hang at arm\'s length.', 'Curl the weight up toward your shoulder.', 'Squeeze your bicep at the top of the movement.', 'Lower the weight slowly to the starting position.'] },
  { id: '25', name: 'Crunch', muscleGroup: 'Abdominals', equipment: 'Bodyweight', instructions: ['Lie on your back with knees bent, feet flat on the floor.', 'Place your hands behind your head or across your chest.', 'Engage your core and lift your shoulder blades off the ground.', 'Curl your upper body toward your knees.', 'Hold the contraction briefly at the top.', 'Lower back down with control, keeping tension on your abs.'] },
  { id: '26', name: 'Deadlift (Smith Machine)', muscleGroup: 'Glutes', secondaryMuscles: ['Hamstrings', 'Lower Back', 'Traps'], equipment: 'Smith Machine', instructions: ['Position yourself with feet hip-width apart under the bar.', 'Bend at the hips and knees to grip the bar.', 'Keep your back straight and chest up.', 'Push through your heels and extend your hips and knees.', 'Stand tall with the bar at hip level.', 'Lower the bar by pushing your hips back and bending your knees.'] },
  { id: '27', name: 'Decline Bench Press (Barbell)', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Barbell', instructions: ['Lie on a decline bench with feet secured at the top.', 'Grip the barbell slightly wider than shoulder width.', 'Unrack the bar and position it above your lower chest.', 'Lower the bar to your lower chest.', 'Press the bar back up explosively.', 'Keep your back flat against the bench throughout.'] },
  { id: '28', name: 'Decline Bench Press (Smith Machine)', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Smith Machine', instructions: ['Lie on a decline bench positioned under the Smith machine.', 'Secure your feet at the top of the bench.', 'Grip the bar slightly wider than shoulder width.', 'Unrack the bar and lower it to your lower chest.', 'Press the bar back up explosively.', 'Maintain control throughout the movement.'] },
  { id: '29', name: 'Dip', muscleGroup: 'Triceps', secondaryMuscles: ['Chest', 'Shoulders'], equipment: 'Bodyweight', instructions: ['Grab the parallel bars and jump up to support your body.', 'Start with arms fully extended.', 'Lower your body by bending your elbows.', 'Lean forward slightly to engage chest, or stay upright for triceps.', 'Lower until your shoulders are below your elbows.', 'Push back up to the starting position by extending your arms.'] },
  { id: '30', name: 'Dumbbell Fly', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Dumbbell', instructions: ['Lie flat on a bench holding dumbbells above your chest.', 'Keep a slight bend in your elbows.', 'Lower the dumbbells out to the sides in an arc motion.', 'Lower until you feel a stretch in your chest.', 'Bring the dumbbells back together above your chest.', 'Squeeze your chest at the top of the movement.'] },
  { id: '31', name: 'Dumbbell Press', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Dumbbell', instructions: ['Lie flat on a bench with dumbbells at chest level.', 'Plant your feet firmly on the floor.', 'Press the dumbbells up until arms are extended.', 'Keep the dumbbells aligned over your chest.', 'Lower the dumbbells slowly to chest level.', 'Maintain control throughout the entire movement.'] },
  { id: '32', name: 'Face Pull', muscleGroup: 'Shoulders', secondaryMuscles: ['Upper Back', 'Traps'], equipment: 'Cable', instructions: ['Attach a rope to a cable pulley at upper chest height.', 'Grab the rope with both hands, palms facing each other.', 'Step back to create tension in the cable.', 'Pull the rope toward your face, separating your hands.', 'Pull until your hands are beside your ears.', 'Slowly return to the starting position.'] },
  { id: '33', name: 'Front Raise (Dumbbell)', muscleGroup: 'Shoulders', equipment: 'Dumbbell', instructions: ['Stand with feet shoulder-width apart, dumbbells in front of thighs.', 'Keep your arms straight with a slight bend in elbows.', 'Raise the dumbbells in front of you to shoulder height.', 'Keep your core engaged and torso still.', 'Hold briefly at the top.', 'Lower the dumbbells back down with control.'] },
  { id: '34', name: 'Front Raise (Cable)', muscleGroup: 'Shoulders', equipment: 'Cable', instructions: ['Stand facing away from a low cable pulley, handle in hand.', 'Start with the handle at your thighs, arm extended.', 'Raise the handle in front of you to shoulder height.', 'Keep a slight bend in your elbow.', 'Hold briefly at the top.', 'Lower back down with control.'] },
  { id: '35', name: 'Goblet Squat', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Dumbbell', instructions: ['Hold a dumbbell vertically against your chest with both hands.', 'Stand with feet slightly wider than shoulder-width apart.', 'Keep your chest up and core engaged.', 'Lower your body by bending your knees and hips.', 'Descend until your thighs are parallel to the floor.', 'Push through your heels to return to the starting position.'] },
  { id: '36', name: 'Good Morning', muscleGroup: 'Hamstrings', secondaryMuscles: ['Lower Back', 'Glutes'], equipment: 'Barbell', instructions: ['Place a barbell across your shoulders behind your neck.', 'Stand with feet shoulder-width apart, knees slightly bent.', 'Keep your back straight and core engaged.', 'Hinge at the hips, pushing your glutes back.', 'Lower your torso until nearly parallel to the floor.', 'Drive your hips forward to return to the starting position.'] },
  { id: '37', name: 'Hack Squat (Machine)', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Machine', instructions: ['Position yourself on the hack squat machine with back against the pad.', 'Place feet shoulder-width apart on the platform.', 'Release the safety handles.', 'Lower your body by bending your knees.', 'Descend until thighs are parallel to the platform.', 'Push through your heels to return to the starting position.'] },
  { id: '38', name: 'Hammer Curl', muscleGroup: 'Biceps', secondaryMuscles: ['Forearms'], equipment: 'Dumbbell', hasVideoDetection: true, instructions: ['Stand with feet shoulder-width apart, dumbbells at your sides.', 'Keep your palms facing your torso (neutral grip).', 'Keep your elbows close to your body.', 'Curl the weights up toward your shoulders.', 'Squeeze your biceps at the top.', 'Lower the dumbbells back down with control.'] },
  { id: '39', name: 'Hanging Leg Raise', muscleGroup: 'Abdominals', secondaryMuscles: ['Hip Flexors'], equipment: 'Bodyweight', instructions: ['Hang from a pull-up bar with arms fully extended.', 'Keep your legs together and core engaged.', 'Raise your legs by flexing your hips.', 'Lift until your thighs are parallel to the ground or higher.', 'Hold briefly at the top.', 'Lower your legs back down with control.'] },
  { id: '40', name: 'Hip Thrust (Barbell)', muscleGroup: 'Glutes', secondaryMuscles: ['Hamstrings', 'Quadriceps'], equipment: 'Barbell', instructions: ['Sit on the ground with your upper back against a bench.', 'Roll a barbell over your hips, use a pad for comfort.', 'Plant your feet flat on the floor, knees bent.', 'Drive through your heels and thrust your hips upward.', 'Squeeze your glutes at the top.', 'Lower your hips back down with control.'] },
  { id: '41', name: 'Hip Thrust (Smith Machine)', muscleGroup: 'Glutes', secondaryMuscles: ['Hamstrings', 'Quadriceps'], equipment: 'Smith Machine', instructions: ['Position a bench perpendicular to the Smith machine bar.', 'Sit with your upper back against the bench, bar over your hips.', 'Plant your feet flat on the floor, knees bent.', 'Unrack the bar and thrust your hips upward.', 'Squeeze your glutes at the top.', 'Lower your hips back down with control.'] },
  { id: '42', name: 'Incline Bench Press (Barbell)', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders', 'Triceps'], equipment: 'Barbell', instructions: ['Set an adjustable bench to a 30-45 degree incline.', 'Lie back with feet flat on the floor.', 'Grip the barbell slightly wider than shoulder width.', 'Unrack the bar and position it above your upper chest.', 'Lower the bar to your upper chest.', 'Press the bar back up explosively to the starting position.'] },
  { id: '43', name: 'Incline Bench Press (Smith Machine)', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders', 'Triceps'], equipment: 'Smith Machine', instructions: ['Set a bench at 30-45 degrees under the Smith machine bar.', 'Lie back and grip the bar slightly wider than shoulder width.', 'Unrack the bar and position it above your upper chest.', 'Lower the bar to your upper chest with control.', 'Press the bar back up explosively.', 'Keep your feet flat and back against the bench.'] },
  { id: '44', name: 'Incline Dumbbell Curl', muscleGroup: 'Biceps', equipment: 'Dumbbell', hasVideoDetection: true, instructions: ['Set an adjustable bench to a 45-degree angle.', 'Sit back with dumbbells hanging at arm\'s length.', 'Keep your elbows close to your torso.', 'Curl the weights up toward your shoulders.', 'Keep your upper arms stationary.', 'Lower the dumbbells back down with control.'] },
  { id: '45', name: 'Kettlebell Swing', muscleGroup: 'Full Body', secondaryMuscles: ['Glutes', 'Hamstrings', 'Shoulders'], equipment: 'Kettlebell', instructions: ['Stand with feet shoulder-width apart, kettlebell on the ground.', 'Hinge at the hips and grip the kettlebell with both hands.', 'Swing the kettlebell back between your legs.', 'Explosively drive your hips forward, swinging the kettlebell up.', 'Let the kettlebell rise to chest or eye level.', 'Control the descent and repeat the swing.'] },
  { id: '46', name: 'Lat Pulldown', muscleGroup: 'Lats', secondaryMuscles: ['Biceps', 'Upper Back'], equipment: 'Cable', instructions: ['Sit at a lat pulldown machine and grab the bar wider than shoulder width.', 'Keep your torso upright with a slight lean back.', 'Pull the bar down to your upper chest.', 'Squeeze your shoulder blades together.', 'Focus on pulling with your back, not your arms.', 'Slowly return the bar to the starting position.'] },
  { id: '47', name: 'Lateral Raise (Dumbbell)', muscleGroup: 'Shoulders', equipment: 'Dumbbell', instructions: ['Stand with feet shoulder-width apart, dumbbells at your sides.', 'Keep a slight bend in your elbows.', 'Raise the dumbbells out to the sides.', 'Lift until your arms are parallel to the floor.', 'Keep your palms facing down at the top.', 'Lower the dumbbells back down with control.'] },
  { id: '48', name: 'Lateral Raise (Cable)', muscleGroup: 'Shoulders', equipment: 'Cable', instructions: ['Stand sideways to a low cable pulley, handle in outside hand.', 'Keep a slight bend in your elbow.', 'Raise the handle out to the side.', 'Lift until your arm is parallel to the floor.', 'Keep tension in your shoulder throughout.', 'Lower the handle back down with control.'] },
  { id: '49', name: 'Leg Curl (Machine)', muscleGroup: 'Hamstrings', equipment: 'Machine', instructions: ['Lie face down on the leg curl machine.', 'Position your ankles under the padded lever.', 'Grip the handles for stability.', 'Curl your legs up toward your glutes.', 'Squeeze your hamstrings at the top.', 'Lower the weight back down with control.'] },
  { id: '50', name: 'Leg Extension (Machine)', muscleGroup: 'Quadriceps', equipment: 'Machine', instructions: ['Sit on the leg extension machine with back against the pad.', 'Position your ankles under the padded lever.', 'Grip the handles on the sides.', 'Extend your legs until they are straight.', 'Squeeze your quads at the top.', 'Lower the weight back down with control.'] },
  { id: '51', name: 'Leg Press (Machine)', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Machine', instructions: ['Sit in the leg press machine with back against the pad.', 'Place feet shoulder-width apart on the platform.', 'Release the safety handles.', 'Lower the platform by bending your knees.', 'Lower until your knees are at 90 degrees.', 'Push through your heels to extend your legs.'] },
  { id: '52', name: 'Lunge', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Bodyweight', instructions: ['Stand with feet together, hands on hips or at sides.', 'Step forward with one leg into a lunge position.', 'Lower your hips until both knees are at 90 degrees.', 'Keep your front knee behind your toes.', 'Push through your front heel to return to start.', 'Repeat with the opposite leg.'] },
  { id: '53', name: 'Lunge (Smith Machine)', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Smith Machine', instructions: ['Position the Smith machine bar across your shoulders.', 'Unrack the bar and step forward with one leg.', 'Lower your hips until both knees are at 90 degrees.', 'Keep your torso upright and front knee behind toes.', 'Push through your front heel to return to start.', 'Alternate legs or complete all reps on one side.'] },
  { id: '54', name: 'Mountain Climbers', muscleGroup: 'Cardio', secondaryMuscles: ['Core', 'Shoulders'], equipment: 'Bodyweight', instructions: ['Start in a push-up position with arms extended.', 'Bring one knee toward your chest.', 'Quickly switch legs, extending the bent leg back.', 'Continue alternating legs in a running motion.', 'Keep your core engaged and hips level.', 'Maintain a steady, quick pace throughout.'] },
  { id: '55', name: 'Overhead Press (Barbell)', muscleGroup: 'Shoulders', secondaryMuscles: ['Triceps', 'Upper Chest'], equipment: 'Barbell', instructions: ['Stand with feet shoulder-width apart, barbell at shoulder height.', 'Grip the bar just outside shoulder width.', 'Press the bar straight up overhead.', 'Lock out your arms at the top.', 'Keep your core engaged and avoid leaning back.', 'Lower the bar back to shoulder height with control.'] },
  { id: '56', name: 'Overhead Press (Smith Machine)', muscleGroup: 'Shoulders', secondaryMuscles: ['Triceps', 'Upper Chest'], equipment: 'Smith Machine', instructions: ['Stand with feet shoulder-width apart under the Smith machine bar.', 'Grip the bar just outside shoulder width at shoulder height.', 'Unrack the bar and press it straight up overhead.', 'Lock out your arms at the top.', 'Keep your core engaged throughout.', 'Lower the bar back to shoulder height with control.'] },
  { id: '57', name: 'Pendlay Row', muscleGroup: 'Upper Back', secondaryMuscles: ['Lats', 'Biceps'], equipment: 'Barbell', instructions: ['Stand with feet hip-width apart, barbell on the floor.', 'Bend at the hips until torso is parallel to the floor.', 'Grip the bar with hands just outside your legs.', 'Pull the bar explosively to your lower chest.', 'Let the bar touch the floor between each rep.', 'Keep your back flat throughout the movement.'] },
  { id: '58', name: 'Plank', muscleGroup: 'Abdominals', secondaryMuscles: ['Lower Back', 'Shoulders'], equipment: 'Bodyweight', instructions: ['Start in a push-up position on your forearms.', 'Keep your elbows directly under your shoulders.', 'Maintain a straight line from head to heels.', 'Engage your core and squeeze your glutes.', 'Keep your neck neutral by looking at the floor.', 'Hold this position for the desired duration.'] },
  { id: '59', name: 'Preacher Curl (Machine)', muscleGroup: 'Biceps', equipment: 'Machine', instructions: ['Sit at the preacher curl machine and adjust the seat.', 'Position your upper arms on the angled pad.', 'Grip the handles with an underhand grip.', 'Curl the handles up toward your shoulders.', 'Squeeze your biceps at the top.', 'Lower the handles back down with control.'] },
  { id: '60', name: 'Pull Up', muscleGroup: 'Lats', secondaryMuscles: ['Biceps', 'Upper Back'], equipment: 'Bodyweight', instructions: ['Hang from a pull-up bar with an overhand grip, hands slightly wider than shoulder width.', 'Start with arms fully extended.', 'Pull yourself up by driving your elbows down.', 'Continue until your chin is above the bar.', 'Squeeze your back at the top.', 'Lower yourself with control to the starting position.'] },
  { id: '61', name: 'Push Up', muscleGroup: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'], equipment: 'Bodyweight', hasVideoDetection: true, instructions: ['Get down on all fours.', 'Extend your body into a push-up position. Have your hands flat on the floor, fingertips rotated slightly out, and shoulder blades retracted.', 'Have your legs straight and your toes supporting your lower body. Your ankles, knees, hips, and shoulders should be in a straight line.', 'Take a breath and lower yourself by bending your elbows.', 'Descend as low as possible—ideally, until your face is an inch or two from the floor.', 'Hold the bottom position for a moment and press yourself back to the top as you exhale.'] },
  { id: '62', name: 'Romanian Deadlift (Barbell)', muscleGroup: 'Hamstrings', secondaryMuscles: ['Glutes', 'Lower Back'], equipment: 'Barbell', instructions: ['Stand with feet hip-width apart, holding a barbell at hip level.', 'Keep a slight bend in your knees.', 'Push your hips back as you lower the bar down your legs.', 'Keep the bar close to your body throughout.', 'Lower until you feel a stretch in your hamstrings.', 'Drive your hips forward to return to the starting position.'] },
  { id: '63', name: 'Romanian Deadlift (Smith Machine)', muscleGroup: 'Hamstrings', secondaryMuscles: ['Glutes', 'Lower Back'], equipment: 'Smith Machine', instructions: ['Stand with feet hip-width apart, bar at hip level.', 'Unrack the bar and keep a slight bend in your knees.', 'Push your hips back as you lower the bar.', 'Keep the bar close to your body.', 'Lower until you feel a stretch in your hamstrings.', 'Drive your hips forward to return to start.'] },
  { id: '64', name: 'Rowing Machine', muscleGroup: 'Cardio', secondaryMuscles: ['Back', 'Legs'], equipment: 'Machine', instructions: ['Sit on the rowing machine and secure your feet in the straps.', 'Grab the handle with both hands.', 'Start with legs extended, leaning slightly back.', 'Pull the handle toward your chest while bending your knees.', 'Push back with your legs and extend your arms.', 'Maintain a smooth, continuous rhythm.'] },
  { id: '65', name: 'Russian Twist', muscleGroup: 'Abdominals', secondaryMuscles: ['Obliques'], equipment: 'Bodyweight', instructions: ['Sit on the floor with knees bent, feet off the ground.', 'Lean back slightly, keeping your back straight.', 'Clasp your hands together or hold a weight.', 'Rotate your torso to the right, touching the ground beside you.', 'Rotate to the left side.', 'Continue alternating sides with controlled movements.'] },
  { id: '66', name: 'Seated Row (Cable)', muscleGroup: 'Upper Back', secondaryMuscles: ['Lats', 'Biceps'], equipment: 'Cable', instructions: ['Sit at a cable row station with feet on the platform.', 'Grab the handle with both hands, arms extended.', 'Keep your back straight and chest up.', 'Pull the handle toward your abdomen.', 'Squeeze your shoulder blades together at the back.', 'Slowly extend your arms back to the starting position.'] },
  { id: '67', name: 'Shoulder Press (Machine)', muscleGroup: 'Shoulders', secondaryMuscles: ['Triceps'], equipment: 'Machine', instructions: ['Sit at the shoulder press machine with back against the pad.', 'Adjust the seat so handles are at shoulder height.', 'Grip the handles with both hands.', 'Press the handles straight up overhead.', 'Extend your arms fully at the top.', 'Lower the handles back to shoulder height with control.'] },
  { id: '68', name: 'Shrug (Dumbbell)', muscleGroup: 'Traps', equipment: 'Dumbbell', instructions: ['Stand with feet shoulder-width apart, dumbbells at your sides.', 'Keep your arms straight.', 'Elevate your shoulders toward your ears.', 'Squeeze your traps at the top.', 'Hold briefly.', 'Lower your shoulders back down with control.'] },
  { id: '69', name: 'Shrug (Smith Machine)', muscleGroup: 'Traps', equipment: 'Smith Machine', instructions: ['Stand with feet shoulder-width apart, bar at arm\'s length.', 'Grip the bar slightly wider than shoulder width.', 'Keep your arms straight.', 'Elevate your shoulders toward your ears.', 'Squeeze your traps at the top.', 'Lower your shoulders back down with control.'] },
  { id: '70', name: 'Side Plank', muscleGroup: 'Abdominals', secondaryMuscles: ['Obliques'], equipment: 'Bodyweight', instructions: ['Lie on your side with forearm on the ground, elbow under shoulder.', 'Stack your feet or place one in front of the other.', 'Lift your hips off the ground.', 'Maintain a straight line from head to feet.', 'Keep your core engaged.', 'Hold this position for the desired duration.'] },
  { id: '71', name: 'Sit Up', muscleGroup: 'Abdominals', secondaryMuscles: ['Hip Flexors'], equipment: 'Bodyweight', instructions: ['Lie on your back with knees bent, feet flat on floor.', 'Place your hands behind your head or across your chest.', 'Engage your core and lift your entire torso off the ground.', 'Come up to a sitting position.', 'Lower yourself back down with control.', 'Keep your feet planted throughout the movement.'] },
  { id: '72', name: 'Skull Crusher', muscleGroup: 'Triceps', equipment: 'Barbell', instructions: ['Lie flat on a bench holding a barbell above your chest.', 'Keep your upper arms stationary and perpendicular to the floor.', 'Lower the bar toward your forehead by bending your elbows.', 'Keep your upper arms still.', 'Extend your arms back to the starting position.', 'Focus on using only your triceps.'] },
  { id: '73', name: 'Snatch', muscleGroup: 'Full Body', secondaryMuscles: ['Shoulders', 'Traps', 'Quadriceps'], equipment: 'Barbell', instructions: ['Stand with feet hip-width apart, barbell over mid-foot.', 'Grip the bar with a wide grip.', 'Pull the bar explosively off the floor.', 'As the bar reaches chest height, drop under it.', 'Catch the bar overhead with arms locked.', 'Stand up fully with the bar overhead.'] },
  { id: '74', name: 'Squat (Barbell)', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Barbell', hasVideoDetection: true, instructions: ['Position the barbell across your upper back and shoulders.', 'Stand with feet shoulder-width apart.', 'Keep your chest up and core engaged.', 'Lower your body by bending your knees and hips.', 'Descend until thighs are parallel to the floor or lower.', 'Drive through your heels to return to standing.'] },
  { id: '75', name: 'Squat (Smith Machine)', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Smith Machine', hasVideoDetection: true, instructions: ['Position yourself under the Smith machine bar.', 'Place the bar across your upper back and shoulders.', 'Unrack the bar and stand with feet shoulder-width apart.', 'Lower your body by bending your knees and hips.', 'Descend until thighs are parallel to the floor.', 'Drive through your heels to return to standing.'] },
  { id: '76', name: 'Step Up', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Bodyweight', instructions: ['Stand facing a sturdy box or bench.', 'Place one foot flat on the elevated surface.', 'Push through the elevated foot to lift your body up.', 'Step up until both feet are on the platform.', 'Step back down with the opposite foot first.', 'Repeat, alternating the leading leg.'] },
  { id: '77', name: 'Tricep Dip', muscleGroup: 'Triceps', secondaryMuscles: ['Chest', 'Shoulders'], equipment: 'Bodyweight', instructions: ['Sit on the edge of a bench, hands gripping the edge beside your hips.', 'Extend your legs out in front of you.', 'Slide your hips off the bench, supporting yourself with your arms.', 'Lower your body by bending your elbows to 90 degrees.', 'Keep your elbows pointing back, not out to the sides.', 'Push back up to the starting position.'] },
  { id: '78', name: 'Tricep Extension (Cable)', muscleGroup: 'Triceps', equipment: 'Cable', instructions: ['Attach a rope or bar to a high cable pulley.', 'Grip the attachment with both hands overhead.', 'Step forward slightly, arms extended overhead.', 'Lower the attachment behind your head by bending your elbows.', 'Keep your upper arms stationary.', 'Extend your arms back to the starting position.'] },
  { id: '79', name: 'Tricep Pushdown', muscleGroup: 'Triceps', equipment: 'Cable', instructions: ['Stand facing a high cable pulley with a bar or rope attached.', 'Grip the attachment with palms facing down.', 'Keep your elbows close to your sides.', 'Push the attachment down until your arms are fully extended.', 'Squeeze your triceps at the bottom.', 'Slowly return to the starting position.'] },
  { id: '80', name: 'Upright Row (Barbell)', muscleGroup: 'Traps', secondaryMuscles: ['Shoulders'], equipment: 'Barbell', instructions: ['Stand with feet shoulder-width apart, barbell at thigh level.', 'Grip the bar with hands closer than shoulder width.', 'Pull the bar straight up toward your chin.', 'Keep the bar close to your body.', 'Raise your elbows high and out to the sides.', 'Lower the bar back down with control.'] },
  { id: '81', name: 'Upright Row (Smith Machine)', muscleGroup: 'Traps', secondaryMuscles: ['Shoulders'], equipment: 'Smith Machine', instructions: ['Stand with feet shoulder-width apart, bar at thigh level.', 'Grip the bar with hands closer than shoulder width.', 'Unrack the bar and pull it straight up toward your chin.', 'Keep the bar close to your body.', 'Raise your elbows high and out to the sides.', 'Lower the bar back down with control.'] },
  { id: '82', name: 'Walking Lunge', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Bodyweight', instructions: ['Stand tall with feet together.', 'Step forward with one leg into a lunge position.', 'Lower your hips until both knees are at 90 degrees.', 'Push off the back foot and bring it forward.', 'Step into the next lunge with the opposite leg.', 'Continue walking forward with alternating lunges.'] },
  { id: '83', name: 'Wall Sit', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes'], equipment: 'Bodyweight', instructions: ['Stand with your back against a wall.', 'Slide down until your thighs are parallel to the floor.', 'Keep your knees directly above your ankles.', 'Your back should be flat against the wall.', 'Hold this position for the desired duration.', 'Keep your core engaged throughout.'] },
  { id: '84', name: 'Seated Leg Press (Machine)', muscleGroup: 'Quadriceps', secondaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Machine', instructions: ['Sit in the leg press machine with back against the pad.', 'Place feet shoulder-width apart on the platform.', 'Release the safety handles.', 'Lower the platform by bending your knees toward your chest.', 'Push through your heels to extend your legs.', 'Do not lock your knees at full extension.'] },
  { id: '85', name: 'Chest Fly (Pec Deck)', muscleGroup: 'Chest', secondaryMuscles: ['Shoulders'], equipment: 'Machine', instructions: ['Sit at the pec deck machine with back against the pad.', 'Grip the handles with arms extended to the sides.', 'Keep a slight bend in your elbows.', 'Bring the handles together in front of your chest.', 'Squeeze your chest at the peak contraction.', 'Slowly return to the starting position.'] },
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
  const [selectedStat, setSelectedStat] = useState<'bestSet' | 'heaviestWeight' | 'estimated1RM' | null>(null)
  
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
  
  // Calculate heaviest weight (placeholder for now)
  const heaviestWeight = null // Will be implemented when weight data is available
  
  // Calculate estimated 1RM (using Brzycki formula: weight / (1.0278 - 0.0278 × reps))
  const estimated1RM = null // Will be implemented when weight data is available
  
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
                </div>
              </div>
              
              {/* Personal Records */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏆</span>
                  <span className="text-white font-semibold">Personal Records</span>
                </div>
                
                <div className="border-t border-dark-700">
                  <button 
                    onClick={() => setSelectedStat(selectedStat === 'bestSet' ? null : 'bestSet')}
                    className="w-full flex justify-between py-3 border-b border-dark-700 hover:bg-dark-700 transition-colors"
                  >
                    <span className="text-white">Best Set</span>
                    <span className="text-gray-400">{bestReps ? `${bestReps} reps` : '-'}</span>
                  </button>
                  
                  {selectedStat === 'bestSet' && exerciseWorkouts.length > 0 && (
                    <div className="px-4 py-4 bg-dark-800 border-b border-dark-700">
                      <h4 className="text-white text-sm font-medium mb-3">Best Set History</h4>
                      <div className="space-y-2">
                        {exerciseWorkouts.slice(0, 5).map((workout, index) => (
                          <div key={workout.id || index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">
                              {new Date(workout.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-white font-medium">{workout.repCount} reps</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setSelectedStat(selectedStat === 'heaviestWeight' ? null : 'heaviestWeight')}
                    className="w-full flex justify-between py-3 border-b border-dark-700 hover:bg-dark-700 transition-colors"
                  >
                    <span className="text-white">Heaviest Weight</span>
                    <span className="text-gray-400">{heaviestWeight ? `${heaviestWeight} lbs` : '-'}</span>
                  </button>
                  
                  {selectedStat === 'heaviestWeight' && (
                    <div className="px-4 py-4 bg-dark-800 border-b border-dark-700">
                      <p className="text-gray-400 text-sm">Weight tracking coming soon</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setSelectedStat(selectedStat === 'estimated1RM' ? null : 'estimated1RM')}
                    className="w-full flex justify-between py-3 hover:bg-dark-700 transition-colors"
                  >
                    <span className="text-white">Estimated 1RM</span>
                    <span className="text-gray-400">{estimated1RM ? `${estimated1RM} lbs` : '-'}</span>
                  </button>
                  
                  {selectedStat === 'estimated1RM' && (
                    <div className="px-4 py-4 bg-dark-800">
                      <p className="text-gray-400 text-sm">1RM calculation available once weight data is logged</p>
                    </div>
                  )}
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
                    
                    <div className="mb-2">
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
