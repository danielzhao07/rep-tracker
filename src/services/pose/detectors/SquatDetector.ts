import { BaseDetector } from './BaseDetector'
import { calculateAngle } from '../utils/angleCalculation'
import { getLandmark, getBestSide } from '../utils/landmarkUtils'
import { SQUAT_THRESHOLDS, SQUAT_DIFFICULTY_THRESHOLDS } from '@/utils/constants'
import { useWorkoutStore } from '@/store/workoutStore'
import type { Pose, RepCountResult } from '@/types'

/**
 * SquatDetector - Improved squat detection with:
 * - Multiple difficulty modes (Easy, 90°, ATG)
 * - Adaptive calibration based on user's standing position
 * - Multiple detection methods (knee angle, hip angle, hip drop)
 * - Better hysteresis to prevent flickering
 * - Smoother angle tracking
 */
export class SquatDetector extends BaseDetector {
  readonly keyLandmarks = [
    'LEFT_HIP', 'RIGHT_HIP',
    'LEFT_KNEE', 'RIGHT_KNEE',
    'LEFT_ANKLE', 'RIGHT_ANKLE',
    'LEFT_SHOULDER', 'RIGHT_SHOULDER',
  ]

  private lastLogTime = 0
  private currentKneeAngle = 0
  private currentHipAngle = 0

  // Stage tracking: 'up' (standing) or 'down' (squatting)
  private stage: 'up' | 'down' | null = null

  // View tracking (locked after first rep to prevent mid-workout switching)
  private isFrontView = false
  private viewLocked = false

  // Debouncing
  private lastRepTime = 0

  // Multi-signal smoothing (knee angle, hip angle)
  private kneeAngleHistory: number[] = []
  private hipAngleHistory: number[] = []

  // Adaptive calibration
  private calibrationFrames = 0
  private standingKneeAngle: number | null = null
  private standingHipY: number | null = null
  private maxDepthKneeAngle: number | null = null
  private maxDepthHipY: number | null = null
  private isCalibrated = false

  // Position validation state (relaxed to not block good squats)
  private isInValidSquatPosition = false
  private positionValidationFailures = 0
  private readonly MAX_POSITION_FAILURES = 5  // More forgiving

  // Inactivity tracking
  private workoutStartTime = 0
  private lastRepOrStartTime = 0

  // Track deepest point in current rep for better detection
  private deepestKneeAngleThisRep: number | null = null
  private deepestHipYThisRep: number | null = null

  /**
   * Get current difficulty thresholds based on selected mode
   */
  private getDifficultyThresholds() {
    const { squatDifficulty } = useWorkoutStore.getState()
    return SQUAT_DIFFICULTY_THRESHOLDS[squatDifficulty]
  }

  getKneeAngle(): number {
    return this.currentKneeAngle
  }

  getHipAngle(): number {
    return this.currentHipAngle
  }

  reset(): void {
    super.reset()
    this.currentKneeAngle = 0
    this.currentHipAngle = 0
    this.stage = null
    this.lastRepTime = 0
    this.kneeAngleHistory = []
    this.hipAngleHistory = []
    this.isInValidSquatPosition = false
    this.positionValidationFailures = 0
    this.workoutStartTime = Date.now()
    this.lastRepOrStartTime = Date.now()
    // Reset calibration
    this.calibrationFrames = 0
    this.standingKneeAngle = null
    this.standingHipY = null
    this.maxDepthKneeAngle = null
    this.maxDepthHipY = null
    this.isCalibrated = false
    this.viewLocked = false
    this.deepestKneeAngleThisRep = null
    this.deepestHipYThisRep = null
  }

