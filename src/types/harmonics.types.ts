import { IZigZag } from './zigzags.types'
import { HARMONIC_PATTERNS } from '../constants/harmonics'

export interface IHarmonic extends IXABCDPattern {
  type: HARMONIC_PATTERNS
  isDeveloping: boolean
  lastTimestamp?: number
}

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

export interface IXABCDRatio {
  XAB: [number, number]
  ABC: [number, number]
  BCD: [number, number]
  XAD: [number, number]
}
