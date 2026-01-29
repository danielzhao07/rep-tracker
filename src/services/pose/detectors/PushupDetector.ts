import { BaseDetector } from './BaseDetector'
import { calculateAngle } from '../utils/angleCalculation'
import { getLandmark, getBestSide } from '../utils/landmarkUtils'
import { PUSHUP_THRESHOLDS } from '@/utils/constants'
import type { Pose, RepCountResult } from '@/types'

/**
 * PushupDetector - Adapted from working Python MediaPipe implementation
 * Uses simple 'up'/'down' stage logic like your Python rep_logic function
 */
export class PushupDetector extends BaseDetector {
  readonly keyLandmarks = [
    'LEFT_SHOULDER', 'RIGHT_SHOULDER',
    'LEFT_ELBOW', 'RIGHT_ELBOW',
    'LEFT_WRIST', 'RIGHT_WRIST',
    'LEFT_HIP', 'RIGHT_HIP',
  ]

  private lastLogTime = 0
  private currentElbowAngle = 0

  // Simple stage tracking like your Python code: 'down' or 'up'
  private stage: 'down' | 'up' | null = null

  // Debouncing to prevent rapid rep counting
  private lastRepTime = 0
  private readonly REP_COOLDOWN_MS = 600 // Minimum 600ms between reps (faster for consecutive reps)

  // Angle smoothing buffer
  private angleHistory: number[] = []
  private readonly ANGLE_SMOOTHING_WINDOW = 3

  // Body movement tracking (prevent arm-only cheating)
  private shoulderYAtTop: number | null = null
  private shoulderYAtBottom: number | null = null

  // Push-up position validation state
  private isInValidPushupPosition = false
  private positionValidationFailures = 0
  private readonly MAX_POSITION_FAILURES = 3 // Allow a few frames of invalid position before warning

  // Inactivity tracking
  private workoutStartTime = 0
  private lastRepOrStartTime = 0

  getElbowAngle(): number {
    return this.currentElbowAngle
  }

  reset(): void {
    super.reset()
    this.currentElbowAngle = 0
    this.stage = null
    this.lastRepTime = 0
    this.angleHistory = []
    this.isInValidPushupPosition = false
    this.positionValidationFailures = 0
    this.workoutStartTime = Date.now()
    this.lastRepOrStartTime = Date.now()
    this.shoulderYAtTop = null
    this.shoulderYAtBottom = null
  }

  /**
   * Calculate angle using the same approach as your Python angles.py
   * Gets coordinates from landmarks and calculates angle at the elbow
   * Applies smoothing to reduce jitter
   */
  private calculateElbowAngle(pose: Pose): { angle: number; side: 'left' | 'right' } {
    // Get landmarks for both sides
    const leftShoulder = getLandmark(pose, 'LEFT_SHOULDER')
    const leftElbow = getLandmark(pose, 'LEFT_ELBOW')
    const leftWrist = getLandmark(pose, 'LEFT_WRIST')

    const rightShoulder = getLandmark(pose, 'RIGHT_SHOULDER')
    const rightElbow = getLandmark(pose, 'RIGHT_ELBOW')
    const rightWrist = getLandmark(pose, 'RIGHT_WRIST')

    // Calculate visibility for each side
    const leftVisibility = Math.min(
      leftShoulder.visibility,
      leftElbow.visibility,
      leftWrist.visibility
    )
    const rightVisibility = Math.min(
      rightShoulder.visibility,
      rightElbow.visibility,
      rightWrist.visibility
    )

    // Use the side with better visibility (like your Python code choosing the best detection)
    let rawAngle: number
    let side: 'left' | 'right'

    if (leftVisibility >= rightVisibility) {
      rawAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
      side = 'left'
    } else {
      rawAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)
      side = 'right'
    }

    // Apply smoothing to reduce jitter
    this.angleHistory.push(rawAngle)
    if (this.angleHistory.length > this.ANGLE_SMOOTHING_WINDOW) {
      this.angleHistory.shift()
    }

    // Calculate smoothed angle (moving average)
    const smoothedAngle =
      this.angleHistory.reduce((sum, a) => sum + a, 0) / this.angleHistory.length

