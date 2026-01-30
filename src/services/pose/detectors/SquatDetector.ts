import { BaseDetector } from './BaseDetector'
import { calculateAngle } from '../utils/angleCalculation'
import { getLandmark, getBestSide } from '../utils/landmarkUtils'
import { SQUAT_THRESHOLDS } from '@/utils/constants'
import type { Pose, RepCountResult } from '@/types'

/**
 * SquatDetector - Detects squat reps with anti-cheating measures
 * Prevents: partial squats, one-leg movement, excessive torso lean
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
  private currentHipHeight = 0

  // Stage tracking: 'up' (standing) or 'down' (squatting)
  private stage: 'up' | 'down' | null = null

  // View tracking
  private isFrontView = false
  private hipYBaseline: number | null = null  // Baseline hip Y position when standing

  // Debouncing
  private lastRepTime = 0
  private readonly REP_COOLDOWN_MS = 600

  // Angle smoothing
  private angleHistory: number[] = []
  private readonly ANGLE_SMOOTHING_WINDOW = 3

  // Body movement tracking (prevent partial squats)
  private hipYAtTop: number | null = null
  private hipYAtBottom: number | null = null

  // Position validation state
  private isInValidSquatPosition = false
  private positionValidationFailures = 0
  private readonly MAX_POSITION_FAILURES = 3

  // Inactivity tracking
  private workoutStartTime = 0
  private lastRepOrStartTime = 0

  getKneeAngle(): number {
    return this.currentKneeAngle
  }

  reset(): void {
    super.reset()
    this.currentKneeAngle = 0
    this.stage = null
    this.lastRepTime = 0
    this.angleHistory = []
    this.isInValidSquatPosition = false
    this.positionValidationFailures = 0
    this.workoutStartTime = Date.now()
    this.lastRepOrStartTime = Date.now()
    this.hipYAtTop = null
    this.hipYAtBottom = null
  }

  /**
   * Detect if user is facing front or side based on hip width
   */
  private detectViewOrientation(pose: Pose): boolean {
    const leftHip = getLandmark(pose, 'LEFT_HIP')
    const rightHip = getLandmark(pose, 'RIGHT_HIP')

    const hipWidth = Math.abs(leftHip.x - rightHip.x)

    // If hips are far apart horizontally, user is facing front
    return hipWidth > SQUAT_THRESHOLDS.MIN_HIP_WIDTH_FRONT
  }

  /**
   * Calculate hip drop from baseline for front view detection
   */
  private calculateHipDrop(pose: Pose): number {
    const leftHip = getLandmark(pose, 'LEFT_HIP')
    const rightHip = getLandmark(pose, 'RIGHT_HIP')

    const currentHipY = (leftHip.y + rightHip.y) / 2

    // Establish baseline on first few frames
    if (this.hipYBaseline === null || this.stage === 'up') {
      this.hipYBaseline = currentHipY
      return 0
    }

    // Return how much hips have dropped from baseline (positive = dropped)
    return currentHipY - this.hipYBaseline
  }

  /**
   * Calculate knee angle with smoothing (for side view)
   */
  private calculateKneeAngle(pose: Pose): { angle: number; side: 'left' | 'right' } {
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

    // Smoothing
    this.angleHistory.push(rawAngle)
    if (this.angleHistory.length > this.ANGLE_SMOOTHING_WINDOW) {
      this.angleHistory.shift()
    }

    const smoothedAngle =
      this.angleHistory.reduce((sum, a) => sum + a, 0) / this.angleHistory.length

    return { angle: smoothedAngle, side }
  }

  /**
   * Check if both legs are squatting together
   */
  private areBothLegsSquatting(pose: Pose): boolean {
    const leftHip = getLandmark(pose, 'LEFT_HIP')
    const leftKnee = getLandmark(pose, 'LEFT_KNEE')
    const leftAnkle = getLandmark(pose, 'LEFT_ANKLE')

    const rightHip = getLandmark(pose, 'RIGHT_HIP')
    const rightKnee = getLandmark(pose, 'RIGHT_KNEE')
    const rightAnkle = getLandmark(pose, 'RIGHT_ANKLE')

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle)
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle)

    const angleDiff = Math.abs(leftKneeAngle - rightKneeAngle)

    return angleDiff < SQUAT_THRESHOLDS.MAX_KNEE_ANGLE_DIFF
  }

  /**
   * Validate squat position: standing upright, knees visible, proper depth
   * Prevents: partial squats, one-leg movement
   */
  private validateSquatPosition(pose: Pose): { isValid: boolean; reasons: string[] } {
    const reasons: string[] = []

    const leftKnee = getLandmark(pose, 'LEFT_KNEE')
    const rightKnee = getLandmark(pose, 'RIGHT_KNEE')
    const leftShoulder = getLandmark(pose, 'LEFT_SHOULDER')
    const rightShoulder = getLandmark(pose, 'RIGHT_SHOULDER')
    const leftHip = getLandmark(pose, 'LEFT_HIP')
    const rightHip = getLandmark(pose, 'RIGHT_HIP')

    const kneeVisibility = Math.max(leftKnee.visibility, rightKnee.visibility)

    // Check torso angle (shouldn't lean too far forward)
    const side = getBestSide(pose)
    const prefix = side === 'left' ? 'LEFT' : 'RIGHT'
    const shoulder = getLandmark(pose, `${prefix}_SHOULDER`)
    const hip = getLandmark(pose, `${prefix}_HIP`)
    const knee = getLandmark(pose, `${prefix}_KNEE`)

    const torsoAngle = calculateAngle(shoulder, hip, knee)

    // Debug logging
    const now = Date.now()
    if (now - this.lastLogTime > 1000) {
      console.log(`📐 Squat Position Check:`)
      console.log(`   Knee visibility: ${kneeVisibility.toFixed(2)}`)
      console.log(`   Torso angle: ${torsoAngle.toFixed(1)}° (min: ${SQUAT_THRESHOLDS.MAX_TORSO_LEAN}°)`)
    }

    if (kneeVisibility < SQUAT_THRESHOLDS.MIN_KNEE_VISIBILITY) {
      reasons.push('Keep knees visible in frame')
    }

    if (torsoAngle < SQUAT_THRESHOLDS.MAX_TORSO_LEAN) {
      reasons.push('Don\'t lean too far forward')
    }

    return { isValid: reasons.length === 0, reasons }
  }

  /**
   * Rep detection logic for squats:
   * - Knees EXTENDED (angle > 165°): UP position (standing)
   * - Knees BENT (angle < 100°): DOWN position (squatting)
   * - Rep counts when: up → down → up (full squat)
   */
  detectRepPhase(pose: Pose): RepCountResult {
    const now = Date.now()

    if (this.workoutStartTime === 0) {
      this.workoutStartTime = now
      this.lastRepOrStartTime = now
    }

    // Validate position
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

    // Log inactivity warning but DON'T block detection
    const timeSinceLastRepOrStart = now - this.lastRepOrStartTime
    if (timeSinceLastRepOrStart > SQUAT_THRESHOLDS.INACTIVITY_WARNING_MS && this.repCount === 0) {
      if (now - this.lastLogTime > 2000) {
        const { angle } = this.calculateKneeAngle(pose)
        console.log(`⏱️ No reps detected for ${Math.floor(timeSinceLastRepOrStart / 1000)}s - Current angle: ${angle.toFixed(0)}°`)
      }
    }

    // Block detection if position is invalid AND past initial setup
    const isInitialSetup = timeSinceLastRepOrStart < 5000 && this.repCount === 0

    if (!this.isInValidSquatPosition && this.positionValidationFailures >= this.MAX_POSITION_FAILURES && !isInitialSetup) {
      return {
        count: this.repCount,
        phase: 'start',
        quality: 'poor',
        feedback: ['⚠️ Get into proper squat position:', ...positionValidation.reasons],
      }
    }

    // Detect view orientation
    this.isFrontView = this.detectViewOrientation(pose)

    const { score, feedback } = this.validateForm(pose)
    const quality = this.qualityFromScore(score)

    if (this.lastRepStartTime === 0) {
      this.lastRepStartTime = pose.timestamp
    }

    let currentValue: number
    let side: 'left' | 'right' = 'left'

    if (this.isFrontView) {
      // Front view: track hip drop
      currentValue = this.calculateHipDrop(pose)
      this.currentHipHeight = currentValue

      // Debug logging
      if (now - this.lastLogTime > 300) {
        const positionStatus = this.isInValidSquatPosition ? '✅' : '❌'
        console.log(`🦵 [FRONT VIEW] Position: ${positionStatus} | Hip Drop: ${(currentValue * 100).toFixed(1)}% | Stage: ${this.stage ?? 'null'} | Reps: ${this.repCount}`)
        console.log(`   Threshold - DOWN: >${(SQUAT_THRESHOLDS.MIN_HIP_DROP_FRONT * 100).toFixed(0)}%`)
        this.lastLogTime = now
      }
    } else {
      // Side view: track knee angle
      const angleResult = this.calculateKneeAngle(pose)
      currentValue = angleResult.angle
      side = angleResult.side
      this.currentKneeAngle = currentValue

      // Debug logging
      if (now - this.lastLogTime > 300) {
        const positionStatus = this.isInValidSquatPosition ? '✅' : '❌'
        console.log(`🦵 [SIDE VIEW - ${side}] Position: ${positionStatus} | Angle: ${currentValue.toFixed(1)}° | Stage: ${this.stage ?? 'null'} | Reps: ${this.repCount}`)
        console.log(`   Thresholds - UP: >${SQUAT_THRESHOLDS.KNEE_ANGLE_STANDING}° | DOWN: <${SQUAT_THRESHOLDS.KNEE_ANGLE_SQUATTING}°`)
        this.lastLogTime = now
      }
    }

    // Get hip position for depth tracking
    const leftHip = getLandmark(pose, 'LEFT_HIP')
    const rightHip = getLandmark(pose, 'RIGHT_HIP')
    const currentHipY = (leftHip.y + rightHip.y) / 2

    const bothLegsSquatting = this.areBothLegsSquatting(pose)
    const timeSinceLastRep = now - this.lastRepTime
    const canCountRep = timeSinceLastRep > this.REP_COOLDOWN_MS

    // Different thresholds based on view
    let upEnter: number, upExit: number, downEnter: number, downExit: number
    let isUpPosition: boolean, isDownPosition: boolean

    if (this.isFrontView) {
      // Front view: use hip drop
      downEnter = SQUAT_THRESHOLDS.MIN_HIP_DROP_FRONT
      downExit = SQUAT_THRESHOLDS.MIN_HIP_DROP_FRONT - 0.03
      upEnter = 0.03  // Small threshold for being back up
      upExit = 0.05

      // For hip drop, DOWN is when drop is LARGE, UP is when drop is SMALL
      isDownPosition = currentValue > downEnter
      isUpPosition = currentValue < upEnter
    } else {
      // Side view: use knee angle
      upEnter = SQUAT_THRESHOLDS.KNEE_ANGLE_STANDING
      upExit = SQUAT_THRESHOLDS.KNEE_ANGLE_STANDING - 10
      downEnter = SQUAT_THRESHOLDS.KNEE_ANGLE_SQUATTING
      downExit = SQUAT_THRESHOLDS.KNEE_ANGLE_SQUATTING + 10

      // For angle, UP is when angle is LARGE, DOWN is when angle is SMALL
      isUpPosition = currentValue > upEnter
      isDownPosition = currentValue < downEnter
    }

    // Rep logic: Start at UP (standing), squat DOWN, stand back UP = 1 rep
    if (isUpPosition) {
      // Standing = UP position
      if (this.stage === 'down' && canCountRep) {
        // Verify hips dropped enough during squat
        let hipDroppedCorrectly = true
        let verticalMovement = 0

        if (this.hipYAtTop !== null && this.hipYAtBottom !== null) {
          verticalMovement = Math.abs(this.hipYAtBottom - this.hipYAtTop)

          const minDepth = this.isFrontView ? SQUAT_THRESHOLDS.MIN_HIP_DROP_FRONT : SQUAT_THRESHOLDS.MIN_HIP_DEPTH
          if (verticalMovement < minDepth) {
            hipDroppedCorrectly = false
            console.log(`❌ REP REJECTED - Hip drop too small: ${(verticalMovement * 100).toFixed(1)}%`)
          }
        } else {
          hipDroppedCorrectly = true
        }

        // Count rep if ALL validations pass
        if (hipDroppedCorrectly && bothLegsSquatting && this.isInValidSquatPosition) {
          this.repCount++
          this.lastRepTime = now
          this.lastRepOrStartTime = now
          const viewLabel = this.isFrontView ? 'FRONT' : 'SIDE'
          console.log(`🎉 REP ${this.repCount} COMPLETED! [${viewLabel}] (value: ${currentValue.toFixed(1)}, depth: ${(verticalMovement * 100).toFixed(1)}%)`)

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
        } else if (!bothLegsSquatting) {
          console.log(`❌ REP REJECTED - Both legs not synchronized`)
        } else if (!this.isInValidSquatPosition) {
          console.log(`❌ REP REJECTED - Invalid position (leaning forward/knees not visible)`)
        }
      }

      this.hipYAtTop = currentHipY
      this.stage = 'up'
      this.currentPhase = 'top'
    } else if (this.stage === 'up' && (this.isFrontView ? currentValue > upExit : currentValue < upExit)) {
      this.currentPhase = 'eccentric'
    }

    if (isDownPosition) {
      // Squatting = DOWN position
      this.hipYAtBottom = currentHipY
      if (this.stage !== 'down') {
        const viewLabel = this.isFrontView ? 'FRONT' : 'SIDE'
        console.log(`⬇️ DOWN POSITION DETECTED [${viewLabel}] (value: ${currentValue.toFixed(1)})`)
      }
      this.stage = 'down'
      this.currentPhase = 'bottom'
    } else if (this.stage === 'down' && (this.isFrontView ? currentValue < downExit : currentValue > downExit)) {
      this.currentPhase = 'concentric'
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

    const torsoAngle = calculateAngle(shoulder, hip, knee)

    const feedback: string[] = []
    let score = 100

    if (torsoAngle < SQUAT_THRESHOLDS.MAX_TORSO_LEAN) {
      score -= 40
      feedback.push('Keep chest up - don\'t lean too far forward')
    }

    const bothLegsSquatting = this.areBothLegsSquatting(pose)
    if (!bothLegsSquatting) {
      score -= 30
      feedback.push('Squat with both legs evenly')
    }

    if (feedback.length === 0) {
      feedback.push('Good form!')
    }

    return { score: Math.max(0, score), feedback }
  }
}
