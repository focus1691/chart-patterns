import { ICandle, IValueArea } from './';
import { MARKET_PROFILE_PERIODS } from '../constants';

export interface IVolumeProfile {
  startTime: string | number | Date;
  endTime: string | number | Date;
  valueArea?: IValueArea;
  // IB?: IInitialBalance;
  // failedAuction?: IVolumeProfileObservation[];
  // excess?: IVolumeProfileObservation[];
  // poorHighLow?: IVolumeProfileObservation[];
  // singlePrints?: IVolumeProfileObservation[];
  // ledges?: IVolumeProfileObservation[];
}

/**
 * Extends a trading signal with additional volume profile specific information.
 *
 * @property {string} period - The specific period or session of the observation.
 * @property {number} peakValue - The peak value associated with the observation.
 * @property {number} troughValue - The trough or lowest value associated with the observation.
 */
export interface IVolumeProfileObservation {
  period?: string;
  peakValue?: number;
  troughValue?: number;
}

/**
 * Represents the initial balance of a trading session in volume profile, defined by its high and low price points.
 *
 * @property {number} high - The highest price within the initial balance period.
 * @property {number} low - The lowest price within the initial balance period.
 */
export interface IInitialBalance {
  high: number;
  low: number;
}

/**
 * Configuration used for creating a Volume Profile Session.
 */
export interface IVolumeProfileSessionConfig {
  valueAreaRowSize?: number;
  valueAreaVolume?: number;
  pricePrecision?: number;
  volumePrecision?: number;
}

/**
 * Represents a volume row in the volume profile histogram
 */
export interface IVolumeRow {
  volume: number;
  buyVolume: number;
  sellVolume: number;
  low: number;
  mid: number;
  high: number;
}

/**
 * Represents the complete volume distribution for a session
 */
export interface IVolumeDistribution {
  histogram: IVolumeRow[];
  valueArea: IValueArea;
  totalVolume: number;
  buyVolume: number;
  sellVolume: number;
}

/**
 * Volume distribution with raw trade data
 */
export interface IRawTradeVolumeDistribution extends IVolumeDistribution {
  priceLevels: { price: number, volume: number, buyVolume: number, sellVolume: number }[];
  tradesCount: number;
}
