import { ICandle } from '../../types/candle.types';

export function calculateRSI(candles: ICandle[], period: number = 14, numElements: number = 2): number[] {
  if (candles.length < period) {
    return [];
  }

  const rsi = new Array(candles.length).fill(0);
  let gains = 0;
  let losses = 0;

  // Calculate initial average gains and losses
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let averageGain = gains / period;
  let averageLoss = losses / period;

  // Calculate RSI values starting from 'period' index
  for (let i = period; i < candles.length; i++) {
    if (i > period) {
      const change = candles[i].close - candles[i - 1].close;
      gains = change > 0 ? change : 0;
      losses = change < 0 ? -change : 0;

      // Apply smoothing formula
      averageGain = (averageGain * (period - 1) + gains) / period;
      averageLoss = (averageLoss * (period - 1) + losses) / period;
    }

    if (averageLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = averageGain / averageLoss;
      rsi[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsi.slice(-numElements);
}
