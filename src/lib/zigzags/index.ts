import moment from 'moment'
import { ICandle } from '../../types/candle.types'
import { IPeak } from '../../types/range.types'
import { IZigZag } from '../../types/zigzags.types'
import { PeakDetector } from '../peakDetector'

export class ZigZags {
  public static LAG: number = 5
  public static THRESHOLD: number = 2
  public static INFLUENCE: number = 0.3
  private static peakDetector: PeakDetector = new PeakDetector(ZigZags.LAG, ZigZags.THRESHOLD, ZigZags.INFLUENCE)

  static create(candles: ICandle[]): IZigZag[] {
    const zigzags: IZigZag[] = []
    const groupedPeaks: IPeak[][] = ZigZags.peakDetector.findSignals(candles.map((candle) => candle.close))

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
}
