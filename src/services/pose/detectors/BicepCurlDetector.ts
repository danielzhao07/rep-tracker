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
   * Also returns visibility scores to determine which arm to use
   */
  private calculateBothElbowAngles(pose: Pose): {
    leftAngle: number
    rightAngle: number
    leftVisibility: number
    rightVisibility: number
  } {
    const leftShoulder = getLandmark(pose, 'LEFT_SHOULDER')
    const leftElbow = getLandmark(pose, 'LEFT_ELBOW')
    const leftWrist = getLandmark(pose, 'LEFT_WRIST')

    const rightShoulder = getLandmark(pose, 'RIGHT_SHOULDER')
    const rightElbow = getLandmark(pose, 'RIGHT_ELBOW')
    const rightWrist = getLandmark(pose, 'RIGHT_WRIST')

    // Calculate visibility scores (average of key landmarks for each arm)
    const leftVisibility = (leftShoulder.visibility + leftElbow.visibility + leftWrist.visibility) / 3
    const rightVisibility = (rightShoulder.visibility + rightElbow.visibility + rightWrist.visibility) / 3

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

    return { leftAngle, rightAngle, leftVisibility, rightVisibility }
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
   * - Handles both front view (both arms) and side view (one arm visible)
   * - Automatically detects view based on landmark visibility
   * - EXTENDED (angle > 140°): DOWN position
   * - CURLED (angle < 80°): UP position
   * - Rep counts when: down → up → down
   */
  detectRepPhase(pose: Pose): RepCountResult {
    const now = Date.now()

    if (this.lastRepOrStartTime === 0) {
      this.lastRepOrStartTime = now
    }

    const { leftAngle, rightAngle, leftVisibility, rightVisibility } = this.calculateBothElbowAngles(pose)
    this.currentLeftElbowAngle = leftAngle
    this.currentRightElbowAngle = rightAngle

    const { score, feedback } = this.validateForm(pose)
    const quality = this.qualityFromScore(score)

    if (this.lastRepStartTime === 0) {
      this.lastRepStartTime = pose.timestamp
    }

    // BOTH ARMS REQUIRED: Both arms must be sufficiently visible to track movement accurately
    // This prevents counting reps when only one arm (facing camera) is curling from the side
    // For front view: Both arms ~60-80% visible ✓
    // For side view (both arms curling): Both arms ~50-60% visible ✓
    // For side view (only front arm curling): Front arm ~70%, back arm ~40-45% ✗
    const MIN_VISIBILITY_BOTH_ARMS = 0.5 // Both arms must be at least 50% visible

    const bothArmsVisible = leftVisibility >= MIN_VISIBILITY_BOTH_ARMS && rightVisibility >= MIN_VISIBILITY_BOTH_ARMS

    // If both arms aren't sufficiently visible, don't count reps
    if (!bothArmsVisible) {
      return {
        count: this.repCount,
        phase: this.currentPhase,
        quality,
        feedback: [...feedback, 'Both arms must be visible'],
      }
    }

    // Determine view type: side view if one arm has significantly better visibility
    const VISIBILITY_THRESHOLD = 0.15 // 15% difference indicates side view
    const visibilityDiff = Math.abs(leftVisibility - rightVisibility)
    const isSideView = visibilityDiff > VISIBILITY_THRESHOLD

    // For both-arms exercise, always use both arms even in side-ish views
    const useLeftArm = true
    const useRightArm = true

    // Get average angle of both arms
    const primaryAngle = (leftAngle + rightAngle) / 2

    // Thresholds
    const ANGLE_DOWN_ENTER = BICEP_CURL_THRESHOLDS.ELBOW_ANGLE_EXTENDED      // 140°
    const ANGLE_UP_ENTER = BICEP_CURL_THRESHOLDS.ELBOW_ANGLE_CURLED          // 80°

    // Debug logging
    if (now - this.lastLogTime > 300) {
      console.log(`💪 (BOTH ARMS) Left: ${leftAngle.toFixed(1)}° (vis: ${(leftVisibility * 100).toFixed(0)}%) | Right: ${rightAngle.toFixed(1)}° (vis: ${(rightVisibility * 100).toFixed(0)}%)`)
      console.log(`   Avg: ${primaryAngle.toFixed(1)}° | Diff: ${Math.abs(leftAngle - rightAngle).toFixed(1)}° | Left stage: ${this.leftStage ?? 'null'} | Right stage: ${this.rightStage ?? 'null'} | Reps: ${this.repCount}`)
      console.log(`   Thresholds - DOWN: >${ANGLE_DOWN_ENTER}° | UP: <${ANGLE_UP_ENTER}°`)
      this.lastLogTime = now
    }

    const timeSinceLastRep = now - this.lastRepTime
    const canCountRep = timeSinceLastRep > this.REP_COOLDOWN_MS

    // BOTH ARMS REQUIRED: Both arms must move together
    const armsExtended = leftAngle > ANGLE_DOWN_ENTER && rightAngle > ANGLE_DOWN_ENTER
    const armsCurled = leftAngle < ANGLE_UP_ENTER && rightAngle < ANGLE_UP_ENTER

    // Additional check: arms must be synchronized for both-arm curls
    // Balanced threshold allows side-view detection while preventing single-arm false positives
    const MAX_ANGLE_DIFF = 20 // Arms must be within 20° - tight enough to prevent single-arm, loose enough for side view
    const angleDiff = Math.abs(leftAngle - rightAngle)
    const armsSync = angleDiff < MAX_ANGLE_DIFF

    // Rep logic: Check PREVIOUS stage, then count, then update stage
    if (armsExtended && armsSync && canCountRep) {
      // Check if BOTH arms were in 'up' stage previously
      const wasUp = (this.leftStage === 'up' && this.rightStage === 'up')

      if (wasUp) {
        // Both arms extended after being curled = REP!
        this.repCount++
        this.lastRepTime = now
        this.lastRepOrStartTime = now
        console.log(`🎉 REP ${this.repCount} COMPLETED! (BOTH ARMS) Avg Angle: ${primaryAngle.toFixed(1)}°`)

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

      // Update both stages to extended
      this.leftStage = 'down'
      this.rightStage = 'down'
      this.currentPhase = 'bottom'
    } else if (armsCurled && armsSync) {
      // Both arms curled = UP position
      const wasNotUp = (this.leftStage !== 'up' || this.rightStage !== 'up')

      if (wasNotUp) {
        console.log(`⬆️ BOTH ARMS CURLED - Avg Angle: ${primaryAngle.toFixed(1)}°`)
      }
      this.leftStage = 'up'
      this.rightStage = 'up'
      this.currentPhase = 'top'
    } else {
      // In between - transitioning or arms not synchronized
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

    // Check visibility to determine if we're in front or side view
    const leftShoulder = getLandmark(pose, 'LEFT_SHOULDER')
    const rightShoulder = getLandmark(pose, 'RIGHT_SHOULDER')
    const leftElbow = getLandmark(pose, 'LEFT_ELBOW')
    const rightElbow = getLandmark(pose, 'RIGHT_ELBOW')

    const leftVisibility = (leftShoulder.visibility + leftElbow.visibility) / 2
    const rightVisibility = (rightShoulder.visibility + rightElbow.visibility) / 2
    const visibilityDiff = Math.abs(leftVisibility - rightVisibility)
    const isSideView = visibilityDiff > 0.15

    // Only check for both arms curling together if in front view
    if (!isSideView) {
      const bothArmsCurling = this.areBothArmsCurling(pose)
      if (!bothArmsCurling) {
        score -= 40
        feedback.push('Curl both arms together')
      }
    }

    if (feedback.length === 0) {
      feedback.push('Good form!')
    }

    return { score: Math.max(0, score), feedback }
  }
}