    return { angle: smoothedAngle, side }
  }

  /**
   * Check if both arms are moving together (not just one arm)
   */
  private areBothArmsMoving(pose: Pose): boolean {
    const leftShoulder = getLandmark(pose, 'LEFT_SHOULDER')
    const leftElbow = getLandmark(pose, 'LEFT_ELBOW')
    const leftWrist = getLandmark(pose, 'LEFT_WRIST')

    const rightShoulder = getLandmark(pose, 'RIGHT_SHOULDER')
    const rightElbow = getLandmark(pose, 'RIGHT_ELBOW')
    const rightWrist = getLandmark(pose, 'RIGHT_WRIST')

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)

    const angleDiff = Math.abs(leftElbowAngle - rightElbowAngle)

    return angleDiff < PUSHUP_THRESHOLDS.MAX_ELBOW_ANGLE_DIFF
  }

  /**
   * Validate push-up position: horizontal plank with straight legs
   * Prevents: sitting, standing, kneeling, knee push-ups
   */
  private validatePushupPosition(pose: Pose): { isValid: boolean; reasons: string[] } {
    const reasons: string[] = []

    // Get key landmarks
    const leftShoulder = getLandmark(pose, 'LEFT_SHOULDER')
    const rightShoulder = getLandmark(pose, 'RIGHT_SHOULDER')
    const leftHip = getLandmark(pose, 'LEFT_HIP')
    const rightHip = getLandmark(pose, 'RIGHT_HIP')
    const leftWrist = getLandmark(pose, 'LEFT_WRIST')
    const rightWrist = getLandmark(pose, 'RIGHT_WRIST')
    const leftKnee = getLandmark(pose, 'LEFT_KNEE')
    const rightKnee = getLandmark(pose, 'RIGHT_KNEE')
    const leftAnkle = getLandmark(pose, 'LEFT_ANKLE')
    const rightAnkle = getLandmark(pose, 'RIGHT_ANKLE')

    // Average positions for better stability
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2
    const avgHipY = (leftHip.y + rightHip.y) / 2
    const wristVisibility = Math.max(leftWrist.visibility, rightWrist.visibility)

    // Check 1: Shoulders and hips at similar heights (horizontal body)
    const shoulderHipYDiff = Math.abs(avgShoulderY - avgHipY)

    // Check 2: Knees should be relatively straight (prevent knee push-ups)
    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle)
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle)
    const kneeAngle = Math.max(leftKneeAngle, rightKneeAngle)

    // Debug logging
    const now = Date.now()
    if (now - this.lastLogTime > 1000) {
      console.log(`📐 Position Check:`)
      console.log(`   Wrist visibility: ${wristVisibility.toFixed(2)}`)
      console.log(`   Shoulder-Hip Y diff: ${shoulderHipYDiff.toFixed(3)} (max: ${PUSHUP_THRESHOLDS.MAX_SHOULDER_HIP_Y_DIFF})`)
      console.log(`   Knee angle: ${kneeAngle.toFixed(1)}° (min: ${PUSHUP_THRESHOLDS.MIN_KNEE_ANGLE}°)`)
    }

    // Validation checks
    if (wristVisibility < PUSHUP_THRESHOLDS.MIN_WRIST_VISIBILITY) {
      reasons.push('Keep hands visible in frame')
    }

    if (shoulderHipYDiff > PUSHUP_THRESHOLDS.MAX_SHOULDER_HIP_Y_DIFF) {
      reasons.push('Get into horizontal plank position')
    }

    if (kneeAngle < PUSHUP_THRESHOLDS.MIN_KNEE_ANGLE) {
      reasons.push('Straighten your legs - no knee push-ups')
    }

    return { isValid: reasons.length === 0, reasons }
  }

  /**
   * Rep detection logic adapted from your Python rep_logic function:
   *
   * def rep_logic(min, max, angle):
   *     if angle > max:  # arms extended = down position for pushups
   *         stage = 'down'
   *     if angle < min and stage == 'down':  # arms bent = up position
   *         stage = 'up'
   *         counter += 1
   *
   * For PUSH-UPS (vs curls):
   * - Arms EXTENDED (angle > 150): This is the "up" position (top of pushup)
   * - Arms BENT (angle < 90): This is the "down" position (bottom of pushup)
   *
   * Rep counts when: going from down → up (pushing back up)
   */
  detectRepPhase(pose: Pose): RepCountResult {
    const now = Date.now()

    // Initialize workout start time on first call
    if (this.workoutStartTime === 0) {
      this.workoutStartTime = now
      this.lastRepOrStartTime = now
    }

    // Validate position but be lenient
    const positionValidation = this.validatePushupPosition(pose)

    if (!positionValidation.isValid) {
      this.positionValidationFailures++

      // Only mark as invalid if we've had multiple consecutive failures
      if (this.positionValidationFailures >= this.MAX_POSITION_FAILURES) {
        this.isInValidPushupPosition = false
      }
    } else {
      // Valid position detected - reset failure counter
      this.positionValidationFailures = 0
      this.isInValidPushupPosition = true
    }

    // Log inactivity warning but DON'T block detection (this was the bug - blocking after inactivity)
    const timeSinceLastRepOrStart = now - this.lastRepOrStartTime
    if (timeSinceLastRepOrStart > PUSHUP_THRESHOLDS.INACTIVITY_WARNING_MS && this.repCount === 0) {
      if (now - this.lastLogTime > 2000) {
        const { angle } = this.calculateElbowAngle(pose)
        console.log(`⏱️ No reps detected for ${Math.floor(timeSinceLastRepOrStart / 1000)}s - Current angle: ${angle.toFixed(0)}°`)
      }
      // Continue with normal detection - don't block! This allows detection to start after inactivity
    }

    // Block detection if position is invalid AND we're past initial setup period
    // Allow 5 seconds of setup time to get into position without blocking
    const isInitialSetup = timeSinceLastRepOrStart < 5000 && this.repCount === 0

    if (!this.isInValidPushupPosition && this.positionValidationFailures >= this.MAX_POSITION_FAILURES && !isInitialSetup) {
      return {
        count: this.repCount,
        phase: 'start',
        quality: 'poor',
        feedback: ['⚠️ Get into push-up position:', ...positionValidation.reasons],
      }
    }

    const { angle, side } = this.calculateElbowAngle(pose)
    this.currentElbowAngle = angle

    const { score, feedback } = this.validateForm(pose)
    const quality = this.qualityFromScore(score)

    // Initialize lastRepStartTime on first detection (FIX: prevents huge duration on first rep)
    if (this.lastRepStartTime === 0) {
      this.lastRepStartTime = pose.timestamp
    }

    // Thresholds with reduced HYSTERESIS for better detection
    const ANGLE_UP_ENTER = PUSHUP_THRESHOLDS.ELBOW_ANGLE_TOP       // 150° - extend to enter UP
    const ANGLE_UP_EXIT = PUSHUP_THRESHOLDS.ELBOW_ANGLE_TOP - 10   // 140° - can drop before exiting UP
    const ANGLE_DOWN_ENTER = PUSHUP_THRESHOLDS.ELBOW_ANGLE_BOTTOM  // 130° - bend to enter DOWN
    const ANGLE_DOWN_EXIT = PUSHUP_THRESHOLDS.ELBOW_ANGLE_BOTTOM + 10  // 140° - can rise before exiting DOWN

    // Debug logging every 300ms
    if (now - this.lastLogTime > 300) {
      const positionStatus = this.isInValidPushupPosition ? '✅' : '❌'
      console.log(`🏋️ [${side}] Position: ${positionStatus} | Angle: ${angle.toFixed(1)}° | Stage: ${this.stage ?? 'null'} | Reps: ${this.repCount}`)
      console.log(`   Thresholds - UP: >${ANGLE_UP_ENTER}° | DOWN: <${ANGLE_DOWN_ENTER}°`)
      this.lastLogTime = now
    }

    // Get shoulder position for body movement tracking
    const leftShoulder = getLandmark(pose, 'LEFT_SHOULDER')
    const rightShoulder = getLandmark(pose, 'RIGHT_SHOULDER')
    const currentShoulderY = (leftShoulder.y + rightShoulder.y) / 2

    // Check if both arms are moving together (not just one arm)
    const bothArmsMoving = this.areBothArmsMoving(pose)

    // Rep logic with DEBOUNCING and HYSTERESIS
    // For push-ups: start in UP position, go DOWN, then back UP = 1 rep

    // Check if enough time has passed since last rep (prevents rapid counting)
    const timeSinceLastRep = now - this.lastRepTime
    const canCountRep = timeSinceLastRep > this.REP_COOLDOWN_MS

    if (angle > ANGLE_UP_ENTER) {
      // Arms fully extended = UP position (top of push-up)
      if (this.stage === 'down' && canCountRep) {
        // Verify body actually moved (prevents pure arm movement while standing/sitting)
        let bodyMovedCorrectly = true
        let verticalMovement = 0

        if (this.shoulderYAtBottom !== null && this.shoulderYAtTop !== null) {
          // Check if shoulders moved down enough when going to bottom, and back up
          verticalMovement = Math.abs(this.shoulderYAtBottom - this.shoulderYAtTop)

          if (verticalMovement < PUSHUP_THRESHOLDS.MIN_SHOULDER_VERTICAL_MOVEMENT) {
            bodyMovedCorrectly = false
            console.log(`❌ REP REJECTED - Body movement too small: ${(verticalMovement * 100).toFixed(1)}% (need: ${(PUSHUP_THRESHOLDS.MIN_SHOULDER_VERTICAL_MOVEMENT * 100).toFixed(1)}%)`)
          }
        } else {
          // First few reps - don't have baseline yet, be lenient
          bodyMovedCorrectly = true
        }

        // Only count rep if ALL validations pass:
        // 1. Body moved vertically (not just arms)
        // 2. Both arms moving together
        // 3. In valid push-up position (horizontal plank, straight legs)
        if (bodyMovedCorrectly && bothArmsMoving && this.isInValidPushupPosition) {
          // Coming UP from DOWN = completed rep!
          this.repCount++
          this.lastRepTime = now
          this.lastRepOrStartTime = now  // Reset inactivity timer
          console.log(`🎉 REP ${this.repCount} COMPLETED! (angle: ${angle.toFixed(1)}°, movement: ${(verticalMovement * 100).toFixed(1)}%)`)

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
        } else if (!bothArmsMoving) {
          console.log(`❌ REP REJECTED - Both arms not synchronized`)
        } else if (!this.isInValidPushupPosition) {
          console.log(`❌ REP REJECTED - Invalid position (sitting/kneeling/knee push-up)`)
        }
      } else if (this.stage === 'down' && !canCountRep) {
        console.log(`⏳ Rep cooldown active (${timeSinceLastRep}ms / ${this.REP_COOLDOWN_MS}ms)`)
      }

      // Record shoulder position at top
      this.shoulderYAtTop = currentShoulderY
      this.stage = 'up'
      this.currentPhase = 'top'
    } else if (this.stage === 'up' && angle < ANGLE_UP_EXIT) {
      // Allow slight angle drop before exiting UP state (hysteresis)
      this.currentPhase = 'eccentric'  // Starting to go down
    }

    if (angle < ANGLE_DOWN_ENTER) {
      // Arms bent = DOWN position (bottom of push-up)
      // Record shoulder position at bottom
      this.shoulderYAtBottom = currentShoulderY
      if (this.stage !== 'down') {
        console.log(`⬇️ DOWN POSITION DETECTED (angle: ${angle.toFixed(1)}° < ${ANGLE_DOWN_ENTER}°)`)
      }
      this.stage = 'down'
      this.currentPhase = 'bottom'
    } else if (this.stage === 'down' && angle > ANGLE_DOWN_EXIT) {
      // Allow slight angle increase before exiting DOWN state (hysteresis)
      this.currentPhase = 'concentric'  // Starting to go up
    }

    return {
      count: this.repCount,
      phase: this.currentPhase,
      quality,
      feedback,
    }
  }

  validateForm(pose: Pose): { score: number; feedback: string[] } {
    const side = getBestSide(pose)
    const prefix = side === 'left' ? 'LEFT' : 'RIGHT'

    const shoulder = getLandmark(pose, `${prefix}_SHOULDER`)
    const hip = getLandmark(pose, `${prefix}_HIP`)
    const knee = getLandmark(pose, `${prefix}_KNEE`)

    const bodyAlignment = calculateAngle(shoulder, hip, knee)

    const feedback: string[] = []
    let score = 100

    if (bodyAlignment < PUSHUP_THRESHOLDS.BODY_ALIGNMENT_WARNING) {
      score -= 60
      feedback.push('Hips sagging - engage your core')
    } else if (bodyAlignment < PUSHUP_THRESHOLDS.BODY_ALIGNMENT_GOOD) {
      score -= 30
      feedback.push('Keep your body straighter')
    }

    if (bodyAlignment > 190) {
      score -= 20
      feedback.push('Lower your hips slightly')
    }

    if (feedback.length === 0) {
      feedback.push('Good form!')
    }

    return { score: Math.max(0, score), feedback }
  }
}
