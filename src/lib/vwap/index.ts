import { ICandle } from '../../types/candle.types';

/**
 * Represents a Volume-Weighted Average Price (VWAP) calculation session.
 * 
 * VWAP is a trading benchmark that represents the average price a security
 * has traded at throughout the day, based on both volume and price.
 * It provides insight into both the trend and value of a security.
 */
class VWAPSession {
  private cumulativeTypicalPriceVolume = 0;
  private cumulativeVolume = 0;
  private pricePrecision: number;

  /**
   * Creates a new VWAP calculation session.
   * 
   * @param pricePrecision - The number of decimal places to round the VWAP value to.
   */
  constructor(pricePrecision: number) {
    this.pricePrecision = pricePrecision;
  }

  /**
   * Processes a single candle and updates the VWAP calculation.
   * 
   * @param candle - The candle data to process.
   */
  processCandle(candle: ICandle) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const volume = candle.volume;

    this.cumulativeTypicalPriceVolume += typicalPrice * volume;
    this.cumulativeVolume += volume;
  }

  /**
   * Calculates and returns the current VWAP value.
   * 
   * @returns The calculated VWAP value rounded to the specified precision, or null if no volume has been processed.
   */
  getVWAP(): number | null {
    if (this.cumulativeVolume === 0) return null;
    const vwap = this.cumulativeTypicalPriceVolume / this.cumulativeVolume;
    return Number(vwap.toFixed(this.pricePrecision));
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
 * @param pricePrecision - The number of decimal places to round the VWAP value to.
 * @returns A new VWAP calculation session.
 * 
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 * 
 * // Create a new VWAP session with 2 decimal places precision
 * const vwapSession = ta.VWAP.createSession(2);
 * 
 * // Process candles
 * for (const candle of candles) {
 *   vwapSession.processCandle(candle);
 * }
 * 
 * // Get the current VWAP value
 * const vwapValue = vwapSession.getVWAP();
 * ```
 */
export function createSession(pricePrecision: number): VWAPSession {
  return new VWAPSession(pricePrecision);
}
