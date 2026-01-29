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
  private readonly REP_COOLDOWN_MS = 800 // Minimum 800ms between reps

  // Angle smoothing buffer
  private angleHistory: number[] = []
  private readonly ANGLE_SMOOTHING_WINDOW = 3

  getElbowAngle(): number {
    return this.currentElbowAngle
  }

  reset(): void {
    super.reset()
    this.currentElbowAngle = 0
    this.stage = null
    this.lastRepTime = 0
    this.angleHistory = []
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
    const { angle, side } = this.calculateElbowAngle(pose)
    this.currentElbowAngle = angle

    const { score, feedback } = this.validateForm(pose)
    const quality = this.qualityFromScore(score)

    // Initialize lastRepStartTime on first detection (FIX: prevents huge duration on first rep)
    if (this.lastRepStartTime === 0) {
      this.lastRepStartTime = pose.timestamp
    }

    // Thresholds with HYSTERESIS to prevent rapid state changes
    const ANGLE_UP_ENTER = PUSHUP_THRESHOLDS.ELBOW_ANGLE_TOP + 5    // 155° - must clearly extend to enter UP
    const ANGLE_UP_EXIT = PUSHUP_THRESHOLDS.ELBOW_ANGLE_TOP - 5     // 145° - can drop slightly while in UP
    const ANGLE_DOWN_ENTER = PUSHUP_THRESHOLDS.ELBOW_ANGLE_BOTTOM - 5  // 125° - must clearly bend to enter DOWN
    const ANGLE_DOWN_EXIT = PUSHUP_THRESHOLDS.ELBOW_ANGLE_BOTTOM + 5   // 135° - can rise slightly while in DOWN

    // Debug logging every 300ms
    const now = Date.now()
    if (now - this.lastLogTime > 300) {
      console.log(`🏋️ [${side}] Angle: ${angle.toFixed(1)}° | Stage: ${this.stage ?? 'null'} | Reps: ${this.repCount}`)
      console.log(`   Thresholds - UP: >${ANGLE_UP_ENTER}° | DOWN: <${ANGLE_DOWN_ENTER}°`)
      this.lastLogTime = now
    }

    // Rep logic with DEBOUNCING and HYSTERESIS
    // For push-ups: start in UP position, go DOWN, then back UP = 1 rep

    // Check if enough time has passed since last rep (prevents rapid counting)
    const timeSinceLastRep = now - this.lastRepTime
    const canCountRep = timeSinceLastRep > this.REP_COOLDOWN_MS

    if (angle > ANGLE_UP_ENTER) {
      // Arms fully extended = UP position (top of push-up)
      if (this.stage === 'down' && canCountRep) {
        // Coming UP from DOWN = completed rep!
        this.repCount++
        this.lastRepTime = now
        console.log(`🎉 REP ${this.repCount} COMPLETED! (angle: ${angle.toFixed(1)}°, cooldown: ${timeSinceLastRep}ms)`)

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
      }
      this.stage = 'up'
      this.currentPhase = 'top'
    } else if (this.stage === 'up' && angle < ANGLE_UP_EXIT) {
      // Allow slight angle drop before exiting UP state (hysteresis)
      this.currentPhase = 'eccentric'  // Starting to go down
    }

    if (angle < ANGLE_DOWN_ENTER) {
      // Arms bent = DOWN position (bottom of push-up)
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
