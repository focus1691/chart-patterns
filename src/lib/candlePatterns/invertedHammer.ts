import { SIGNAL_DIRECTION } from '../../constants/signals';
import { ICandle } from '../../types';

/**
 * Detects an Inverted Hammer or Shooting Star candlestick pattern.
 *
 * These patterns have a small body and a long upper shadow (wick), with little to no lower shadow.
 * - Inverted Hammer: Appears in a downtrend, suggesting potential bullish reversal
 * - Shooting Star: Appears in an uptrend, suggesting potential bearish reversal
 *
 * Both have identical appearance but different context/implications.
 * This function detects the pattern only; trend context should be evaluated separately.
 *
 * @param candle - The candle to evaluate.
 * @param threshold - Optional threshold for upper shadow to body ratio (default: 2.0).
 * @returns A SIGNAL_DIRECTION:
 *          - `BULLISH` if a bullish Inverted Hammer is detected (bullish candle).
 *          - `BEARISH` if a bearish Shooting Star is detected (bearish candle).
 *          - `NONE` if no pattern is detected.
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * const signal = ta.CandlestickPatterns.detectInvertedHammer(candle, 2.5);
 * ```
 */
export const detectInvertedHammer = (candle: ICandle, threshold = 2.0): SIGNAL_DIRECTION => {
  const { open, high, low, close } = candle;

  // Calculate body and shadow sizes
  const bodySize = Math.abs(close - open);
  const upperShadow = high - Math.max(open, close);
  const lowerShadow = Math.min(open, close) - low;

  // Pattern requirements:
  // 1. Upper shadow must be at least {threshold} times larger than the body
  // 2. Lower shadow must be very small (less than 10% of the body)
  // 3. Body size must be non-zero

  if (bodySize === 0) return SIGNAL_DIRECTION.NONE;

  const isLowerShadowSmall = lowerShadow <= bodySize * 0.1;
  const isUpperShadowLong = upperShadow >= bodySize * threshold;

  if (!isUpperShadowLong || !isLowerShadowSmall) {
    return SIGNAL_DIRECTION.NONE;
  }

  // Determine direction based on candle color
  // - Bullish if close > open (green/white candle)
  // - Bearish if close < open (red/black candle)
  return close > open ? SIGNAL_DIRECTION.BULLISH : SIGNAL_DIRECTION.BEARISH;
};
