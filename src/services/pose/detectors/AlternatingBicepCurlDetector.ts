import { BaseDetector } from './BaseDetector'
import { calculateAngle } from '../utils/angleCalculation'
import { getLandmark } from '../utils/landmarkUtils'
import { ALTERNATING_BICEP_CURL_THRESHOLDS } from '@/utils/constants'
import type { Pose, RepCountResult } from '@/types'

/**
 * AlternatingBicepCurlDetector - Tracks each arm independently
 * Left and right arms alternate curls, reps counted separately
 */
export class AlternatingBicepCurlDetector extends BaseDetector {
  readonly keyLandmarks = [
    'LEFT_SHOULDER', 'RIGHT_SHOULDER',
    'LEFT_ELBOW', 'RIGHT_ELBOW',
    'LEFT_WRIST', 'RIGHT_WRIST',
  ]

  private lastLogTime = 0
  private currentLeftElbowAngle = 0
  private currentRightElbowAngle = 0

  // Separate rep counts for each arm
  private leftRepCount = 0
  private rightRepCount = 0

  // Stage tracking for each arm independently
  private leftStage: 'down' | 'up' | null = null
  private rightStage: 'down' | 'up' | null = null

  // Debouncing for each arm
  private lastLeftRepTime = 0
  private lastRightRepTime = 0
  private readonly REP_COOLDOWN_MS = 600

  // Angle smoothing for both arms
  private leftAngleHistory: number[] = []
  private rightAngleHistory: number[] = []
  private readonly ANGLE_SMOOTHING_WINDOW = 3

  // Inactivity tracking
  private lastRepOrStartTime = 0

  getElbowAngle(): number {
    return (this.currentLeftElbowAngle + this.currentRightElbowAngle) / 2
  }

  getCurrentCount(): number {
    // Total reps = left + right
    return this.leftRepCount + this.rightRepCount
  }

  reset(): void {
    super.reset()
    this.currentLeftElbowAngle = 0
    this.currentRightElbowAngle = 0
    this.leftRepCount = 0
    this.rightRepCount = 0
    this.leftStage = null
    this.rightStage = null
    this.lastLeftRepTime = 0
    this.lastRightRepTime = 0
    this.leftAngleHistory = []
    this.rightAngleHistory = []
    this.lastRepOrStartTime = Date.now()
  }

  /**
   * Calculate elbow angles for BOTH arms with smoothing
   */
  private calculateBothElbowAngles(pose: Pose): { leftAngle: number; rightAngle: number } {
    const leftShoulder = getLandmark(pose, 'LEFT_SHOULDER')
    const leftElbow = getLandmark(pose, 'LEFT_ELBOW')
    const leftWrist = getLandmark(pose, 'LEFT_WRIST')

    const rightShoulder = getLandmark(pose, 'RIGHT_SHOULDER')
    const rightElbow = getLandmark(pose, 'RIGHT_ELBOW')
    const rightWrist = getLandmark(pose, 'RIGHT_WRIST')

    // Calculate raw angles for both arms
    const leftRawAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
    const rightRawAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)

    // Smoothing for left arm
    this.leftAngleHistory.push(leftRawAngle)
    if (this.leftAngleHistory.length > this.ANGLE_SMOOTHING_WINDOW) {
      this.leftAngleHistory.shift()
    }

    // Smoothing for right arm
    this.rightAngleHistory.push(rightRawAngle)
    if (this.rightAngleHistory.length > this.ANGLE_SMOOTHING_WINDOW) {
      this.rightAngleHistory.shift()
    }

    const leftAngle =
      this.leftAngleHistory.reduce((sum, a) => sum + a, 0) / this.leftAngleHistory.length
    const rightAngle =
      this.rightAngleHistory.reduce((sum, a) => sum + a, 0) / this.rightAngleHistory.length

