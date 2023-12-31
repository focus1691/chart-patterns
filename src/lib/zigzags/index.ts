import moment from 'moment'
import { ICandle } from '../../types/candle.types'
import { IPeak } from '../../types/range.types'
import { IZigZag } from '../../types/zigzags.types'
import { ISignalsConfig } from '../../types/peakDetector.types'
import * as PeakDetector from '../peakDetector'

/**
 * Creates an array of ZigZag points based on the provided candlestick data and peak detection configuration.
 *
 * @param {ICandle[]} candles - An array of candlestick data to analyse.
 * @param {number} lag - The lag value for the peak detection algorithm.
 * @param {number} threshold - The threshold value for identifying significant price changes.
 * @param {number} influence - The influence factor for adjusting the impact of recent signals on the algorithm.
 * @returns {IZigZag[]} An array of ZigZag points representing significant price changes.
 */
export function create(candles: ICandle[], lag: number, threshold: number, influence: number): IZigZag[] {
  const zigzags: IZigZag[] = []
  const config: ISignalsConfig = {
    values: candles.map((candle) => candle.close),
    lag,
    threshold,
    influence
  }
  const groupedPeaks: IPeak[][] = PeakDetector.findSignals(config)

  for (const group of groupedPeaks) {
    const direction = group[0].direction
    let extremeValue = direction === 1 ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER
    let extremeCandle = null

    for (const peak of group) {
      const candle = candles[peak.position]
      if (direction === 1 && candle.high > extremeValue) {
        extremeValue = candle.high
        extremeCandle = candle
      } else if (direction === -1 && candle.low < extremeValue) {
        extremeValue = candle.low
        extremeCandle = candle
      }
    }

    if (extremeCandle) {
      const zigzag: IZigZag = {
        direction: direction === 1 ? 'PEAK' : 'TROUGH',
        price: extremeValue,
        timestamp: moment(extremeCandle.openTime).unix()
      }
      zigzags.push(zigzag)
    }
  }
  return zigzags
}
