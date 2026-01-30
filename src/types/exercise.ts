export type ExerciseCategory = 'upper-body' | 'lower-body' | 'core' | 'full-body'

export type ExerciseDetectorType = 'pushup' | 'bicep-curl' | 'alternating-bicep-curl' | 'squat'

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  description: string
  thumbnailUrl: string | null
  detectorType: ExerciseDetectorType
  createdAt: string
}
