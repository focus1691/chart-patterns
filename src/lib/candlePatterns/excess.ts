import { EXCESS_TAIL_LENGTH_SIGNIFICANCE } from '../../constants/marketProfile'
import { ICandle } from '../../types/candle.types'

/**
 * Determines whether a candle is an excess candle.
 * An excess candle is identified by the length of its tails relative to its body.
 * 
 * @param candle - The candle to check for excess.
 * @returns True if the candle is an excess candle, otherwise false.
 * 
 * @example
 * ```typescript
 * import { CandlestickPatterns } from '@focus1691/chart-patterns';
 * 
 * // Assuming 'candle' is an ICandle object
 * const isExcessCandle: boolean = CandlestickPatterns.isExcess(candle);
 * ```
 */
export const isExcess = (candle: ICandle): boolean => {
  const open: number = candle.open
  const high: number = candle.high
  const low: number = candle.low
  const close: number = candle.close
  const klineLength: number = Math.abs(close - open)
  const klineUpperTail: number = Math.abs(close - high)
  const klineLowerTail: number = Math.abs(close - low)

  const isUpperTailExcess: boolean = klineUpperTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE
  const isLowerTailExcess: boolean = klineLowerTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE

  return isUpperTailExcess || isLowerTailExcess
}
