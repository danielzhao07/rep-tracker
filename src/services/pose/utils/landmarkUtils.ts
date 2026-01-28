import type { Landmark, Pose } from '@/types'
import { LANDMARK_INDEX } from '@/types'

export function getLandmark(pose: Pose, name: string): Landmark {
  const index = LANDMARK_INDEX[name]
  if (index === undefined || !pose.landmarks[index]) {
    return { x: 0, y: 0, z: 0, visibility: 0 }
  }
  return pose.landmarks[index]
}

export function areLandmarksVisible(
  pose: Pose,
  names: string[],
  threshold = 0.5
): boolean {
  return names.every((name) => {
    const landmark = getLandmark(pose, name)
    return landmark.visibility >= threshold
  })
}

export function getBestSide(pose: Pose): 'left' | 'right' {
  const leftShoulder = getLandmark(pose, 'LEFT_SHOULDER')
  const rightShoulder = getLandmark(pose, 'RIGHT_SHOULDER')
  const leftElbow = getLandmark(pose, 'LEFT_ELBOW')
  const rightElbow = getLandmark(pose, 'RIGHT_ELBOW')

  const leftVisibility =
    (leftShoulder.visibility + leftElbow.visibility) / 2
  const rightVisibility =
    (rightShoulder.visibility + rightElbow.visibility) / 2

  return leftVisibility >= rightVisibility ? 'left' : 'right'
}
