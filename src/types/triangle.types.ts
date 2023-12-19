import { IZigZag } from './zigzags.types'
import { TRIANGLE_PATTERNS } from '../constants/triangle'

export interface ITrianglePattern {
  type: TRIANGLE_PATTERNS
  points: IZigZag[]
  isComplete: boolean
  lastTimestamp: number
}
