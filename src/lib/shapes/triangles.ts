import { TRIANGLE_PATTERNS } from '../../constants/triangle'
import { ITrianglePattern } from '../../types/triangle.types'
import { IZigZag } from '../../types/zigzags.types'

export function findTrianglePatterns(zigzags: IZigZag[]): ITrianglePattern[] {
  const trianglePatterns: ITrianglePattern[] = []
  let startIndex = 0

  while (startIndex <= zigzags.length - 5) {
    let endIndex = startIndex + 4
    let currentPatternType: TRIANGLE_PATTERNS | null = null

    while (endIndex < zigzags.length) {
      const tempPoints = zigzags.slice(startIndex, endIndex + 1)
      let isTriangle = false

      if (isAscendingTriangle(tempPoints)) {
        currentPatternType = TRIANGLE_PATTERNS.ASCENDING
        isTriangle = true
      } else if (isDescendingTriangle(tempPoints)) {
        currentPatternType = TRIANGLE_PATTERNS.DESCENDING
        isTriangle = true
      } else if (isSymmetricalTriangle(tempPoints)) {
        currentPatternType = TRIANGLE_PATTERNS.SYMMETRICAL
        isTriangle = true
      }

      if (!isTriangle) {
        if (currentPatternType) {
          trianglePatterns.push(createTrianglePattern(currentPatternType, zigzags.slice(startIndex, endIndex)))
        }
        startIndex = endIndex // Move to next point after the last checked endIndex
        break
      }

      endIndex++
    }

    // If we've reached the end of the array and a pattern is forming
    if (endIndex >= zigzags.length && currentPatternType) {
      trianglePatterns.push(createTrianglePattern(currentPatternType, zigzags.slice(startIndex, endIndex)))
    }

    // Increment startIndex to prevent infinite loop
    if (endIndex >= zigzags.length || !currentPatternType) {
      startIndex++
    }
  }

  return trianglePatterns
}

function createTrianglePattern(type: TRIANGLE_PATTERNS, points: IZigZag[]): ITrianglePattern {
  return {
    type: type,
    points: points,
    isComplete: points.length >= 5,
    lastTimestamp: points[points.length - 1].timestamp
  }
}

function isAscendingTriangle(points: IZigZag[]): boolean {
  for (let i = 2; i < points.length; i += 2) {
    if (points[i].price <= points[i - 2].price) {
      return false
    }
  }
  return true
}

function isDescendingTriangle(points: IZigZag[]): boolean {
  for (let i = 1; i < points.length; i += 2) {
    // Check if both current and previous points are defined
    if (points[i] && points[i - 2] && points[i].price >= points[i - 2].price) {
      return false
    }
  }
  return true
}

function isSymmetricalTriangle(points: IZigZag[], tolerance: number = 0.05): boolean {
  const firstPeakPrice = points[1].price
  for (let i = 3; i < points.length; i += 2) {
    if (Math.abs(points[i].price - firstPeakPrice) / firstPeakPrice > tolerance) {
      return false
    }
  }
  return true
}
