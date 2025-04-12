import moment from 'moment';
import { ICandle } from '../../types/candle.types';
import { IPeak } from '../../types/range.types';
import { IZigZag, ZigZagConfig } from '../../types/zigzags.types';
import { ISignalsConfig } from '../../types/peakDetector.types';
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
 * @param {ZigZagConfig} config - Configuration for zigzag calculation:
 *   - lag: Controls smoothing and adaptability (from Z-Score)
 *   - threshold: Number of standard deviations required (from Z-Score)
 *   - influence: How strongly signals affect calculations (from Z-Score)
 *   - priceMethod: Method to determine zigzag price points ('close' or 'extremes')
 * 
 * @returns {IZigZag[]} An array of ZigZag points with their direction, price, and timestamp
 * 
 * @example
 * ```ts
 * const zigzags = create(candles, {
 *   lag: 5, 
 *   threshold: 2.5, 
 *   influence: 0.5,
 *   priceMethod: 'extremes'
 * });
 * ```
 */
export function create(candles: ICandle[], config: ZigZagConfig): IZigZag[] {
  const zigzags: IZigZag[] = [];
  
  // Default to 'close' if priceMethod not specified
  const priceMethod = config.priceMethod || 'close';
  
  const signalsConfig: ISignalsConfig = {
    values: candles.map((candle) => candle.close),
    config: config // Use config directly as it already has all Z-Score params
  };
  
  const peaks: IPeak[] = PeakDetector.findSignals(signalsConfig);
  
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
          timestamp: moment(extremeCandle.openTime).unix()
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
      timestamp: moment(extremeCandle.openTime).unix()
    });
  }
  
  return zigzags;
}