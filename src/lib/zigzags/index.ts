import moment from 'moment'
import { IZigZag } from '../../types/zigzags.types'

export class ZigZags {
  static create(klines: ICandle[], peaks: IPeak[]): IZigZag {
    const zigzag: IZigZag = {} as IZigZag
    for (let i = 0; i < peaks.length; i++) {
      const { position, direction }: IPeak = peaks[i]
      const close: number = Number(this.klines[position]?.close)
      if (!zigzag.price) {
        zigzag.direction = direction === 1 ? 'PEAK' : 'TROUGH'
        zigzag.price = close
        zigzag.timestamp = moment(this.klines[position].openTime).unix()
      } else {
        if ((zigzag.direction === 'PEAK' && close > zigzag.price) || (zigzag.direction === 'TROUGH' && close < zigzag.price)) {
          zigzag.price = close
          zigzag.timestamp = moment(this.klines[position].openTime).unix()
        }
      }
    }
    return zigzag
  }
}
