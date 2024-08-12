import { SIGNAL_DIRECTION } from '../../constants/signals'
import { ICandle } from '../../types'
import { IEngulfingCandleConfig } from '../../types/candlestickPatterns/engulfingCandle.types'

/**
 * Finds engulfing candle patterns in a given set of candles.
 *
 * @param config - The configuration object for engulfing candle detection.
 * @returns The engulfing candle signal if found, or null otherwise.
 *
 * @example
 * ```typescript
 * import { CandlestickPatterns } from 'chart-patterns';
 *
 * // Assuming 'candles' is an array of candle data
 * const engulfingCandle: SIGNAL_DIRECTION | null = CandlestickPatterns.findEngulfingCandle({ candles, index: 10 });
 * ```
 */
export const findEngulfingCandle = (config: IEngulfingCandleConfig): SIGNAL_DIRECTION | null => {
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

  if (isBullishEngulfing) return SIGNAL_DIRECTION.BULLISH
  if (isBearishEngulfing) return SIGNAL_DIRECTION.BEARISH

  return null
}
