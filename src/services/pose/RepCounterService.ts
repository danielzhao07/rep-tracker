import type { Pose, RepCountResult, ExerciseDetectorType, Rep } from '@/types'
import { BaseDetector } from './detectors/BaseDetector'
import { PushupDetector } from './detectors/PushupDetector'

export class RepCounterService {
  private detector: BaseDetector

  constructor(exerciseType: ExerciseDetectorType) {
    this.detector = RepCounterService.createDetector(exerciseType)
  }

  private static createDetector(type: ExerciseDetectorType): BaseDetector {
    switch (type) {
      case 'pushup':
        return new PushupDetector()
      default:
        return new PushupDetector()
    }
  }

  processFrame(pose: Pose, timestamp: number): RepCountResult {
    return this.detector.processFrame(pose, timestamp)
  }

  reset(): void {
    this.detector.reset()
  }

  getCurrentCount(): number {
    return this.detector.getCurrentCount()
  }

  getRepHistory(): Rep[] {
    return this.detector.getRepHistory()
  }
}
