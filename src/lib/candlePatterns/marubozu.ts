import { SIGNAL_DIRECTION } from '../../constants/signals';
import { ICandle } from '../../types';

/**
 * Detects a Marubozu candlestick pattern, indicating strong market conviction.
 *
 * A Marubozu is a candlestick with little to no upper or lower shadows (wicks). It signals
 * strong buyer/seller control throughout the entire period.
 * - Bullish Marubozu (green/white): Strong buying pressure
 * - Bearish Marubozu (red/black): Strong selling pressure
 *
 * @param candle - The candle to evaluate.
 * @param threshold - Optional threshold to specify the shadow size relative to body (default: 0.03).
 * @returns A SIGNAL_DIRECTION:
 *          - `BULLISH` if a bullish Marubozu is detected.
 *          - `BEARISH` if a bearish Marubozu is detected.
 *          - `NONE` otherwise.
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * const signal = ta.CandlestickPatterns.getMarubozuPatternDirection(candle, 0.05);
 * ```
 */
export const getMarubozuPatternDirection = (candle: ICandle, threshold: number = 0.03): SIGNAL_DIRECTION => {
  const { open, close, high, low } = candle;

  const bodySize = Math.abs(close - open);
  const range = high - low;

  if (range === 0 || bodySize === 0) return SIGNAL_DIRECTION.NONE;

  // Calculate shadow sizes relative to body size
  const upperShadow = close > open ? (high - close) / bodySize : (high - open) / bodySize;

  const lowerShadow = close > open ? (open - low) / bodySize : (close - low) / bodySize;

  // Check if both shadows are small enough to qualify as a Marubozu
  const isMarubozu = upperShadow <= threshold && lowerShadow <= threshold;

  if (!isMarubozu) return SIGNAL_DIRECTION.NONE;

  // Determine direction - bullish if close > open, bearish otherwise
  return close > open ? SIGNAL_DIRECTION.BULLISH : SIGNAL_DIRECTION.BEARISH;
};
