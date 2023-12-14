import moment from 'moment'
import { IZigZag } from '../../types/zigzags.types'
import { IPeak, ICandle } from '../../types'
import { PeakDetector } from '../peakDetector'

export class ZigZags {
  public static LAG: number = 5
  public static THRESHOLD: number = 2
  public static INFLUENCE: number = 0.3
  private static peakDetector: PeakDetector = new PeakDetector(ZigZags.LAG, ZigZags.THRESHOLD, ZigZags.INFLUENCE)

  static create(candles: ICandle[]): IZigZag {
    const zigzag: IZigZag = {} as IZigZag
    const values: number[] = candles.map((kline) => kline.close)
    const groupedPeaks: IPeak[][] = ZigZags.peakDetector.findSignals(values)

    for (const groupedPeak of groupedPeaks) {
      for (const peak of groupedPeak) {
        const { position, direction }: IPeak = peak
        const close: number = Number(candles[position]?.close)
        if (!zigzag.price) {
          zigzag.direction = direction === 1 ? 'PEAK' : 'TROUGH'
          zigzag.price = close
          zigzag.timestamp = moment(candles[position].openTime).unix()
        } else {
          if ((zigzag.direction === 'PEAK' && close > zigzag.price) || (zigzag.direction === 'TROUGH' && close < zigzag.price)) {
            zigzag.price = close
            zigzag.timestamp = moment(candles[position].openTime).unix()
          }
        }
      }
    }
    return zigzag
  }
}
