import { TIME_PERIODS } from '../constants/time'
import { INakedPointOfControl, IValueArea } from './valueArea.types'
import { ICandle } from './candle.types'

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

/**
 * Contains detailed findings from a single session or period's volume profile analysis.
 *
 * @property {number} startOfDay - The starting timestamp of the day (or session) being analysed.
 * @property {IValueArea} valueArea - The value area containing key price levels where a significant portion of trading activity occurred.
 * @property {IInitialBalance} IB - The initial balance representing the range of the first hour of trading.
 * @property {IVolumeProfileObservation[]} failedAuction - Observations indicating failed auction scenarios.
 * @property {IVolumeProfileObservation[]} excess - Observations of excess points, typically indicating price rejection.
 * @property {IVolumeProfileObservation[]} poorHighLow - Observations of poor high and low points, indicating weak price levels.
 * @property {IVolumeProfileObservation[]} singlePrints - Observations of single print areas, often suggesting strong directional moves.
 * @property {IVolumeProfileObservation[]} ledges - Observations of small areas of horizontal development (ledges).
 */
export interface IVolumeProfile {
  startOfDay?: number
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
 * @property {TIME_PERIODS} period - Specifies the time period over which the volume profile is calculated.
 *                                   Can be day, week, or month.
 * @property {ICandle[]} candles - An array of candle objects representing the price data over a specific time period.
 * @property {number} tickSize - The size of a single tick, which is the smallest measurable movement in the price of the trading asset.
 */
export interface IVolumeProfileConfig {
  period?: TIME_PERIODS
  candles: ICandle[]
  tickSize: number
}
