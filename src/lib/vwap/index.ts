import { ICandle } from '../../types/candle.types';
import { VWAPResult } from '../../types/vwap.types';

/**
 * Represents a Volume-Weighted Average Price (VWAP) calculation session.
 *
 * VWAP is a trading benchmark that represents the average price a security
 * has traded at throughout the day, based on both volume and price.
 * It provides insight into both the trend and value of a security.
 *
 * @class VWAPSession
 */
class VWAPSession {
  /** Cumulative sum of typical price multiplied by volume */
  private cumulativeTypicalPriceVolume = 0;
  /** Cumulative sum of volume */
  private cumulativeVolume = 0;
  /** Number of decimal places to round VWAP values to */
  private pricePrecision: number;
  /** Array of typical prices for each processed candle */
  private typicalPrices: number[] = [];
  /** Array of volumes for each processed candle */
  private volumes: number[] = [];
  /** Multiplier for standard deviation bands */
  private deviationMultiplier: number;
  /** Maximum number of candles to store in the session */
  private maxSize: number;

  // Welford's algorithm variables for online variance calculation
  /** Mean of the weighted values for Welford's algorithm */
  private mean = 0;
  /** M2 aggregator for Welford's algorithm */
  private m2 = 0;
  /** Total weight (sum of volumes) for Welford's algorithm */
  private totalWeight = 0;

  /**
   * Creates a new VWAP calculation session.
   *
   * @param pricePrecision - The number of decimal places to round the VWAP value to
   * @param deviationMultiplier - The multiplier for standard deviation bands (default: 1)
   * @param maxSize - Maximum number of candles to keep in the session (default: 1000)
   */
  constructor(pricePrecision: number, deviationMultiplier: number = 1, maxSize: number = 1000) {
    this.pricePrecision = pricePrecision;
    this.deviationMultiplier = deviationMultiplier;
    this.maxSize = maxSize;
  }

  /**
   * Processes a single candle and updates the VWAP calculation.
   *
   * @param candle - The candle data to process
   * @returns void
   */
  processCandle(candle: ICandle): void {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const volume = candle.volume;

    // Apply rolling window if we've reached max size
    if (this.typicalPrices.length >= this.maxSize) {
      const oldestPrice = this.typicalPrices.shift();
      const oldestVolume = this.volumes.shift();

      // Adjust cumulative values by removing oldest entry
      this.cumulativeTypicalPriceVolume -= oldestPrice * oldestVolume;
      this.cumulativeVolume -= oldestVolume;

      // Update Welford's algorithm for removing oldest value
      if (this.cumulativeVolume > 0) {
        this.updateWelfordRemove(oldestPrice, oldestVolume);
      } else {
        // Reset Welford's state if all data is removed
        this.mean = 0;
        this.m2 = 0;
        this.totalWeight = 0;
      }
    }

    this.typicalPrices.push(typicalPrice);
    this.volumes.push(volume);
    this.cumulativeTypicalPriceVolume += typicalPrice * volume;
    this.cumulativeVolume += volume;

    // Update Welford's algorithm for new value
    this.updateWelfordAdd(typicalPrice, volume);
  }

  /**
   * Updates Welford's algorithm when adding a new value.
   *
   * @private
   * @param value - The typical price value to add
   * @param weight - The volume weight for this value
   * @returns void
   */
  private updateWelfordAdd(value: number, weight: number): void {
    if (weight === 0) return;

    // Incremental calculation for weighted mean and variance
    const oldTotalWeight = this.totalWeight;
    this.totalWeight += weight;

    if (this.totalWeight > 0) {
      const newMeanIncrement = (value - this.mean) * (weight / this.totalWeight);
      const newMean = this.mean + newMeanIncrement;
      const newM2Increment = weight * (value - this.mean) * (value - newMean);

      this.mean = newMean;
      this.m2 += newM2Increment;
    }
  }

