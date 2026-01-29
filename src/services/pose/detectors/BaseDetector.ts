import type { Pose, RepPhase, RepQuality, RepCountResult, FormIssue, Rep } from '@/types'

export abstract class BaseDetector {
  protected currentPhase: RepPhase = 'start'
  protected repCount = 0
  protected repHistory: Rep[] = []
  protected lastRepStartTime = 0
  protected frameCount = 0

  abstract readonly keyLandmarks: string[]

  abstract detectRepPhase(pose: Pose): RepCountResult
  abstract validateForm(pose: Pose): { score: number; feedback: string[] }

  processFrame(pose: Pose, _timestamp: number): RepCountResult {
    this.frameCount++
    return this.detectRepPhase(pose)
  }

  reset(): void {
    this.currentPhase = 'start'
    this.repCount = 0
    this.repHistory = []
    this.lastRepStartTime = 0
    this.frameCount = 0
  }

  getCurrentCount(): number {
    return this.repCount
  }

  getRepHistory(): Rep[] {
    return [...this.repHistory]
  }

  getPhase(): RepPhase {
    return this.currentPhase
  }

  // Override in subclass to provide angle for debugging
  getElbowAngle(): number {
    return 0
  }

  protected createFormIssue(
    severity: FormIssue['severity'],
    message: string,
    timestamp: number
  ): FormIssue {
    return { severity, message, timestamp }
  }

  protected qualityFromScore(score: number): RepQuality {
    if (score >= 70) return 'good'
    if (score >= 40) return 'partial'
    return 'poor'
  }
}
