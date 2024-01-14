import moment from 'moment'
import { TIME_PERIODS } from 'src/constants'
import { ICandle } from 'src/types'
import { ILinearRegression } from 'src/types/linearRegression.types'
import { round } from 'src/utils/math'

export function calcLinearRegression(x: number[], y: number[]): ILinearRegression {
  const n: number = Math.min(x.length, y.length)
  let sumX: number = 0
  let sumY: number = 0
  let sumXSquared: number = 0
  let sumYSquared: number = 0
  let sumXYProducts: number = 0

  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXSquared += Math.pow(x[i], 2)
    sumYSquared += Math.pow(y[i], 2)
    sumXYProducts += x[i] * y[i]
  }
  const meanX: number = round(sumX / n, 3) || null
  const meanY: number = round(sumY / n, 3) || null

  let r: number = (n * sumXYProducts - sumX * sumY) / Math.sqrt((n * sumXSquared - Math.pow(sumX, 2)) * (n * sumYSquared - Math.pow(sumY, 2)))
  let r2: number = Math.pow(r, 2)

  sumX = sumX ? round(sumX, 3) : null
  sumY = sumY ? round(sumY, 3) : null
  sumXSquared = sumXSquared ? round(sumXSquared, 3) : null
  sumYSquared = sumYSquared ? round(sumYSquared, 3) : null
  sumXYProducts = sumXYProducts ? round(sumXYProducts, 3) : null
  r = r ? round(r, 3) : null
  r2 = r2 ? round(r2, 3) : null

  return { sumX, sumY, sumXSquared, sumYSquared, sumXYProducts, meanX, meanY, r, r2 }
}

export function matchTimeseriesData(first: ICandle[], second: ICandle[], amount: number, duration: string): [number[], number[]] {
  let i = 0
  let j = 0
  const x: number[] = []
  const y: number[] = []
  const stockTimestamps: number[] = []
  const startOfPeriod = moment().subtract(amount as moment.DurationInputArg1, duration as moment.DurationInputArg2)
  const filteredCandles = first.filter((candle: ICandle) => moment(candle.openTime).isAfter(startOfPeriod))
  const filteredCandles2 = second.filter((candle: ICandle) => moment(candle.openTime).isAfter(startOfPeriod))

  while (i < filteredCandles.length && j < filteredCandles2.length) {
    const t1: moment.Moment = moment(filteredCandles[i].openTime)
    const t2: moment.Moment = moment(filteredCandles2[i].openTime)
    if (t1.isSame(t2, TIME_PERIODS.DAY)) {
      x.push(first[i].close)
      y.push(second[i].close)
      i++
      j++
    } else if (t1.isBefore(t2)) {
      i++
    } else if (t2.isBefore(t1)) {
      j++
    } else {
      break
    }
  }
  return [x, y]
}
