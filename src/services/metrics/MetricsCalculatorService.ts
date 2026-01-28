import type { Rep, FormAnalysis } from '@/types'

export class MetricsCalculatorService {
  analyzeForm(reps: Rep[]): FormAnalysis {
    if (reps.length === 0) {
      return {
        overallScore: 0,
        consistency: 0,
        rangeOfMotion: 0,
        tempo: 'good',
        issues: [],
      }
    }

    const scores = reps.map((r) => r.formScore)
    const overallScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    )

    const consistency = this.calculateConsistency(reps)
    const rangeOfMotion = this.estimateROM(reps)
    const tempo = this.analyzeTempo(reps)

    const issues = this.collectIssues(reps)

    return {
      overallScore,
      consistency,
      rangeOfMotion,
      tempo,
      issues,
    }
  }

  calculateTimePerRep(reps: Rep[]): number[] {
    return reps.map((r) => r.duration / 1000)
  }

  calculateAverageTimePerRep(reps: Rep[]): number {
    if (reps.length === 0) return 0
    const times = this.calculateTimePerRep(reps)
    return times.reduce((a, b) => a + b, 0) / times.length
  }

  private calculateConsistency(reps: Rep[]): number {
    if (reps.length < 2) return 100

    const durations = reps.map((r) => r.duration)
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length
    const variance =
      durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
      durations.length
    const stdDev = Math.sqrt(variance)
    const cv = (stdDev / mean) * 100

    // Lower coefficient of variation = more consistent
    return Math.max(0, Math.round(100 - cv))
  }

  private estimateROM(reps: Rep[]): number {
    const goodReps = reps.filter((r) => r.quality === 'good').length
    return Math.round((goodReps / reps.length) * 100)
  }

  private analyzeTempo(reps: Rep[]): 'too-fast' | 'good' | 'too-slow' {
    if (reps.length === 0) return 'good'

    const avgDuration =
      reps.reduce((sum, r) => sum + r.duration, 0) / reps.length

    if (avgDuration < 1000) return 'too-fast'
    if (avgDuration > 5000) return 'too-slow'
    return 'good'
  }

  private collectIssues(reps: Rep[]): FormAnalysis['issues'] {
    const issueCounts: Record<string, number> = {}

    for (const rep of reps) {
      for (const feedback of rep.feedback) {
        if (feedback !== 'Good form!') {
          issueCounts[feedback] = (issueCounts[feedback] || 0) + 1
        }
      }
    }

    return Object.entries(issueCounts)
      .filter(([, count]) => count >= 2)
      .map(([message, count]) => ({
        severity: count > reps.length / 2 ? 'error' as const : 'warning' as const,
        message: `${message} (${count}/${reps.length} reps)`,
        timestamp: Date.now(),
      }))
  }
}
