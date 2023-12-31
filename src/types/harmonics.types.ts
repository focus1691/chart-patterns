import { IZigZag } from './zigzags.types'
import { HARMONIC_PATTERNS } from '../constants/harmonics'

/**
 * Represents a harmonic pattern extended from an XABCD pattern with additional properties.
 *
 * @property {HARMONIC_PATTERNS} type - The specific type of harmonic pattern, e.g., Gartley, Butterfly, etc.
 * @property {boolean} isDeveloping - Indicates whether the pattern is currently developing or completed.
 * @property {number} lastTimestamp - The timestamp of the last point in the pattern, useful for tracking the pattern's progression over time.
 */
export interface IHarmonic extends IXABCDPattern {
  type: HARMONIC_PATTERNS
  isDeveloping: boolean
  lastTimestamp?: number
}

/**
 * Represents the XABCD pattern with its points and calculated ratios, typically used in harmonic pattern analysis.
 *
 * @property {IZigZag} X - The starting point of the XABCD pattern.
 * @property {IZigZag} A - The second point of the XABCD pattern.
 * @property {IZigZag} B - The third point of the XABCD pattern.
 * @property {IZigZag} C - The fourth point of the XABCD pattern.
 * @property {IZigZag} D - The fifth and final point of the XABCD pattern.
 * @property {number} XAB - The ratio of the AB segment to the XA segment.
 * @property {number} ABC - The ratio of the BC segment to the AB segment.
 * @property {number} BCD - The ratio of the CD segment to the BC segment.
 * @property {number} XAD - The ratio of the XD segment to the XA segment.
 * @property {number} error - The error rate in the pattern recognition process.
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
 * Defines the acceptable ratio ranges for each segment in an XABCD pattern, used in harmonic pattern analysis.
 *
 * @property {[number, number]} XAB - The acceptable minimum and maximum ratio range for the AB segment relative to the XA segment.
 * @property {[number, number]} ABC - The acceptable minimum and maximum ratio range for the BC segment relative to the AB segment.
 * @property {[number, number]} BCD - The acceptable minimum and maximum ratio range for the CD segment relative to the BC segment.
 * @property {[number, number]} XAD - The acceptable minimum and maximum ratio range for the XD segment relative to the XA segment.
 */
export interface IXABCDRatio {
  XAB: [number, number]
  ABC: [number, number]
  BCD: [number, number]
  XAD: [number, number]
}