  /**
   * Updates Welford's algorithm when removing a value (for sliding window).
   *
   * @private
   * @param value - The typical price value to remove
   * @param weight - The volume weight for this value
   * @returns void
   */
  private updateWelfordRemove(value: number, weight: number): void {
    if (weight === 0 || this.totalWeight <= weight) {
      this.mean = 0;
      this.m2 = 0;
      this.totalWeight = 0;
      return;
    }

    // Downdating algorithm for removing values from Welford's
    const oldMean = this.mean;
    this.totalWeight -= weight;

    if (this.totalWeight > 0) {
      this.mean = this.mean + ((this.mean - value) * weight) / this.totalWeight;
      // Use direct delta calculation instead of Math.pow
      const delta = value - oldMean;
      this.m2 -= weight * delta * delta * (this.totalWeight / (this.totalWeight + weight));
      this.m2 = Math.max(0, this.m2); // Ensure m2 doesn't go negative due to floating point
    }
  }

  /**
   * Calculates the standard deviation using Welford's algorithm.
   *
   * @private
   * @returns The standard deviation or null if insufficient data
   */
  private calculateStandardDeviation(): number | null {
    if (this.totalWeight <= 0) {
      return null;
    }

    const variance = this.m2 / this.totalWeight;
    const standardDeviation = Math.sqrt(variance);

    return Number(standardDeviation.toFixed(this.pricePrecision));
  }

  /**
   * Resets the VWAP calculation session.
   *
   * @returns void
   */
  reset(): void {
    this.cumulativeTypicalPriceVolume = 0;
    this.cumulativeVolume = 0;
    this.typicalPrices = [];
    this.volumes = [];
    this.mean = 0;
    this.m2 = 0;
    this.totalWeight = 0;
  }

  /**
   * Optional method to reset and shrink arrays to free memory.
   * Useful in memory-sensitive environments.
   *
   * @returns void
   */
  resetAndShrink(): void {
    this.reset();
    // Free memory by replacing with new empty arrays
    this.typicalPrices = [];
    this.volumes = [];
  }

  /**
   * Gets the raw VWAP value without standard deviation bands.
   *
   * @returns The calculated VWAP value or null if no data is available
   */
  getRawVWAP(): number | null {
    if (this.cumulativeVolume === 0) {
      return null;
    }

    const vwap = this.cumulativeTypicalPriceVolume / this.cumulativeVolume;
    return Number(vwap.toFixed(this.pricePrecision));
  }

  /**
   * Calculates and returns the current VWAP value with standard deviation bands.
   *
   * @returns Object containing VWAP, upper band, and lower band values
   */
  getVWAP(): VWAPResult {
    const vwap = this.getRawVWAP();

    if (vwap === null) {
      return { vwap: null, upperBand: null, lowerBand: null };
    }

    const stdDev = this.calculateStandardDeviation();

    if (stdDev === null) {
      return { vwap, upperBand: null, lowerBand: null };
    }

    const deviation = stdDev * this.deviationMultiplier;
    const upperBand = Number((vwap + deviation).toFixed(this.pricePrecision));
    const lowerBand = Number((vwap - deviation).toFixed(this.pricePrecision));

    return { vwap, upperBand, lowerBand };
  }
}

/**
 * Creates a new VWAP calculation session.
 *
 * The Volume-Weighted Average Price (VWAP) is a trading benchmark that shows the ratio of the value
 * traded to total volume traded over a specific time period. It's calculated by adding up the dollars
 * traded for every transaction (price multiplied by the number of shares traded) and then dividing
 * by the total shares traded.
 *
 * @param pricePrecision - The number of decimal places to round the VWAP value to
 * @param deviationMultiplier - The multiplier for standard deviation bands (default: 2)
 * @param maxSize - Maximum number of candles to keep in the session (default: 1000)
 * @returns A new VWAP calculation session
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * // Create a new VWAP session with 2 decimal places precision, 2 standard deviations, and max 1000 candles
 * const vwapSession = ta.VWAP.createSession(2, 2, 1000);
 *
 * // Process candles
 * for (const candle of candles) {
 *   vwapSession.processCandle(candle);
 * }
 *
 * // Get just the raw VWAP value without bands
 * const vwapValue = vwapSession.getRawVWAP();
 *
 * // Get the current VWAP value with standard deviation bands
 * const { vwap, upperBand, lowerBand } = vwapSession.getVWAP();
 *
 * // Reset the session (e.g., at the start of a new trading day)
 * vwapSession.reset();
 *
 * // Reset and free memory in memory-sensitive environments
 * vwapSession.resetAndShrink();
 * ```
 */
export function createSession(pricePrecision: number, deviationMultiplier: number = 1, maxSize: number = 1000): VWAPSession {
  return new VWAPSession(pricePrecision, deviationMultiplier, maxSize);
}
