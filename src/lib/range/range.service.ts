import _ from 'lodash'
import moment from 'moment'
import { from, map, toArray } from 'rxjs'
import { ICandle } from '@trading/dto/candle.dto'
import { PeakDetector } from '../peakDetector'
import { bias, FIBONACCI_NUMBERS, IFibonacciRetracement, ILocalRange, IPeak, IRanges, IZigZag } from '../range/range.types'
import { countDecimals, round } from '../../utils/math'

declare global {
  interface Number {
    between: (a: number, b: number) => boolean
  }
}

// eslint-disable-next-line no-extend-native
Number.prototype.between = function (a: number, b: number): boolean {
  const min = Math.min(a, b)
  const max = Math.max(a, b)
  return this >= min && this <= max
}

@Injectable()
export class RangesService {
  public static LAG: number = 10
  public static THRESHOLD: number = 2
  public static INFLUENCE: number = 1

  constructor(@Inject('PeakDetector') private peakDetector: PeakDetector) {}

  private toZigzags(this: { klines: ICandle[] }, peaks: IPeak[]): IZigZag {
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

  private calculateFibonacci(range: ILocalRange, bias: bias): IFibonacciRetracement {
    const fibonacci = {} as IFibonacciRetracement

    if (!range.resistance || !range.support) return fibonacci

    const diff: number = Math.abs(range.resistance - range.support)

    function calculateRetracement(bias: bias): Function {
      return function (fibNumber: FIBONACCI_NUMBERS): number | null {
        const numDecimals: number = Math.max(countDecimals(range.support), countDecimals(range.resistance))

        if (bias === 'BULLISH') return Math.max(0, round(range.support + diff * fibNumber, numDecimals)) || null
        else if (bias === 'BEARISH') return Math.max(0, round(range.resistance - diff * fibNumber, numDecimals)) || null
        return Math.max(0, round(range.resistance - diff * fibNumber, numDecimals)) || null
      }
    }

    const retracement = calculateRetracement(bias)

    fibonacci[0] = retracement(FIBONACCI_NUMBERS.ZERO)
    fibonacci[0.236] = retracement(FIBONACCI_NUMBERS.TWO_THREE_SIX)
    fibonacci[0.382] = retracement(FIBONACCI_NUMBERS.THREE_EIGHT_TWO)
    fibonacci[0.5] = retracement(FIBONACCI_NUMBERS.FIVE)
    fibonacci[0.618] = retracement(FIBONACCI_NUMBERS.SIX_ONE_EIGHT)
    fibonacci[0.66] = retracement(FIBONACCI_NUMBERS.SIX_SIX)
    fibonacci[0.786] = retracement(FIBONACCI_NUMBERS.SEVEN_EIGHT_SIX)
    fibonacci[1] = retracement(FIBONACCI_NUMBERS.ONE)
    fibonacci[1.618] = retracement(FIBONACCI_NUMBERS.ONE_SIX_EIGHT)

    return fibonacci
  }

  private toRanges(zigzags: IZigZag[]): ILocalRange[] {
    const ranges = [] as ILocalRange[]
    let range: ILocalRange = {} as ILocalRange

    function openRange(zigzag: IZigZag): void {
      range = {} as ILocalRange
      range.start = zigzag.timestamp
      range[zigzag.direction === 'PEAK' ? 'resistance' : 'support'] = zigzag.price
      range.bias = zigzag.direction === 'PEAK' ? 'BULLISH' : 'BEARISH'
    }

    function closeRange(zigzag: IZigZag, continueRange: boolean): void {
      if (continueRange) {
        range.end = zigzag.timestamp
      }
      range.bias = zigzag.direction === 'PEAK' ? 'BULLISH' : 'BEARISH'
      ranges.push(range)
      range = {} as ILocalRange
    }

    function updateRange(zigzag: IZigZag): void {
      const levelType: string = zigzag.direction === 'PEAK' ? 'resistance' : 'support'
      if (!range[levelType]) range[levelType] = zigzag.price
      range.end = zigzag.timestamp
      range.bias = zigzag.direction === 'PEAK' ? 'BULLISH' : 'BEARISH'
    }

    for (let i = 0; i < zigzags.length; i++) {
      if (!range.resistance && !range.support) {
        openRange(zigzags[i])
      } else if (range.resistance && range.support) {
        if (zigzags[i].price.between(range.resistance, range.support)) {
          updateRange(zigzags[i])
        } else {
          const isFirstRange = ranges.length <= 0
          let breakBackIntoPrevRange = false

          if (!isFirstRange) {
            const prevSupport = ranges[ranges.length - 1].support
            const prevResistance = ranges[ranges.length - 1].resistance
            const prevRangeBias = ranges[ranges.length - 1].bias
            breakBackIntoPrevRange =
              (prevRangeBias === 'BEARISH' && zigzags[i].direction === 'PEAK' && zigzags[i].price < prevSupport) ||
              (prevRangeBias === 'BULLISH' && zigzags[i].direction === 'TROUGH' && zigzags[i].price < prevResistance)
          }

          if (!isFirstRange && breakBackIntoPrevRange) {
            updateRange(zigzags[i])
          } else {
            closeRange(zigzags[i], !isFirstRange)
            openRange(zigzags[i])
          }
        }
      } else {
        updateRange(zigzags[i])
      }
    }
    if (range.resistance || range.support) {
      range.bias = zigzags[zigzags.length - 1].direction === 'PEAK' ? 'BULLISH' : 'BEARISH'
      ranges.push(range)
    }
    return ranges
  }

  private mergeRanges(ranges: ILocalRange[]): ILocalRange[] {
    if (_.isEmpty(ranges)) return []
    const fullExtendedRanges: ILocalRange[] = [ranges[0]]

    for (let i = 1; i < ranges.length; i++) {
      const { resistance, support, start, end } = fullExtendedRanges[fullExtendedRanges.length - 1]
      const nextRes: number = ranges[i].resistance
      const nextSup: number = ranges[i].support

      if (!nextRes || !nextSup) {
        fullExtendedRanges.push(ranges[i])
      } else if (nextRes.between(resistance, support) || nextSup.between(resistance, support)) {
        const beginning: number = Math.min(moment(start).valueOf(), moment(end).valueOf(), moment(ranges[i].start).valueOf(), moment(ranges[i].end).valueOf())
        const ending: number = Math.max(moment(start).valueOf(), moment(end).valueOf(), moment(ranges[i].start).valueOf(), moment(ranges[i].end).valueOf())
        fullExtendedRanges[fullExtendedRanges.length - 1].resistance = Math.max(resistance, nextRes)
        fullExtendedRanges[fullExtendedRanges.length - 1].support = Math.min(support, nextSup)
        fullExtendedRanges[fullExtendedRanges.length - 1].start = beginning
        fullExtendedRanges[fullExtendedRanges.length - 1].end = ending
      } else {
        fullExtendedRanges.push(ranges[i])
      }
    }
    return fullExtendedRanges
  }

  private appendFibs(ranges: ILocalRange[]): ILocalRange[] {
    for (let i = 0; i < ranges.length; i++) {
      ranges[i].fibs = {
        lowHigh: this.calculateFibonacci(ranges[i], 'BEARISH'),
        highLow: this.calculateFibonacci(ranges[i], 'BULLISH')
      }
    }
    return ranges
  }

  private findGlobalRange(ranges: ILocalRange[]): ILocalRange {
    if (ranges === null || !ranges?.length) return {}

    const range: ILocalRange = ranges[0] as ILocalRange

    for (let i = 1; i < ranges?.length; i++) {
      if (ranges[i].resistance > range.resistance) {
        range.resistance = ranges[i].resistance
        range.bias = ranges[i].bias
        range.end = ranges[i].end
      }
      if (ranges[i].support < range.support) {
        range.support = ranges[i].support
        range.bias = ranges[i].bias
        range.end = ranges[i].end
      }
    }
    range.fibs = {
      lowHigh: this.calculateFibonacci(range, 'BEARISH'),
      highLow: this.calculateFibonacci(range, 'BULLISH')
    }

    return range
  }

  public findRanges(klines: ICandle[]): IRanges {
    let local: ILocalRange[] = []
    const values = klines.map((kline) => kline.close)

    from(this.peakDetector.findSignals(values))
      .pipe(
        map(this.toZigzags.bind({ klines })),
        toArray(),
        map(this.toRanges.bind(this)),
        map(this.mergeRanges),
        map(this.appendFibs.bind(this))
      )
      .subscribe((result: ILocalRange[]) => {
        local = result
      })
    const global: ILocalRange = this.findGlobalRange(local)

    return { local, global }
  }
}