  /**
   * Smooth a value using history array
   */
  private smoothValue(history: number[], newValue: number, windowSize: number): number {
    history.push(newValue)
    if (history.length > windowSize) {
      history.shift()
    }
    // Use median for robustness against outliers
    const sorted = [...history].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  /**
   * Detect if user is facing front or side based on hip width
   */
  private detectViewOrientation(pose: Pose): boolean {
    // If view is already locked (after first rep), don't change it
    if (this.viewLocked) {
      return this.isFrontView
    }

    const leftHip = getLandmark(pose, 'LEFT_HIP')
    const rightHip = getLandmark(pose, 'RIGHT_HIP')
    const hipWidth = Math.abs(leftHip.x - rightHip.x)

    // Log hip width for debugging
    const now = Date.now()
    if (now - this.lastLogTime > 1000) {
      console.log(`[Squat] View detection - Hip width: ${(hipWidth * 100).toFixed(1)}% | Threshold: ${(SQUAT_THRESHOLDS.MIN_HIP_WIDTH_FRONT * 100).toFixed(1)}% | Front view: ${hipWidth > SQUAT_THRESHOLDS.MIN_HIP_WIDTH_FRONT}`)
    }

    // If hips are far apart horizontally, user is facing front
    return hipWidth > SQUAT_THRESHOLDS.MIN_HIP_WIDTH_FRONT
  }

  /**
   * Calculate hip Y position (normalized)
   */
  private getHipY(pose: Pose): number {
    const leftHip = getLandmark(pose, 'LEFT_HIP')
    const rightHip = getLandmark(pose, 'RIGHT_HIP')
    return (leftHip.y + rightHip.y) / 2
  }

  /**
   * Calculate hip drop from standing baseline
   * Positive value = hips have dropped (squatting)
   */
  private calculateHipDrop(pose: Pose): number {
    const currentHipY = this.getHipY(pose)

    // Wait for calibration to set the baseline
    if (this.standingHipY === null) {
      return 0
    }

    // Return how much hips have dropped (positive = dropped down)
    // In MediaPipe: larger Y = lower in frame = squatting
    return currentHipY - this.standingHipY
  }

  /**
   * Calculate knee angle with smoothing (for side view)
   * Uses the leg with better visibility
   */
  private calculateKneeAngle(pose: Pose): { angle: number; rawAngle: number; side: 'left' | 'right' } {
    const leftHip = getLandmark(pose, 'LEFT_HIP')
    const leftKnee = getLandmark(pose, 'LEFT_KNEE')
    const leftAnkle = getLandmark(pose, 'LEFT_ANKLE')

    const rightHip = getLandmark(pose, 'RIGHT_HIP')
    const rightKnee = getLandmark(pose, 'RIGHT_KNEE')
    const rightAnkle = getLandmark(pose, 'RIGHT_ANKLE')

    const leftVisibility = Math.min(
      leftHip.visibility,
      leftKnee.visibility,
      leftAnkle.visibility
    )
    const rightVisibility = Math.min(
      rightHip.visibility,
      rightKnee.visibility,
      rightAnkle.visibility
    )

    let rawAngle: number
    let side: 'left' | 'right'

    if (leftVisibility >= rightVisibility) {
      rawAngle = calculateAngle(leftHip, leftKnee, leftAnkle)
      side = 'left'
    } else {
      rawAngle = calculateAngle(rightHip, rightKnee, rightAnkle)
      side = 'right'
    }

    // Use median-based smoothing for robustness
    const smoothedAngle = this.smoothValue(
      this.kneeAngleHistory,
      rawAngle,
      SQUAT_THRESHOLDS.ANGLE_SMOOTHING_WINDOW
    )

    return { angle: smoothedAngle, rawAngle, side }
  }

  /**
   * Calculate hip angle (shoulder-hip-knee) for backup detection
   */
  private calculateHipAngle(pose: Pose): { angle: number; rawAngle: number } {
    const side = getBestSide(pose)
    const prefix = side === 'left' ? 'LEFT' : 'RIGHT'

    const shoulder = getLandmark(pose, `${prefix}_SHOULDER`)
    const hip = getLandmark(pose, `${prefix}_HIP`)
    const knee = getLandmark(pose, `${prefix}_KNEE`)

    const rawAngle = calculateAngle(shoulder, hip, knee)
    const smoothedAngle = this.smoothValue(
      this.hipAngleHistory,
      rawAngle,
      SQUAT_THRESHOLDS.ANGLE_SMOOTHING_WINDOW
    )

    return { angle: smoothedAngle, rawAngle }
  }

  /**
   * Check if both legs are squatting together (relaxed check)
   */
  private areBothLegsSquatting(pose: Pose): boolean {
    const leftHip = getLandmark(pose, 'LEFT_HIP')
    const leftKnee = getLandmark(pose, 'LEFT_KNEE')
    const leftAnkle = getLandmark(pose, 'LEFT_ANKLE')

    const rightHip = getLandmark(pose, 'RIGHT_HIP')
    const rightKnee = getLandmark(pose, 'RIGHT_KNEE')
    const rightAnkle = getLandmark(pose, 'RIGHT_ANKLE')

    // Only check if both legs are visible enough
    const leftVis = Math.min(leftKnee.visibility, leftAnkle.visibility)
    const rightVis = Math.min(rightKnee.visibility, rightAnkle.visibility)

    // If one leg is not visible well, assume they're both squatting
    if (leftVis < 0.3 || rightVis < 0.3) {
      return true
    }

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle)
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle)

