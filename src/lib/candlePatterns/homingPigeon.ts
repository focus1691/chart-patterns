import { SIGNAL_DIRECTION } from '../../constants/signals';
import { ICandle } from '../../types';

/**
 * Detects a Homing Pigeon candlestick pattern, a bearish continuation pattern.
 *
 * A Homing Pigeon pattern consists of two consecutive bearish candles where:
 * - Both candles are bearish (close < open)
 * - The second candle is completely inside the range of the first candle
 * - The second candle's body is smaller than the first candle's body
 *
 * This pattern suggests a brief pause in a downtrend before further decline.
 *
 * @param candles - Array of candles to evaluate.
 * @param index - Index of the second candle in the potential pattern.
 * @returns A SIGNAL_DIRECTION:
 *          - `BEARISH` if a Homing Pigeon pattern is detected.
 *          - `NONE` otherwise.
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * const signal = ta.CandlestickPatterns.getHomingPigeonPatternDirection(candles, 5);
 * ```
 */
export const getHomingPigeonPatternDirection = (candles: ICandle[], index: number): SIGNAL_DIRECTION => {
  if (index < 1 || !candles[index] || !candles[index - 1]) {
    return SIGNAL_DIRECTION.NONE;
  }

  const firstCandle = candles[index - 1];
  const secondCandle = candles[index];

  // Both candles must be bearish (close lower than open)
  const isFirstBearish = firstCandle.close < firstCandle.open;
  const isSecondBearish = secondCandle.close < secondCandle.open;

  if (!isFirstBearish || !isSecondBearish) {
    return SIGNAL_DIRECTION.NONE;
  }

  const firstBody = firstCandle.open - firstCandle.close;
  const secondBody = secondCandle.open - secondCandle.close;

  // Second candle body must be smaller than first candle body
  const isSecondBodySmaller = secondBody < firstBody;

  // Second candle must be completely inside the first candle's range
  const isSecondInsideFirst = 
    secondCandle.high <= firstCandle.high && 
    secondCandle.low >= firstCandle.low &&
    secondCandle.open <= firstCandle.open &&
    secondCandle.close >= firstCandle.close;

  if (isSecondBodySmaller && isSecondInsideFirst) {
    return SIGNAL_DIRECTION.BEARISH;
  }

  return SIGNAL_DIRECTION.NONE;
};
