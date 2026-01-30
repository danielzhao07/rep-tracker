import { BaseDetector } from './BaseDetector'
import { calculateAngle } from '../utils/angleCalculation'
import { getLandmark } from '../utils/landmarkUtils'
import { BICEP_CURL_THRESHOLDS } from '@/utils/constants'
import type { Pose, RepCountResult } from '@/types'

/**
 * BicepCurlDetector - Simple, reliable bicep curl detection
 * Based on proven PushupDetector structure
 */
export class BicepCurlDetector extends BaseDetector {
  readonly keyLandmarks = [
    'LEFT_SHOULDER', 'RIGHT_SHOULDER',
    'LEFT_ELBOW', 'RIGHT_ELBOW',
    'LEFT_WRIST', 'RIGHT_WRIST',
  ]

  private lastLogTime = 0
  private currentLeftElbowAngle = 0
  private currentRightElbowAngle = 0

  // Stage tracking for BOTH arms: 'down' (extended) or 'up' (curled)
  private leftStage: 'down' | 'up' | null = null
  private rightStage: 'down' | 'up' | null = null

  // Debouncing
  private lastRepTime = 0
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

  reset(): void {
    super.reset()
    this.currentLeftElbowAngle = 0
    this.currentRightElbowAngle = 0
    this.leftStage = null
    this.rightStage = null
    this.lastRepTime = 0
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
   * Check if both arms are curling together
   */
  private areBothArmsCurling(pose: Pose): boolean {
    const leftShoulder = getLandmark(pose, 'LEFT_SHOULDER')
    const leftElbow = getLandmark(pose, 'LEFT_ELBOW')
    const leftWrist = getLandmark(pose, 'LEFT_WRIST')

    const rightShoulder = getLandmark(pose, 'RIGHT_SHOULDER')
    const rightElbow = getLandmark(pose, 'RIGHT_ELBOW')
    const rightWrist = getLandmark(pose, 'RIGHT_WRIST')

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist)
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist)

    const angleDiff = Math.abs(leftElbowAngle - rightElbowAngle)

    return angleDiff < BICEP_CURL_THRESHOLDS.MAX_ELBOW_ANGLE_DIFF
  }

  /**
   * Rep detection logic for bicep curls:
   * - BOTH arms EXTENDED (angle > 140°): DOWN position
   * - BOTH arms CURLED (angle < 80°): UP position
   * - Rep counts when: BOTH arms go down → up → down
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

    // Thresholds with hysteresis
    const ANGLE_DOWN_ENTER = BICEP_CURL_THRESHOLDS.ELBOW_ANGLE_EXTENDED      // 140°
    const ANGLE_DOWN_EXIT = BICEP_CURL_THRESHOLDS.ELBOW_ANGLE_EXTENDED - 10  // 130°
    const ANGLE_UP_ENTER = BICEP_CURL_THRESHOLDS.ELBOW_ANGLE_CURLED          // 80°
    const ANGLE_UP_EXIT = BICEP_CURL_THRESHOLDS.ELBOW_ANGLE_CURLED + 10      // 90°

    // Debug logging - show BOTH arms
    if (now - this.lastLogTime > 300) {
      console.log(`💪 Left: ${leftAngle.toFixed(1)}° (${this.leftStage ?? 'null'}) | Right: ${rightAngle.toFixed(1)}° (${this.rightStage ?? 'null'}) | Reps: ${this.repCount}`)
      console.log(`   Thresholds - DOWN: >${ANGLE_DOWN_ENTER}° | UP: <${ANGLE_UP_ENTER}°`)
      this.lastLogTime = now
    }

    const timeSinceLastRep = now - this.lastRepTime
    const canCountRep = timeSinceLastRep > this.REP_COOLDOWN_MS

    // Check current positions
    const bothArmsExtended = leftAngle > ANGLE_DOWN_ENTER && rightAngle > ANGLE_DOWN_ENTER
    const bothArmsCurled = leftAngle < ANGLE_UP_ENTER && rightAngle < ANGLE_UP_ENTER

    // Rep logic: Check PREVIOUS stage, then count, then update stage
    // Both arms extended after both were curled = 1 rep
    if (bothArmsExtended && canCountRep) {
      if (this.leftStage === 'up' && this.rightStage === 'up') {
        // Both arms extended after being curled = REP!
        this.repCount++
        this.lastRepTime = now
        this.lastRepOrStartTime = now
        console.log(`🎉 REP ${this.repCount} COMPLETED! Left: ${leftAngle.toFixed(1)}° | Right: ${rightAngle.toFixed(1)}°`)

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

      // Update stages to extended
      this.leftStage = 'down'
      this.rightStage = 'down'
      this.currentPhase = 'bottom'
    } else if (bothArmsCurled) {
      // Both arms curled = UP position
      if (this.leftStage !== 'up' || this.rightStage !== 'up') {
        console.log(`⬆️ BOTH ARMS CURLED - Left: ${leftAngle.toFixed(1)}° | Right: ${rightAngle.toFixed(1)}°`)
      }
      this.leftStage = 'up'
      this.rightStage = 'up'
      this.currentPhase = 'top'
    } else {
      // In between - transitioning
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
    const feedback: string[] = []
    let score = 100

    const bothArmsCurling = this.areBothArmsCurling(pose)

    if (!bothArmsCurling) {
      score -= 40
      feedback.push('Curl both arms together')
    }

    if (feedback.length === 0) {
      feedback.push('Good form!')
    }

    return { score: Math.max(0, score), feedback }
  }
}
