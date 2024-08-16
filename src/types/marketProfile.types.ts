import { MARKET_PROFILE_PERIODS } from '../constants'
import { ICandle } from './candle.types'
import { IValueArea } from './valueArea.types'
import { IInitialBalance, IVolumeProfileObservation } from './volumeProfile.types'

export interface IMarketProfile {
  structure: IMarketProfileStructure
  startTime: string | number | Date
  endTime: string | number | Date
  valueArea?: IValueArea
  IB?: IInitialBalance
  failedAuction?: IVolumeProfileObservation[]
  excess?: IVolumeProfileObservation[]
  poorHighLow?: IVolumeProfileObservation[]
  singlePrints?: IVolumeProfileObservation[]
  ledges?: IVolumeProfileObservation[]
}

export interface IMarketProfileStructure {
  startTime: string | number | Date
  endTime: string | number | Date
}

export interface IMarketProfileBuilderConfig {
  candles: ICandle[]
  period: MARKET_PROFILE_PERIODS
  tickSize: number
  tickMultiplier: number
  timezone: string
}

export interface ITimeFrame {
  timeFrameKey?: string
  startTime: string | number | Date
  endTime: string | number | Date
  candles: ICandle[]
}
