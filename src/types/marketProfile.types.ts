import { LEVEL_ZONE, PRICE_POSITION } from '../constants/levels'
import { MARKET_PROFILE_DAYS, MARKET_PROFILE_OPEN } from '../constants/marketProfile'
import { VALUE_AREA, VALUE_AREA_PERIODS, VALUE_AREA_TENSE } from '../constants/valueArea'
import { ISignal } from '../types/signals.types'
import { INakedPointOfControl, IValueArea } from '../types/valueArea.types'
import { ICandle } from './candle.types'

/**
 * Represents the overall structure of the market profile analysis for a trading session or asset.
 *
 * @property {INakedPointOfControl} npoc - The naked points of control indicating untested price levels with significant past activity.
 * @property {IMarketProfileFindings[]} marketProfiles - An array of detailed market profile findings for individual sessions or periods.
 */
export interface IMarketProfile {
  npoc?: INakedPointOfControl
  marketProfiles?: IMarketProfileFindings[]
}

/**
 * Contains detailed findings from a single session or period's market profile analysis.
 *
 * @property {number} startOfDay - The starting timestamp of the day (or session) being analysed.
 * @property {IValueArea} valueArea - The value area containing key price levels where a significant portion of trading activity occurred.
 * @property {IInitialBalance} IB - The initial balance representing the range of the first hour of trading.
 * @property {IMarketProfileObservation[]} failedAuction - Observations indicating failed auction scenarios.
 * @property {IMarketProfileObservation[]} excess - Observations of excess points, typically indicating price rejection.
 * @property {IMarketProfileObservation[]} poorHighLow - Observations of poor high and low points, indicating weak price levels.
 * @property {IMarketProfileObservation[]} singlePrints - Observations of single print areas, often suggesting strong directional moves.
 * @property {IMarketProfileObservation[]} ledges - Observations of small areas of horizontal development (ledges).
 * @property {MARKET_PROFILE_OPEN} openType - The type of market opening observed.
 * @property {MARKET_PROFILE_DAYS} dayType - The classified type of trading day based on market activity.
 */
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

/**
 * Extends a trading signal with additional market profile specific information.
 *
 * @property {string} period - The specific period or session of the observation.
 * @property {number} peakValue - The peak value associated with the observation.
 * @property {number} troughValue - The trough or lowest value associated with the observation.
 */
export interface IMarketProfileObservation extends ISignal {
  period?: string
  peakValue?: number
  troughValue?: number
}

/**
 * Represents the initial balance of a trading session in market profile, defined by its high and low price points.
 *
 * @property {number} high - The highest price within the initial balance period.
 * @property {number} low - The lowest price within the initial balance period.
 */
export interface IInitialBalance {
  high: number
  low: number
}

/**
 * Maps each trading symbol to its corresponding value areas across different time periods.
 *
 * @property {IValueArea} [VALUE_AREA_PERIODS] - The value area object for a given symbol and period.
 */
export interface IValueAreaSymbols {
  [symbol: string]: {
    [period in VALUE_AREA_PERIODS]?: IValueArea
  }
}

/**
 * Describes the characteristics of a trend for a given period, including its position relative to the value area.
 *
 * @property {VALUE_AREA_PERIODS} period - The period for which the trend characteristics are being described.
 * @property {PRICE_POSITION} position - The position of the price in relation to the value area.
 */
export interface ITrendCharacteristics {
  period: VALUE_AREA_PERIODS
  position: PRICE_POSITION
}

/**
 * Provides detailed information about a specific price level, including its relationship with the value area and market zone type.
 *
 * @property {number} price - The specific price level being described.
 * @property {VALUE_AREA} level - The specific part of the value area this price level corresponds to.
 * @property {LEVEL_ZONE} levelType - The type of level (support or resistance).
 * @property {VALUE_AREA_PERIODS} period - The time period for which the price level is relevant.
 * @property {VALUE_AREA_TENSE} tense - The temporal context of the price level (current or previous).
 */
export interface IPriceLevelInformation {
  price: number
  level?: VALUE_AREA
  levelType: LEVEL_ZONE
  period: VALUE_AREA_PERIODS
  tense: VALUE_AREA_TENSE
}

/**
 * Represents the key price levels in terms of support and resistance for a trading asset.
 *
 * @property {IPriceLevelInformation} support - Detailed information about the support level, including its price, value area relationship, and market zone type.
 * @property {IPriceLevelInformation} resistance - Detailed information about the resistance level, similar in structure to the support level.
 */
export interface IPriceLevels {
  support?: IPriceLevelInformation
  resistance?: IPriceLevelInformation
}

/**
 * Configuration object used for calculating the market profile.
 *
 * @property {ICandle[]} candles - An array of candle objects representing the price data over a specific time period.
 * @property {number} tickSize - The size of a single tick, which is the smallest measurable movement in the price of the trading asset.
 */
export interface IMarketProfileConfig {
  candles: ICandle[]
  tickSize: number
}
