import { ICandle } from './candle.types'

/**
 * Configuration for finding engulfing candle patterns.
 * This interface defines the structure of the configuration object
 * required to identify engulfing candle patterns in a series of candles.
 */
export interface IEngulfingCandleConfig {
  /**
   * An array of candles to analyse for engulfing patterns.
   * Each candle in the array should conform to the ICandle interface.
   */
  candles: ICandle[]

  /**
   * The index of the specific candle in the `candles` array to check for an engulfing pattern.
   * If not provided, the function will default to checking the last candle in the array.
   */
  index?: number
}