    return { leftAngle, rightAngle }
  }

  /**
   * Rep detection logic for alternating bicep curls:
   * - Each arm tracked independently
   * - Left arm: extended → curled → extended = +1 left rep
   * - Right arm: extended → curled → extended = +1 right rep
   * - Total reps = left reps + right reps
   */
  detectRepPhase(pose: Pose): RepCountResult {
    const now = Date.now()

    if (this.lastRepOrStartTime === 0) {
      this.lastRepOrStartTime = now
    }

    const { leftAngle, rightAngle } = this.calculateBothElbowAngles(pose)
    this.currentLeftElbowAngle = leftAngle
    this.currentRightElbowAngle = rightAngle

    const { score, feedback } = this.validateForm(pose)
    const quality = this.qualityFromScore(score)

    if (this.lastRepStartTime === 0) {
      this.lastRepStartTime = pose.timestamp
    }

    // Thresholds
    const ANGLE_DOWN_ENTER = ALTERNATING_BICEP_CURL_THRESHOLDS.ELBOW_ANGLE_EXTENDED  // 140°
    const ANGLE_UP_ENTER = ALTERNATING_BICEP_CURL_THRESHOLDS.ELBOW_ANGLE_CURLED      // 80°

    // Debug logging - show both arms with individual rep counts
    if (now - this.lastLogTime > 300) {
      const totalReps = this.leftRepCount + this.rightRepCount
      console.log(`💪 Left: ${leftAngle.toFixed(1)}° (${this.leftStage ?? 'null'}, ${this.leftRepCount} reps) | Right: ${rightAngle.toFixed(1)}° (${this.rightStage ?? 'null'}, ${this.rightRepCount} reps) | Total: ${totalReps}`)
      console.log(`   Thresholds - DOWN: >${ANGLE_DOWN_ENTER}° | UP: <${ANGLE_UP_ENTER}°`)
      this.lastLogTime = now
    }

    // Cooldown checks for each arm
    const timeSinceLastLeftRep = now - this.lastLeftRepTime
    const canCountLeftRep = timeSinceLastLeftRep > this.REP_COOLDOWN_MS
    const timeSinceLastRightRep = now - this.lastRightRepTime
    const canCountRightRep = timeSinceLastRightRep > this.REP_COOLDOWN_MS

    // LEFT ARM detection
    const leftArmExtended = leftAngle > ANGLE_DOWN_ENTER
    const leftArmCurled = leftAngle < ANGLE_UP_ENTER

    if (leftArmExtended && canCountLeftRep) {
      if (this.leftStage === 'up') {
        // Left arm extended after being curled = LEFT REP!
        this.leftRepCount++
        this.lastLeftRepTime = now
        this.lastRepOrStartTime = now
        console.log(`🎉 LEFT ARM REP ${this.leftRepCount}! (angle: ${leftAngle.toFixed(1)}°)`)

        // Update total rep count and history
        this.repCount = this.leftRepCount + this.rightRepCount
        this.repHistory.push({
          number: this.repCount,
          startTime: this.lastRepStartTime,
          endTime: pose.timestamp,
          duration: pose.timestamp - this.lastRepStartTime,
          quality,
          formScore: score,
          feedback: [`Left arm - ${feedback[0]}`],
        })
        this.lastRepStartTime = pose.timestamp
      }
      this.leftStage = 'down'
    } else if (leftArmCurled) {
      if (this.leftStage !== 'up') {
        console.log(`⬆️ LEFT ARM CURLED (${leftAngle.toFixed(1)}°)`)
      }
      this.leftStage = 'up'
    }

    // RIGHT ARM detection
    const rightArmExtended = rightAngle > ANGLE_DOWN_ENTER
    const rightArmCurled = rightAngle < ANGLE_UP_ENTER

    if (rightArmExtended && canCountRightRep) {
      if (this.rightStage === 'up') {
        // Right arm extended after being curled = RIGHT REP!
        this.rightRepCount++
        this.lastRightRepTime = now
        this.lastRepOrStartTime = now
        console.log(`🎉 RIGHT ARM REP ${this.rightRepCount}! (angle: ${rightAngle.toFixed(1)}°)`)

        // Update total rep count and history
        this.repCount = this.leftRepCount + this.rightRepCount
        this.repHistory.push({
          number: this.repCount,
          startTime: this.lastRepStartTime,
          endTime: pose.timestamp,
          duration: pose.timestamp - this.lastRepStartTime,
          quality,
          formScore: score,
          feedback: [`Right arm - ${feedback[0]}`],
        })
        this.lastRepStartTime = pose.timestamp
      }
      this.rightStage = 'down'
    } else if (rightArmCurled) {
      if (this.rightStage !== 'up') {
        console.log(`⬆️ RIGHT ARM CURLED (${rightAngle.toFixed(1)}°)`)
      }
      this.rightStage = 'up'
    }

    // Set current phase based on arm positions
    if (leftArmCurled && rightArmCurled) {
      this.currentPhase = 'top'
    } else if (leftArmExtended && rightArmExtended) {
      this.currentPhase = 'bottom'
    } else {
      this.currentPhase = 'concentric'
    }

    return {
      count: this.repCount,
      phase: this.currentPhase,
      quality,
      feedback,
      leftArmCount: this.leftRepCount,
      rightArmCount: this.rightRepCount,
    }
  }

  validateForm(_pose: Pose): { score: number; feedback: string[] } {
    const feedback: string[] = []
    let score = 100

    // For alternating curls, we don't require both arms to move together
    feedback.push('Good form!')

    return { score: Math.max(0, score), feedback }
  }
}
