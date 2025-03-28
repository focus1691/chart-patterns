import { EXCESS_TAIL_LENGTH_SIGNIFICANCE, SIGNAL_DIRECTION } from '../../constants';
import { ICandle } from '../../types/candle.types';

/**
 * Determines the directional excess (significant candle tails) for a given candle.
 * An excess candle is identified when the length of either (or both) of its tails
 * significantly exceeds the length of its body.
 *
 * - Long **upper tail** indicates potential bearish pressure.
 * - Long **lower tail** indicates potential bullish pressure.
 * - Excess on both tails indicates market indecision or high volatility.
 *
 * @param candle - The candle to evaluate for excess tails.
 * @returns A SIGNAL_DIRECTION indicating the direction of excess:
 *          - `BULLISH` if there's significant excess on the lower tail.
 *          - `BEARISH` if there's significant excess on the upper tail.
 *          - `BIDIRECTIONAL` if both tails exhibit significant excess.
 *          - `NONE` if no significant excess is detected.
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * const direction: SIGNAL_DIRECTION = CandlestickPatterns.getCandleExcessDirection(candle);
 * ```
 */
export const getCandleExcessDirection = (candle: ICandle): SIGNAL_DIRECTION => {
  const { open, high, low, close } = candle;

  const klineLength = Math.abs(close - open);
  if (klineLength === 0) return SIGNAL_DIRECTION.NONE; // Prevent division by zero

  const upperTail = high - Math.max(open, close);
  const lowerTail = Math.min(open, close) - low;

  const isUpperTailExcess = upperTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE;
  const isLowerTailExcess = lowerTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE;

  if (isUpperTailExcess && isLowerTailExcess) return SIGNAL_DIRECTION.BIDIRECTIONAL;
  if (isUpperTailExcess) return SIGNAL_DIRECTION.BEARISH; // long upper tail = bearish signal
  if (isLowerTailExcess) return SIGNAL_DIRECTION.BULLISH; // long lower tail = bullish signal

  return SIGNAL_DIRECTION.NONE;
};
