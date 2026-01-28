import { BaseDetector } from './BaseDetector'
import { calculateAngle } from '../utils/angleCalculation'
import { getLandmark, getBestSide } from '../utils/landmarkUtils'
import { PUSHUP_THRESHOLDS } from '@/utils/constants'
import type { Pose, RepCountResult } from '@/types'

export class PushupDetector extends BaseDetector {
  readonly keyLandmarks = [
    'LEFT_SHOULDER', 'RIGHT_SHOULDER',
    'LEFT_ELBOW', 'RIGHT_ELBOW',
    'LEFT_WRIST', 'RIGHT_WRIST',
    'LEFT_HIP', 'RIGHT_HIP',
    'LEFT_KNEE', 'RIGHT_KNEE',
  ]

  detectRepPhase(pose: Pose): RepCountResult {
    const side = getBestSide(pose)
    const prefix = side === 'left' ? 'LEFT' : 'RIGHT'

    const shoulder = getLandmark(pose, `${prefix}_SHOULDER`)
    const elbow = getLandmark(pose, `${prefix}_ELBOW`)
    const wrist = getLandmark(pose, `${prefix}_WRIST`)

    const elbowAngle = calculateAngle(shoulder, elbow, wrist)

    const { score, feedback } = this.validateForm(pose)
    const quality = this.qualityFromScore(score)

    const {
      ELBOW_ANGLE_TOP,
      ELBOW_ANGLE_BOTTOM,
      ELBOW_ANGLE_ECCENTRIC_START,
      ELBOW_ANGLE_CONCENTRIC_END,
    } = PUSHUP_THRESHOLDS

    switch (this.currentPhase) {
      case 'start':
        if (elbowAngle > ELBOW_ANGLE_TOP) {
          this.currentPhase = 'top'
          this.lastRepStartTime = pose.timestamp
        }
        break

      case 'top':
        if (elbowAngle < ELBOW_ANGLE_ECCENTRIC_START) {
          this.currentPhase = 'eccentric'
        }
        break

      case 'eccentric':
        if (elbowAngle <= ELBOW_ANGLE_BOTTOM) {
          this.currentPhase = 'bottom'
        }
        // If user goes back up without reaching bottom
        if (elbowAngle > ELBOW_ANGLE_TOP) {
          this.currentPhase = 'top'
        }
        break

      case 'bottom':
        if (elbowAngle > ELBOW_ANGLE_CONCENTRIC_END) {
          this.currentPhase = 'concentric'
        }
        break

      case 'concentric':
        if (elbowAngle > ELBOW_ANGLE_TOP) {
          this.currentPhase = 'top'
          this.repCount++

          const now = pose.timestamp
          this.repHistory.push({
            number: this.repCount,
            startTime: this.lastRepStartTime,
            endTime: now,
            duration: now - this.lastRepStartTime,
            quality,
            formScore: score,
            feedback,
          })
          this.lastRepStartTime = now
        }
        break
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

    // Check if hips are too high (pike position)
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
