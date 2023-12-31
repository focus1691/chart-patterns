import { IZigZag } from './zigzags.types'
import { HARMONIC_PATTERNS } from '../constants/harmonics'

/**
 * Represents a harmonic pattern extended from an XABCD pattern with additional properties.
 */
export interface IHarmonic extends IXABCDPattern {
  type: HARMONIC_PATTERNS
  isDeveloping: boolean
  lastTimestamp?: number
}

/**
 * Represents the XABCD pattern with its points and calculated ratios.
 */
export interface IXABCDPattern {
  X: IZigZag
  A: IZigZag
  B: IZigZag
  C: IZigZag
  D?: IZigZag
  XAB: number
  ABC: number
  BCD: number
  XAD: number
  error?: number
}

/**
 * Defines the acceptable ratio ranges for each segment in an XABCD pattern.
 */
export interface IXABCDRatio {
  XAB: [number, number]
  ABC: [number, number]
  BCD: [number, number]
  XAD: [number, number]
}
