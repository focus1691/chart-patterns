import { MARKET_PROFILE_PERIODS, MARKET_PROFILE_OPEN } from '../constants';
import { ICandle } from './candle.types';
import { IValueArea } from './valueArea.types';
import { IInitialBalance, IVolumeProfileObservation } from './volumeProfile.types';

export interface IOpenType {
  type: MARKET_PROFILE_OPEN;
  direction?: 'up' | 'down';
}

export interface IMarketProfile {
  profileDistribution?: Record<string, string>;
  startTime: string | number | Date;
  endTime: string | number | Date;
  valueArea: IValueArea;
  tpoCount: number;
  candleCount: number;
  initialBalance: IInitialBalance | null;
  openType: IOpenType;
  failedAuction?: IVolumeProfileObservation[];
  excess?: IVolumeProfileObservation[];
  poorHighLow?: IVolumeProfileObservation[];
  singlePrints?: IVolumeProfileObservation[];
  ledges?: IVolumeProfileObservation[];
}

/**
 * Configuration interface for building a Market Profile.
 *
 * @interface IMarketProfileBuilderConfig
 * @property {ICandle[]} candles - An array of candle objects.
 * @property {MARKET_PROFILE_PERIODS} candleGroupingPeriod - Group candles into specific timeframe (daily, weekly, monthly).
 * @property {number} tickSize - The size of each price tick. This determines the granularity
 *   of the price levels in the market profile.
 * @property {number} tickMultiplier - A multiplier applied to the tick size. This can be used
 *   to adjust the scale of the price levels.
 * @property {string} timezone - The timezone to use for time-based calculations, e.g., 'Europe/London'.
 *   This ensures consistent time handling across different market sessions.
 * @property {number} pricePrecision - The number of decimal places to use when rounding prices.
 *   This affects the precision of price levels in the resulting market profile.
 * @property {boolean} [includeProfileDistribution=false] - Optional flag to include the full profile distribution data in the returned profiles.
 * @default false
 */
export interface IMarketProfileBuilderConfig {
  candles: ICandle[];
  candleGroupingPeriod: MARKET_PROFILE_PERIODS;
  tickSize: number;
  tickMultiplier: number;
  timezone: string;
  pricePrecision: number;
  includeProfileDistribution?: boolean;
}

export interface ITimeFrame {
  startTime: string | number | Date;
  endTime: string | number | Date;
  candles: ICandle[];
}
