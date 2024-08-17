import { ICandle, INakedPointOfControl, IValueArea } from './'
import { MARKET_PROFILE_PERIODS } from '../constants'

/**
 * Represents the overall structure of the volume profile analysis for a trading session or asset.
 *
 * @property {INakedPointOfControl} npoc - The naked points of control indicating untested price levels with significant past activity.
 * @property {IVolumeProfileFindings[]} volumeProfiles - An array of detailed volume profile findings for individual sessions or periods.
 */
export interface IVolumeProfileResult {
  npoc?: INakedPointOfControl
  volumeProfiles?: IVolumeProfile[]
}

export interface IVolumeProfile {
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

/**
 * Extends a trading signal with additional volume profile specific information.
 *
 * @property {string} period - The specific period or session of the observation.
 * @property {number} peakValue - The peak value associated with the observation.
 * @property {number} troughValue - The trough or lowest value associated with the observation.
 */
export interface IVolumeProfileObservation {
  period?: string
  peakValue?: number
  troughValue?: number
}

/**
 * Represents the initial balance of a trading session in volume profile, defined by its high and low price points.
 *
 * @property {number} high - The highest price within the initial balance period.
 * @property {number} low - The lowest price within the initial balance period.
 */
export interface IInitialBalance {
  high: number
  low: number
}

/**
 * Configuration object used for calculating the volume profile.
 *
 * @property {MARKET_PROFILE_PERIODS} period - Specifies the time period over which the volume profile is calculated.
 *                                   Can be day, week, or month.
 * @property {ICandle[]} candles - An array of candle objects representing the price data over a specific time period.
 * @property {number} tickSize - The size of a single tick, which is the smallest measurable movement in the price of the trading asset.
 */
export interface IVolumeProfileConfig {
  candles: ICandle[]
  period: MARKET_PROFILE_PERIODS
  tickSize: number
  timezone: string
}
