import { LEVEL_ZONE } from '../constants/levels'
import { IFibonacciRetracement, zigzagType } from '../constants/range'
import { VALUE_AREA, VALUE_AREA_PERIODS, VALUE_AREA_TENSE } from '../constants/valueArea'

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
