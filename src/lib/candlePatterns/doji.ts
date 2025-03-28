import { SIGNAL_DIRECTION } from '../../constants/signals';
import { ICandle } from '../../types';
import { IDojiConfig } from '../../types/candlestickPatterns';

/**
 * Detects a Doji candlestick pattern, indicating market indecision.
 *
 * A Doji occurs when the open and close prices are nearly identical, making the body very small
 * relative to the overall range (high - low).
 *
 * @param candle - The candle to evaluate.
 * @param config - Optional configuration to specify the Doji detection threshold.
 * @returns A SIGNAL_DIRECTION:
 *          - `BIDIRECTIONAL` if a Doji is detected.
 *          - `NONE` otherwise.
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * const signal = ta.CandlestickPatterns.getDojiPatternDirection(candle, { threshold: 0.05 });
 * ```
 */
export const getDojiPatternDirection = (candle: ICandle, config: IDojiConfig = {}): SIGNAL_DIRECTION => {
  const { open, close, high, low } = candle;
  const threshold = config.threshold ?? 0.1;

  const bodySize = Math.abs(close - open);
  const range = high - low;

  if (range === 0) return SIGNAL_DIRECTION.NONE;

  const bodyToRangeRatio = bodySize / range;

  const isDoji = bodyToRangeRatio <= threshold;

  return isDoji ? SIGNAL_DIRECTION.BIDIRECTIONAL : SIGNAL_DIRECTION.NONE;
};
