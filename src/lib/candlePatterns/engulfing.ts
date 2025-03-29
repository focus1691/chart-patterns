import { SIGNAL_DIRECTION } from '../../constants/signals';
import { ICandle } from '../../types';
import { IEngulfingPatternConfig } from '../../types/candlestickPatterns';

/**
 * Finds engulfing candle patterns in a given set of candles.
 *
 * @param config - The configuration object for engulfing candle detection.
 * @returns The engulfing candle signal if found, or null otherwise.
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * const direction: SIGNAL_DIRECTION | null = ta.CandlestickPatterns.detectEngulfing({ candles, index: 10 });
 * ```
 */
export const detectEngulfing = (candles: ICandle[], config: IEngulfingPatternConfig): SIGNAL_DIRECTION => {
  const { index } = config;
  if (candles.length < 2) {
    return SIGNAL_DIRECTION.NONE;
  }

  const startIndex = index ?? candles.length - 1;
  if (!candles[startIndex] || !candles[startIndex - 1]) {
    return SIGNAL_DIRECTION.NONE;
  }

  const prevCandle: ICandle = candles[startIndex - 1];
  const currCandle: ICandle = candles[startIndex];

  const prevBullish: boolean = prevCandle.close > prevCandle.open;
  const prevBearish: boolean = prevCandle.close < prevCandle.open;
  const currBullish: boolean = currCandle.close > currCandle.open;
  const currBearish: boolean = currCandle.close < currCandle.open;

  const isBullishEngulfing: boolean = prevBearish && currBullish && currCandle.open < prevCandle.close && currCandle.close > prevCandle.open;

  const isBearishEngulfing: boolean = prevBullish && currBearish && currCandle.open > prevCandle.close && currCandle.close < prevCandle.open;

  if (isBullishEngulfing) return SIGNAL_DIRECTION.BULLISH;
  if (isBearishEngulfing) return SIGNAL_DIRECTION.BEARISH;

  return SIGNAL_DIRECTION.NONE;
};
