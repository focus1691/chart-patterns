import { ICandle } from '../../types/candle.types';
import { IPeak } from '../../types/range.types';
import { IZigZag } from '../../types/zigzags.types';
import { IZScoreConfig } from '../../types/zScore.types';
import * as PeakDetector from '../peakDetector';
import { SIGNAL_DIRECTION } from '../../constants';

/**
 * Creates an array of ZigZag points based on the provided candlestick data and configuration.
 *
 * ZigZag points represent significant market turning points by connecting price extremes,
 * filtering out minor price movements. This implementation uses Z-Score algorithm to
 * identify potential turning points in the price series.
 *
 * @param {ICandle[]} candles - An array of candlestick data to analyse
 * @param {IZScoreConfig} zScoreConfig - Z-Score algorithm parameters containing:
 *   - lag: Controls smoothing and adaptability
 *   - threshold: Number of standard deviations required for signal detection
 *   - influence: How strongly signals affect calculations (0-1)
 * @param {('close' | 'extremes')} priceMethod - Method to determine zigzag price points:
 *   - 'close': Uses closing prices for zigzag points
 *   - 'extremes': Uses high/low prices for zigzag points (default: 'close')
 *
 * @returns {IZigZag[]} An array of ZigZag points with their direction, price, and timestamp
 *
 * @example
 * ```ts
 * const zigzags = create(
 *   candles,
 *   { lag: 5, threshold: 2.5, influence: 0.5 },
 *   'extremes'
 * );
 * ```
 */
export function create(candles: ICandle[], zScoreConfig: IZScoreConfig, priceMethod: 'close' | 'extremes' = 'close'): IZigZag[] {
  const zigzags: IZigZag[] = [];

  const values: number[] = candles.map((candle) => candle.close);
  const peaks: IPeak[] = PeakDetector.findSignals(values, zScoreConfig);

  let lastDirection: number | null = null;
  let extremeValue: number = 0;
  let extremeCandle: ICandle | null = null;

  for (let i = 0; i < peaks.length; i++) {
    const peak = peaks[i];
    if (peak.position === undefined) continue;

    const candle = candles[peak.position];

    if (lastDirection !== peak.direction) {
      if (extremeCandle) {
        zigzags.push({
          direction: lastDirection === 1 ? SIGNAL_DIRECTION.BULLISH : SIGNAL_DIRECTION.BEARISH,
          price: extremeValue,
          timestamp: Math.floor(new Date(extremeCandle.openTime).getTime() / 1000)
        });
      }

      lastDirection = peak.direction;

      // Determine price based on price method
      if (priceMethod === 'extremes') {
        extremeValue = peak.direction === 1 ? candle.high : candle.low;
      } else {
        extremeValue = candle.close;
      }

      extremeCandle = candle;
    } else {
      // Update extreme if needed
      if (priceMethod === 'extremes') {
        if (peak.direction === 1 && candle.high > extremeValue) {
          extremeValue = candle.high;
          extremeCandle = candle;
        } else if (peak.direction === -1 && candle.low < extremeValue) {
          extremeValue = candle.low;
          extremeCandle = candle;
        }
      } else {
        // Using close prices, we update if we find a more extreme close
        if (peak.direction === 1 && candle.close > extremeValue) {
          extremeValue = candle.close;
          extremeCandle = candle;
        } else if (peak.direction === -1 && candle.close < extremeValue) {
          extremeValue = candle.close;
          extremeCandle = candle;
        }
      }
    }
  }

  if (extremeCandle && lastDirection !== null) {
    zigzags.push({
      direction: lastDirection === 1 ? SIGNAL_DIRECTION.BULLISH : SIGNAL_DIRECTION.BEARISH,
      price: extremeValue,
      timestamp: Math.floor(new Date(extremeCandle.openTime).getTime() / 1000)
    });
  }

  return zigzags;
}
