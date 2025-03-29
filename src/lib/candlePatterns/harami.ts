import { SIGNAL_DIRECTION } from '../../constants/signals';
import { ICandle } from '../../types';

/**
 * Detects a Harami candlestick pattern, which can be either bearish or bullish.
 *
 * A Harami pattern consists of two candles where:
 * - The first and second candles have opposite directions
 * - The second candle's body is completely contained within the first candle's body
 * - The second candle's body is smaller than the first candle's body
 *
 * Bearish Harami: First candle is bullish, second is bearish - potential reversal of uptrend
 * Bullish Harami: First candle is bearish, second is bullish - potential reversal of downtrend
 *
 * @param candles - Array of candles to evaluate.
 * @param index - Index of the second candle in the potential pattern.
 * @returns A SIGNAL_DIRECTION:
 *          - `BEARISH` if a bearish Harami pattern is detected.
 *          - `BULLISH` if a bullish Harami pattern is detected.
 *          - `NONE` otherwise.
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * const signal = ta.CandlestickPatterns.detectHarami(candles, 5);
 * ```
 */
export const detectHarami = (candles: ICandle[], index: number): SIGNAL_DIRECTION => {
  if (index < 1 || !candles[index] || !candles[index - 1]) {
    return SIGNAL_DIRECTION.NONE;
  }

  const firstCandle = candles[index - 1];
  const secondCandle = candles[index];

  // Check candle directions
  const isFirstBearish = firstCandle.close < firstCandle.open;
  const isFirstBullish = firstCandle.close > firstCandle.open;
  const isSecondBearish = secondCandle.close < secondCandle.open;
  const isSecondBullish = secondCandle.close > secondCandle.open;

  // Candles must have opposite directions
  const isBearishHarami = isFirstBullish && isSecondBearish;
  const isBullishHarami = isFirstBearish && isSecondBullish;

  if (!isBearishHarami && !isBullishHarami) {
    return SIGNAL_DIRECTION.NONE;
  }

  // Calculate body sizes
  const firstBody = Math.abs(firstCandle.open - firstCandle.close);
  const secondBody = Math.abs(secondCandle.open - secondCandle.close);

  // Second candle body must be smaller than first candle body
  const isSecondBodySmaller = secondBody < firstBody;

  // Check if second candle body is inside first candle body
  const isSecondInsideFirst =
    Math.max(secondCandle.open, secondCandle.close) <= Math.max(firstCandle.open, firstCandle.close) &&
    Math.min(secondCandle.open, secondCandle.close) >= Math.min(firstCandle.open, firstCandle.close);

  if (isSecondBodySmaller && isSecondInsideFirst) {
    return isBullishHarami ? SIGNAL_DIRECTION.BULLISH : SIGNAL_DIRECTION.BEARISH;
  }

  return SIGNAL_DIRECTION.NONE;
};
