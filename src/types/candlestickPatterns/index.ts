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