    const angleDiff = Math.abs(leftKneeAngle - rightKneeAngle)

    return angleDiff < SQUAT_THRESHOLDS.MAX_KNEE_ANGLE_DIFF
  }

  /**
   * Validate squat position (relaxed to not block good squats)
   */
  private validateSquatPosition(pose: Pose): { isValid: boolean; reasons: string[] } {
    const reasons: string[] = []

    const leftKnee = getLandmark(pose, 'LEFT_KNEE')
    const rightKnee = getLandmark(pose, 'RIGHT_KNEE')

    const kneeVisibility = Math.max(leftKnee.visibility, rightKnee.visibility)

    // Check torso angle (shouldn't lean too far forward) - only when in down position
    const side = getBestSide(pose)
    const prefix = side === 'left' ? 'LEFT' : 'RIGHT'
    const shoulder = getLandmark(pose, `${prefix}_SHOULDER`)
    const hip = getLandmark(pose, `${prefix}_HIP`)
    const knee = getLandmark(pose, `${prefix}_KNEE`)

    const torsoAngle = calculateAngle(shoulder, hip, knee)

    if (kneeVisibility < SQUAT_THRESHOLDS.MIN_KNEE_VISIBILITY) {
      reasons.push('Keep knees visible in frame')
    }

    // Only warn about torso lean when squatting deep
    if (torsoAngle < SQUAT_THRESHOLDS.MAX_TORSO_LEAN && this.stage === 'down') {
      reasons.push('Try to keep chest up')
    }

    return { isValid: reasons.length === 0, reasons }
  }

  /**
   * Perform calibration during first frames to establish baseline
   */
  private calibrate(pose: Pose): void {
      if (this.isCalibrated) return

    this.calibrationFrames++
    const hipY = this.getHipY(pose)
    const { angle: kneeAngle } = this.calculateKneeAngle(pose)

    // Initialize on first frame
    if (this.standingHipY === null) {
      this.standingHipY = hipY
      this.standingKneeAngle = kneeAngle
    }

    // Log calibration progress
    if (this.calibrationFrames <= 5 || this.calibrationFrames % 10 === 0) {
      console.log(`[Squat] Calibrating frame ${this.calibrationFrames}/${SQUAT_THRESHOLDS.CALIBRATION_FRAMES} | Hip Y: ${(hipY * 100).toFixed(1)}% | Baseline: ${(this.standingHipY * 100).toFixed(1)}% | Knee: ${kneeAngle.toFixed(1)}`)
    }

    // In MediaPipe: Y=0 is top of image, Y=1 is bottom
    // Standing: hips are LOWER (smaller Y value, towards top)
    // Squatting: hips DROP (larger Y value, towards bottom)
    // We want the MINIMUM hipY (highest position = standing) as our baseline
    if (hipY < this.standingHipY) {
      this.standingHipY = hipY
      this.standingKneeAngle = kneeAngle
    }

    if (this.calibrationFrames >= SQUAT_THRESHOLDS.CALIBRATION_FRAMES) {
      this.isCalibrated = true
      console.log(`[Squat] Calibration complete:`)
      console.log(`   Standing knee angle: ${this.standingKneeAngle?.toFixed(1)}`)
      console.log(`   Standing hip Y: ${(this.standingHipY! * 100).toFixed(1)}% (lower = standing higher)`)
    }
  }

  /**
   * Rep detection logic for squats - IMPROVED VERSION
   * Uses multiple signals: knee angle, hip angle, hip drop
   * With adaptive calibration and better hysteresis
   */
  detectRepPhase(pose: Pose): RepCountResult {
    const now = Date.now()

    if (this.workoutStartTime === 0) {
      this.workoutStartTime = now
      this.lastRepOrStartTime = now
    }

    // Perform calibration during first frames
    this.calibrate(pose)

    // Validate position (relaxed, mainly for feedback)
    const positionValidation = this.validateSquatPosition(pose)

    if (!positionValidation.isValid) {
      this.positionValidationFailures++
      if (this.positionValidationFailures >= this.MAX_POSITION_FAILURES) {
        this.isInValidSquatPosition = false
      }
    } else {
      this.positionValidationFailures = 0
      this.isInValidSquatPosition = true
    }

    // Detect view orientation (will lock after first rep)
    this.isFrontView = this.detectViewOrientation(pose)

    const { score, feedback } = this.validateForm(pose)
    const quality = this.qualityFromScore(score)

    if (this.lastRepStartTime === 0) {
      this.lastRepStartTime = pose.timestamp
    }

    // Get all measurements
    const { angle: kneeAngle, rawAngle: rawKneeAngle, side } = this.calculateKneeAngle(pose)
    const { angle: hipAngle } = this.calculateHipAngle(pose)
    const currentHipY = this.getHipY(pose)
    const hipDrop = this.calculateHipDrop(pose)

    this.currentKneeAngle = kneeAngle
    this.currentHipAngle = hipAngle

    // Update max depth tracking
    if (this.deepestKneeAngleThisRep === null || kneeAngle < this.deepestKneeAngleThisRep) {
      this.deepestKneeAngleThisRep = kneeAngle
    }
    if (this.deepestHipYThisRep === null || currentHipY > this.deepestHipYThisRep) {
      this.deepestHipYThisRep = currentHipY
    }

    // Update adaptive thresholds based on max depth achieved
    if (this.maxDepthKneeAngle === null || kneeAngle < this.maxDepthKneeAngle) {
      this.maxDepthKneeAngle = kneeAngle
    }
    if (this.maxDepthHipY === null || currentHipY > this.maxDepthHipY) {
      this.maxDepthHipY = currentHipY
    }

    const timeSinceLastRep = now - this.lastRepTime
    const canCountRep = timeSinceLastRep > SQUAT_THRESHOLDS.REP_COOLDOWN_MS

    // Get difficulty-specific thresholds
    const difficultyThresholds = this.getDifficultyThresholds()

    // Calculate thresholds based on difficulty mode
    let upThreshold: number
    let downThreshold: number
    let downExitThreshold: number

    if (this.isFrontView) {
      // Front view: use hip drop with difficulty-specific thresholds
      downThreshold = difficultyThresholds.MIN_HIP_DROP_FRONT
      downExitThreshold = difficultyThresholds.MIN_HIP_DROP_FRONT_EXIT
      upThreshold = 0.02  // Very small - back to almost standing
    } else {
      // Side view: use knee angle with difficulty-specific thresholds
      upThreshold = SQUAT_THRESHOLDS.KNEE_ANGLE_STANDING
      downThreshold = difficultyThresholds.KNEE_ANGLE_SQUATTING
      downExitThreshold = difficultyThresholds.KNEE_ANGLE_SQUATTING_EXIT
    }

    // Determine current position with hysteresis
    let isUpPosition: boolean
    let isDownPosition: boolean

    if (this.isFrontView) {
      // Front view: hip drop
      if (this.stage === 'up') {
        isDownPosition = hipDrop > downThreshold
        isUpPosition = false  // Already up, can't go more up
      } else if (this.stage === 'down') {
        isUpPosition = hipDrop < upThreshold
        isDownPosition = hipDrop > downExitThreshold  // Stay down until clearly rising
      } else {
        // Initial state
        isUpPosition = hipDrop < upThreshold
        isDownPosition = hipDrop > downThreshold
      }
    } else {
      // Side view: knee angle (lower = more bent = down)
      if (this.stage === 'up') {
        isDownPosition = kneeAngle < downThreshold
        isUpPosition = false  // Already up
      } else if (this.stage === 'down') {
        isUpPosition = kneeAngle > upThreshold
        isDownPosition = kneeAngle < downExitThreshold  // Stay down until clearly rising
      } else {
        // Initial state
        isUpPosition = kneeAngle > upThreshold
        isDownPosition = kneeAngle < downThreshold
      }
    }

    // Debug logging
    if (now - this.lastLogTime > 300) {
      const positionStatus = this.isInValidSquatPosition ? 'OK' : 'WARN'
      const viewLabel = this.isFrontView ? 'FRONT' : 'SIDE'

      if (this.isFrontView) {
        console.log(`[Squat] [${viewLabel}] ${positionStatus} | HipY: ${(currentHipY * 100).toFixed(1)}% | Baseline: ${this.standingHipY ? (this.standingHipY * 100).toFixed(1) : 'N/A'}% | Drop: ${(hipDrop * 100).toFixed(1)}% | Stage: ${this.stage ?? 'null'} | Reps: ${this.repCount}`)
        console.log(`   DOWN threshold: >${(downThreshold * 100).toFixed(1)}% | UP threshold: <${(upThreshold * 100).toFixed(1)}% | isDown: ${isDownPosition} | isUp: ${isUpPosition}`)
      } else {
        console.log(`[Squat] [${viewLabel} - ${side}] ${positionStatus} | Knee: ${kneeAngle.toFixed(1)} (raw: ${rawKneeAngle.toFixed(1)}) | Hip: ${hipAngle.toFixed(1)} | Stage: ${this.stage ?? 'null'} | Reps: ${this.repCount}`)
        console.log(`   DOWN threshold: <${downThreshold.toFixed(0)} | UP threshold: >${upThreshold.toFixed(0)}`)
        if (this.maxDepthKneeAngle !== null) {
          console.log(`   Max depth seen: ${this.maxDepthKneeAngle.toFixed(1)} | Deepest this rep: ${this.deepestKneeAngleThisRep?.toFixed(1) ?? 'N/A'}`)
        }
      }
      this.lastLogTime = now
    }

    // Rep logic: Start at UP (standing), squat DOWN, stand back UP = 1 rep
    if (isUpPosition && this.stage !== 'up') {
      // Transitioning to UP position (standing)
      if (this.stage === 'down' && canCountRep) {
        // Verify we actually went deep enough
        let depthOk = true
        let depthInfo = ''

        if (this.isFrontView) {
          if (this.deepestHipYThisRep !== null && this.standingHipY !== null) {
            const actualDrop = this.deepestHipYThisRep - this.standingHipY
            // Use difficulty-specific threshold for validation
            depthOk = actualDrop >= difficultyThresholds.MIN_HIP_DROP_FRONT
            depthInfo = `${(actualDrop * 100).toFixed(1)}% (need ${(difficultyThresholds.MIN_HIP_DROP_FRONT * 100).toFixed(1)}%)`
          }
        } else {
          if (this.deepestKneeAngleThisRep !== null) {
            // Accept if they got close to threshold or within 15 degrees
            depthOk = this.deepestKneeAngleThisRep <= downThreshold + 15
            depthInfo = `${this.deepestKneeAngleThisRep.toFixed(1)}°`
          }
        }

        // Count rep - relaxed validation (only depth matters, form is just feedback)
        if (depthOk) {
          this.repCount++
          this.lastRepTime = now
          this.lastRepOrStartTime = now
          this.viewLocked = true  // Lock view after first successful rep

          const viewLabel = this.isFrontView ? 'FRONT' : 'SIDE'
          console.log(`[Squat] REP ${this.repCount} COMPLETED! [${viewLabel}] (depth: ${depthInfo})`)

          this.repHistory.push({
            number: this.repCount,
            startTime: this.lastRepStartTime,
            endTime: pose.timestamp,
            duration: pose.timestamp - this.lastRepStartTime,
            quality,
            formScore: score,
            feedback,
          })
          this.lastRepStartTime = pose.timestamp
        } else {
          console.log(`[Squat] REP REJECTED - Depth insufficient: ${depthInfo}`)
        }
      }

      this.stage = 'up'
      this.currentPhase = 'top'
      // Reset depth tracking for next rep
      this.deepestKneeAngleThisRep = null
      this.deepestHipYThisRep = null
    } else if (this.stage === 'up' && !isUpPosition && !isDownPosition) {
      // Transitioning down but not yet at bottom
      this.currentPhase = 'eccentric'
    }

    if (isDownPosition && this.stage !== 'down') {
      // Transitioning to DOWN position (squatting)
      const viewLabel = this.isFrontView ? 'FRONT' : 'SIDE'
      const depthValue = this.isFrontView ? `${(hipDrop * 100).toFixed(1)}%` : `${kneeAngle.toFixed(1)}`
      console.log(`[Squat] DOWN POSITION DETECTED [${viewLabel}] (${depthValue})`)
      this.stage = 'down'
      this.currentPhase = 'bottom'
    } else if (this.stage === 'down' && !isDownPosition && !isUpPosition) {
      // Rising but not yet at top
      this.currentPhase = 'concentric'
    }

    // Inactivity warning (just logging, doesn't block)
    const timeSinceLastRepOrStart = now - this.lastRepOrStartTime
    if (timeSinceLastRepOrStart > SQUAT_THRESHOLDS.INACTIVITY_WARNING_MS && this.repCount === 0) {
      if (now - this.lastLogTime > 5000) {
        console.log(`[Squat] No reps detected for ${Math.floor(timeSinceLastRepOrStart / 1000)}s - Current knee angle: ${kneeAngle.toFixed(0)}, Down threshold: ${downThreshold.toFixed(0)}`)
      }
    }

    return {
      count: this.repCount,
      phase: this.currentPhase,
      quality,
      feedback: positionValidation.isValid ? feedback : [...feedback, ...positionValidation.reasons],
    }
  }

  validateForm(pose: Pose): { score: number; feedback: string[] } {
    const side = getBestSide(pose)
    const prefix = side === 'left' ? 'LEFT' : 'RIGHT'

    const shoulder = getLandmark(pose, `${prefix}_SHOULDER`)
    const hip = getLandmark(pose, `${prefix}_HIP`)
    const knee = getLandmark(pose, `${prefix}_KNEE`)

    const torsoAngle = calculateAngle(shoulder, hip, knee)

    const feedback: string[] = []
    let score = 100

    // Only penalize torso lean when actually squatting
    if (torsoAngle < SQUAT_THRESHOLDS.MAX_TORSO_LEAN && this.stage === 'down') {
      score -= 25  // Reduced penalty
      feedback.push('Try to keep chest up')
    }

    const bothLegsSquatting = this.areBothLegsSquatting(pose)
    if (!bothLegsSquatting && this.stage === 'down') {
      score -= 20  // Reduced penalty
      feedback.push('Keep both legs even')
    }

    if (feedback.length === 0) {
      feedback.push('Good form!')
    }

    return { score: Math.max(0, score), feedback }
  }
}
