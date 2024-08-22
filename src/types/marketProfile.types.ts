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

/**
 * Configuration interface for building a Market Profile.
 *
 * @interface IMarketProfileBuilderConfig
 * @property {ICandle[]} candles - An array of candle objects.
 * @property {MARKET_PROFILE_PERIODS} period - The time period for which to generate the market profile.
 * @property {number} tickSize - The size of each price tick. This determines the granularity
 *   of the price levels in the market profile.
 * @property {number} tickMultiplier - A multiplier applied to the tick size. This can be used
 *   to adjust the scale of the price levels.
 * @property {string} timezone - The timezone to use for time-based calculations, e.g., 'Europe/London'.
 *   This ensures consistent time handling across different market sessions.
 * @property {number} pricePrecision - The number of decimal places to use when rounding prices.
 *   This affects the precision of price levels in the resulting market profile.
 */
export interface IMarketProfileBuilderConfig {
  candles: ICandle[]
  period: MARKET_PROFILE_PERIODS
  tickSize: number
  tickMultiplier: number
  timezone: string
  pricePrecision: number
}

export interface ITimeFrame {
  startTime: string | number | Date
  endTime: string | number | Date
  candles: ICandle[]
}
