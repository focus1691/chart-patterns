import { SIGNAL_DIRECTION } from '../../constants/signals';
import { ICandle } from '../../types';

/**
 * Detects Morning Star or Evening Star patterns (3-candle reversal formations).
 * Trend context should be evaluated separately to confirm the signal.
 *
 * @param candles - Array of candles (must include at least 3 candles).
 * @param index - The index of the 3rd candle in the potential pattern.
 * @returns A SIGNAL_DIRECTION:
 *   - `BULLISH` if Morning Star pattern detected
 *   - `BEARISH` if Evening Star pattern detected
 *   - `NONE` if no pattern detected
 */
export const detectMorningEveningStar = (candles: ICandle[], index: number): SIGNAL_DIRECTION => {
  if (index < 2) return SIGNAL_DIRECTION.NONE;

  const first = candles[index - 2];
  const second = candles[index - 1];
  const third = candles[index];

  const firstBullish = first.close > first.open;
  const firstBearish = first.close < first.open;
  const thirdBullish = third.close > third.open;
  const thirdBearish = third.close < third.open;

  const firstBody = Math.abs(first.close - first.open);
  const secondBody = Math.abs(second.close - second.open);

  const isMorningStar = firstBearish && secondBody < firstBody && thirdBullish && third.close > (first.open + first.close) / 2;

  const isEveningStar = firstBullish && secondBody < firstBody && thirdBearish && third.close < (first.open + first.close) / 2;

  if (isMorningStar) return SIGNAL_DIRECTION.BULLISH;
  if (isEveningStar) return SIGNAL_DIRECTION.BEARISH;

  return SIGNAL_DIRECTION.NONE;
};
