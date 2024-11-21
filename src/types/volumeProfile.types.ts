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
 * Configuration used for building Volume Profile.
 *
 * @interface IVolumeProfileConfig
 * @property {ICandle[]} candles - Candle Array.
 * @property {MARKET_PROFILE_PERIODS} period - Specifies the time period over which the Volume Profile is calculated.
 * @property {number} tickSize - The minimum price increment defining price level resolution, e.g., 0.1 for BTCUSDT.
 * @property {string} timezone - The timezone to use for time-based calculations, e.g., 'Europe/London'.
 * @property {number} valueAreaRowSize - The number of Value Area rows.
 * @property {number} valueAreaVolume - The Value Area percentage.
 */
export interface IVolumeProfileConfig {
  candles: ICandle[]
  period: MARKET_PROFILE_PERIODS
  tickSize: number
  timezone: string
  valueAreaRowSize?: number;
  valueAreaVolume?: number;
}
