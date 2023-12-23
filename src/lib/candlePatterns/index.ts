import { ISignal } from '../../types/signals.types'
import { CANDLE_OBSERVATIONS, EXCESS_TAIL_LENGTH_SIGNIFICANCE } from '../../constants/marketProfile'
import { ICandle } from '../../types/candle.types'
import { IEngulfingCandleConfig } from '../../types/engulfingCandle.types'
import { SIGNALS, SIGNAL_DIRECTION } from 'src/constants/signals'

export const isExcess = (candle: ICandle): boolean => {
  const open: number = candle.open
  const high: number = candle.high
  const low: number = candle.low
  const close: number = candle.close
  const klineLength: number = Math.abs(close - open)
  const klineUpperTail: number = Math.abs(close - high)
  const klineLowerTail: number = Math.abs(close - low)

  const isUpperTailExcess: boolean = klineUpperTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE
  const isLowerTailExcess: boolean = klineLowerTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE

  return isUpperTailExcess || isLowerTailExcess
}

export const findEngulfingCandle = (config: IEngulfingCandleConfig): ISignal | null => {
  const candles = config.candles
  if (candles.length < 2) {
    return null
  }

  const index = config.index ?? candles.length - 1
  if (index < 1) return null // Ensures there's a previous candle

  const previousCandle = candles[index - 1]
  const currentCandle = candles[index]

  const isPreviousBullish = previousCandle.close > previousCandle.open
  const isPreviousBearish = previousCandle.close < previousCandle.open
  const isCurrentBullish = currentCandle.close > currentCandle.open
  const isCurrentBearish = currentCandle.close < currentCandle.open

  const isBullishEngulfing = isPreviousBearish && isCurrentBullish && currentCandle.open <= previousCandle.close && currentCandle.close >= previousCandle.open

  const isBearishEngulfing = isPreviousBullish && isCurrentBearish && currentCandle.open >= previousCandle.close && currentCandle.close <= previousCandle.open

  if (isBullishEngulfing) {
    return {
      indicator: CANDLE_OBSERVATIONS.ENGULFING,
      type: SIGNALS.CANDLE_ANOMALY,
      direction: SIGNAL_DIRECTION.BULLISH,
      intervals: []
    }
  }

  if (isBearishEngulfing) {
    return {
      indicator: CANDLE_OBSERVATIONS.ENGULFING,
      type: SIGNALS.CANDLE_ANOMALY,
      direction: SIGNAL_DIRECTION.BEARISH,
      intervals: []
    }
  }

  return null
}
