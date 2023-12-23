import { CANDLE_OBSERVATIONS } from '../../constants/marketProfile'
import { ICandle } from '../../types'
import { IEngulfingCandleConfig } from '../../types/engulfingCandle.types'
import { ISignal } from '../../types/signals.types'
import { SIGNAL_DIRECTION, SIGNALS } from 'src/constants/signals'

export const findEngulfingCandle = (config: IEngulfingCandleConfig): ISignal | null => {
  const candles: ICandle[] = config.candles
  if (candles.length < 2) {
    return null
  }

  const index = config.index ?? candles.length - 1
  if (!candles[index] || !candles[index - 1]) return null // Ensures there's a previous candle

  const prevCandle: ICandle = candles[index - 1]
  const currCandle: ICandle = candles[index]

  const isPreviousBullish: boolean = prevCandle.close > prevCandle.open
  const isPreviousBearish: boolean = prevCandle.close < prevCandle.open
  const isCurrentBullish: boolean = currCandle.close > currCandle.open
  const isCurrentBearish: boolean = currCandle.close < currCandle.open

  const isBullishEngulfing: boolean = isPreviousBearish && isCurrentBullish && currCandle.open <= prevCandle.close && currCandle.close >= prevCandle.open
  const isBearishEngulfing: boolean = isPreviousBullish && isCurrentBearish && currCandle.open >= prevCandle.close && currCandle.close <= prevCandle.open

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
