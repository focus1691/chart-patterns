import { EXCESS_TAIL_LENGTH_SIGNIFICANCE } from '../../constants/marketProfile'
import { ICandle } from '../../types/candle.types'

export const isExcess = (candle: ICandle): boolean => {
  const open: number = candle.open
  const high: number = candle.high
  const low: number = candle.low
  const close: number = candle.close
  const klineLength: number = Math.abs(close - open)
  const klineUpperTail: number = Math.abs(close - high)
  const klineLowerTail: number = Math.abs(close - low)

  if (klineUpperTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE) return true
  if (klineLowerTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE) return true
  return false
}
