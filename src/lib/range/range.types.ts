import { VALUE_AREA, VALUE_AREA_PERIODS, VALUE_AREA_TENSE } from '@technical-analysis/valueArea/valueArea.types'
import { LEVEL_ZONE } from '@technical-analysis/levels/levels.types'

export interface ILocalRangeDescription {
  price: number
  level: VALUE_AREA
  levelType: LEVEL_ZONE
  period: VALUE_AREA_PERIODS
  tense: VALUE_AREA_TENSE
}

export interface IRanges {
  local?: ILocalRange[]
  global?: ILocalRange
}

export interface ILocalRange {
  support?: number
  resistance?: number
  start?: number | string
  end?: number | string
  bias?: bias
  fibs?: {
    highLow?: IFibonacciRetracement
    lowHigh?: IFibonacciRetracement
  }
}

export type bias = 'BULLISH' | 'BEARISH'

export interface IPeak {
  position?: number
  direction: -1 | 1
}

export interface IPeakRange extends IPeak {
  start?: number
  end?: number
}

export interface IZigZag {
  price: number
  direction: zigzagType
  timestamp: number | string
}

export type zigzagType = 'PEAK' | 'TROUGH'

export interface IFibonacciRetracement {
  0: number | null
  0.236: number | null
  0.382: number | null
  0.5: number | null
  0.618: number | null
  0.66: number | null
  0.786: number | null
  1: number | null
  1.618: number | null
}

export enum FIBONACCI_NUMBERS {
  ZERO = 0,
  TWO_THREE_SIX = 0.236,
  THREE_EIGHT_TWO = 0.382,
  FIVE = 0.5,
  SIX_ONE_EIGHT = 0.618,
  SIX_SIX = 0.66,
  SEVEN_EIGHT_SIX = 0.786,
  ONE = 1,
  ONE_SIX_EIGHT = 1.618
}
