import moment from 'moment';
import { ICandle } from '../../types/candle.types';
import { IPeak } from '../../types/range.types';
import { IZigZag } from '../../types/zigzags.types';
import { ISignalsConfig, IZScoreConfig } from '../../types/peakDetector.types';
import * as PeakDetector from '../peakDetector';

/**
 * Creates an array of ZigZag points based on the provided candlestick data and peak detection configuration.
 *
 * @param {ICandle[]} candles - An array of candlestick data to analyse
 * @param {IZScoreConfig} zScoreConfig - Configuration parameters for the Z-Score algorithm:
 *   - lag: Controls smoothing and adaptability to long-term changes
 *   - threshold: Number of standard deviations required to classify a signal
 *   - influence: How strongly signals affect future calculations (0-1)
 * @returns {IZigZag[]} An array of ZigZag points representing significant price changes
 */
export function create(candles: ICandle[], zScoreConfig: IZScoreConfig): IZigZag[] {
  const zigzags: IZigZag[] = [];
  const config: ISignalsConfig = {
    values: candles.map((candle) => candle.close),
    config: zScoreConfig,
    flatten: false
  };
  const groupedPeaks: IPeak[][] = PeakDetector.findSignals(config) as IPeak[][];

  for (const group of groupedPeaks) {
    const direction: 1 | -1 = group[0].direction;
    let extremeValue: number = direction === 1 ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    let extremeCandle = null;

    for (const peak of group) {
      const candle = candles[peak.position];
      if (direction === 1 && candle.high > extremeValue) {
        extremeValue = candle.high;
        extremeCandle = candle;
      } else if (direction === -1 && candle.low < extremeValue) {
        extremeValue = candle.low;
        extremeCandle = candle;
      }
    }

    if (extremeCandle) {
      const zigzag: IZigZag = {
        direction: direction === 1 ? 'PEAK' : 'TROUGH',
        price: extremeValue,
        timestamp: moment(extremeCandle.openTime).unix()
      };
      zigzags.push(zigzag);
    }
  }
  return zigzags;
}
