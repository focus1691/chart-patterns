import { round } from '../../utils';
import { ICandle, IPivotPoints } from '../../types';

/**
 * Calculates pivot points from a single ICandle or an array of ICandles.
 * If an array is passed, the function calculates high, low, and close values
 * from all candles to compute the pivot points.
 *
 * @param {ICandle | ICandle} candles - A single candle or an array of candles.
 * @param {number} pricePrecision - The price precision of the asset.
 * @returns {IPivotPoints} The calculated pivot points.
 *
 * @example
 * // Assuming 'dailyCandles' is an array of ICandle objects from a single day
 * const pivotPoints: IPivotPoints = calculatePivotPoints(dailyCandles, 2);
 *
 * // Assuming 'yesterdayCandle' is a single ICandle object representing yesterday's day candle
 * const pivotPoints: IPivotPoints = calculatePivotPoints(yesterdayCandle, 2);
 */
export function calculatePivotPoints(candles: ICandle | ICandle[], pricePrecision: number): IPivotPoints {
  let high, low, close: number;

  if (Array.isArray(candles)) {
    high = Math.max(...candles.map((c) => c.high));
    low = Math.min(...candles.map((c) => c.low));
    close = candles[candles.length - 1].close;
  } else {
    high = candles.high;
    low = candles.low;
    close = candles.close;
  }

  const pivot = round((high + low + close) / 3, pricePrecision);
  const resistance1 = round(2 * pivot - low, pricePrecision);
  const support1 = round(2 * pivot - high, pricePrecision);
  const resistance2 = round(pivot + (high - low), pricePrecision);
  const support2 = round(pivot - (high - low), pricePrecision);
  const resistance3 = round(resistance1 + (high - low), pricePrecision);
  const support3 = round(support1 - (high - low), pricePrecision);

  return {
    pivot,
    resistance1,
    support1,
    resistance2,
    support2,
    resistance3,
    support3
  };
}
