import { ICandle, IPivotPoints } from '../../types'

/**
 * Calculates pivot points from a single ICandle or an array of ICandles.
 * If an array is passed, the function calculates high, low, and close values
 * from all candles to compute the pivot points.
 *
 * @param {ICandle | ICandle[]} candles - A single candle or an array of candles.
 * @returns {IPivotPoints} The calculated pivot points.
 *
 * @example
 * // Assuming 'dailyCandles' is an array of ICandle objects from a single day
 * const pivotPoints: IPivotPoints = calculatePivotPoints(dailyCandles);
 *
 * // Assuming 'yesterdayCandle' is a single ICandle object representing yesterday's day candle
 * const pivotPoints: IPivotPoints = calculatePivotPoints(yesterdayCandle);
 */
export function calculatePivotPoints(candles: ICandle | ICandle[]): IPivotPoints {
  let high, low, close: number;

  if (Array.isArray(candles)) {
    // If an array of candles is provided, calculate the high, low and close from the array
    high = Math.max(...candles.map(c => c.high));
    low = Math.min(...candles.map(c => c.low));
    close = candles[candles.length - 1].close; // The close of the last candle is used
  } else {
    // If a single candle is provided, use its values directly
    high = candles.high;
    low = candles.low;
    close = candles.close;
  }

  const pivot = (high + low + close) / 3;
  const resistance1 = 2 * pivot - low;
  const support1 = 2 * pivot - high;
  const resistance2 = pivot + (high - low);
  const support2 = pivot - (high - low);
  const resistance3 = resistance1 + (high - low);
  const support3 = support1 - (high - low);

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
