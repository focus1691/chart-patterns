import { ISignal } from '../types/signals.types'
import { ILevelZone } from '../types/levels.types'
import { PRICE_POSITION } from '../constants/levels'
import { VALUE_AREA, VALUE_AREA_PERIODS, VALUE_AREA_TENSE, IValueArea, INakedPointOfControl } from '../types/valueArea.types'

export interface IMarketProfile {
  npoc?: INakedPointOfControl
  marketProfiles?: IMarketProfileFindings[]
}

export interface IMarketProfileFindings {
  startOfPeriod?: number
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
  levelType: ILevelZone
  period: VALUE_AREA_PERIODS
  tense: VALUE_AREA_TENSE
}

export interface IPriceLevels {
  support?: IPriceLevelInformation
  resistance?: IPriceLevelInformation
}

export enum VALUE_AREA_OPEN {
  OPEN_ABOVE_PDVA = 'open_above_pdva',
  OPEN_BELOW_PDVA = 'open_below_pdva'
}

export enum CANDLE_OBSERVATIONS {
  EXCESS = 'excess',
  SINGLE_PRINT = 'single_print',
  FAILED_AUCTION = 'failed_auction',
  POOR_HIGH_LOW = 'poor_high',
  LEDGE = 'ledge'
}

export enum MARKET_PROFILE_OPEN {
  OPEN_DRIVE = 'Open Drive',
  OPEN_TEST_DRIVE = 'Open Test Drive',
  OPEN_REJECTION_REVERSE = 'Open Rejection Reverse',
  OPEN_AUCTION = 'Open Auction'
}

export enum MARKET_PROFILE_DAYS {
  NORMAL = 'normal',
  NEUTRAL = 'neutral',
  TREND = 'trend',
  DOUBLE_DISTRIBUTION = 'double_distribution',
  B_SHAPE = 'b_shape',
  P_SHAPE = 'p_shape'
}
