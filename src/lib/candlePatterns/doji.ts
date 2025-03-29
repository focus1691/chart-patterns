import { SIGNAL_DIRECTION } from '../../constants/signals';
import { ICandle } from '../../types';

/**
 * Detects a Doji candlestick pattern, indicating market indecision.
 *
 * A Doji occurs when the open and close prices are nearly identical, making the body very small
 * relative to the overall range (high - low).
 *
 * @param candle - The candle to evaluate.
 * @param threshold - Optional threshold for the maximum body-to-range ratio to qualify as a Doji.
 * @default 0.1 (10% of the total candle range)
 * @returns A SIGNAL_DIRECTION:
 *          - `BIDIRECTIONAL` if a Doji is detected.
 *          - `NONE` otherwise.
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * const signal = ta.CandlestickPatterns.detectDoji(candle, 0.05);
 * ```
 */
export const detectDoji = (candle: ICandle, threshold = 0.1): SIGNAL_DIRECTION => {
  const { open, close, high, low } = candle;

  const bodySize = Math.abs(close - open);
  const range = high - low;

  if (range === 0) return SIGNAL_DIRECTION.NONE;

  const bodyToRangeRatio = bodySize / range;

  const isDoji = bodyToRangeRatio <= threshold;

  return isDoji ? SIGNAL_DIRECTION.BIDIRECTIONAL : SIGNAL_DIRECTION.NONE;
};
