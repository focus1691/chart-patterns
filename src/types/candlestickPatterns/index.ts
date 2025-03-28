/**
 * Configuration for finding engulfing candle patterns.
 * This interface defines the structure of the configuration object
 * required to identify engulfing candle patterns in a series of candles.
 */
export interface IEngulfingPatternConfig {
  /**
   * The index of the specific candle in the `candles` array to check for an engulfing pattern.
   * If not provided, the function will default to checking the last candle in the array.
   */
  index?: number;
}

export interface IDojiConfig {
  /**
   * Threshold for the maximum body-to-range ratio to qualify as a Doji.
   * Default is 0.1 (10% of the total candle range).
   */
  threshold?: number;
}
