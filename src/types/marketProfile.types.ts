import { LEVEL_ZONE, PRICE_POSITION } from '../constants/levels'
import { MARKET_PROFILE_DAYS, MARKET_PROFILE_OPEN } from '../constants/marketProfile'
import { VALUE_AREA, VALUE_AREA_PERIODS, VALUE_AREA_TENSE } from '../constants/valueArea'
import { ISignal } from '../types/signals.types'
import { INakedPointOfControl, IValueArea } from '../types/valueArea.types'
import { ICandle } from './candle.types'

export interface IMarketProfile {
  npoc?: INakedPointOfControl
  marketProfiles?: IMarketProfileFindings[]
}

export interface IMarketProfileFindings {
  startOfDay?: number
  valueArea?: IValueArea
  IB?: IInitialBalance
  failedAuction?: IMarketProfileObservation[]
  excess?: IMarketProfileObservation[]
  poorHighLow?: IMarketProfileObservation[]
  singlePrints?: IMarketProfileObservation[]
  ledges?: IMarketProfileObservation[]
  openType?: MARKET_PROFILE_OPEN
  dayType?: MARKET_PROFILE_DAYS
}

export interface IMarketProfileObservation extends ISignal {
  period?: string
  peakValue?: number
  troughValue?: number
}

export interface IInitialBalance {
  high: number
  low: number
}

export interface IValueAreaSymbols {
  [symbol: string]: {
    [period in VALUE_AREA_PERIODS]?: IValueArea
  }
}

export interface ITrendCharacteristics {
  period: VALUE_AREA_PERIODS
  position: PRICE_POSITION
}

export interface IPriceLevelInformation {
  price: number
  level?: VALUE_AREA
  levelType: LEVEL_ZONE
  period: VALUE_AREA_PERIODS
  tense: VALUE_AREA_TENSE
}

export interface IPriceLevels {
  support?: IPriceLevelInformation
  resistance?: IPriceLevelInformation
}

export interface IMarketProfileConfig {
  candles: ICandle[]
  tickSize: number
}
