import { ICandle } from '../../types/candle.types';
import { round } from '../../utils/math';

export function calculateRSI(candles: ICandle[], period: number = 14): number[] {
  if (candles.length < period + 1) {
    return [];
  }

  const rsi: number[] = [];
  let gainSum = 0;
  let lossSum = 0;

  // Calculate initial average gains and losses for the first period
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) {
      gainSum += change;
    } else {
      lossSum -= change;
    }
  }

  let averageGain = gainSum / period;
  let averageLoss = lossSum / period;

  // Calculate first RSI value
  if (averageGain === 0 && averageLoss === 0) {
    rsi.push(50); // Flat market - neutral
  } else if (averageLoss === 0) {
    rsi.push(100);
  } else {
    const rs = averageGain / averageLoss;
    rsi.push(round(100 - 100 / (1 + rs), 2));
  }

  // Calculate RSI values for remaining periods using smoothing formula
  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    // Apply smoothing formula (Wilder's smoothing)
    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;

    if (averageGain === 0 && averageLoss === 0) {
      rsi.push(50); // Flat market - neutral
    } else if (averageLoss === 0) {
      rsi.push(100);
    } else {
      const rs = averageGain / averageLoss;
      rsi.push(round(100 - 100 / (1 + rs), 2));
    }
  }

  return rsi;
}
