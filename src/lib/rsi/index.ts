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

export function calculateStochasticRSI(
  candles: ICandle[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kSmoothing: number = 3,
  dSmoothing: number = 3
): { k: number[]; d: number[] } {
  const rsiValues = calculateRSI(candles, rsiPeriod);

  if (rsiValues.length < stochPeriod) {
    return { k: [], d: [] };
  }

  // Calculate raw stochastic RSI values
  const rawStochasticRSI: number[] = [];
  for (let i = stochPeriod - 1; i < rsiValues.length; i++) {
    const rsiSlice = rsiValues.slice(i - stochPeriod + 1, i + 1);
    const highestRSI = Math.max(...rsiSlice);
    const lowestRSI = Math.min(...rsiSlice);
    const currentRSI = rsiValues[i];

    let stochRSI: number;
    if (highestRSI === lowestRSI) {
      stochRSI = 0; // Avoid division by zero
    } else {
      stochRSI = ((currentRSI - lowestRSI) / (highestRSI - lowestRSI)) * 100;
    }

    rawStochasticRSI.push(stochRSI);
  }

  if (rawStochasticRSI.length < Math.max(kSmoothing, dSmoothing)) {
    return { k: [], d: [] };
  }

  // Calculate %K (smoothed stochastic RSI)
  const kValues: number[] = [];
  for (let i = kSmoothing - 1; i < rawStochasticRSI.length; i++) {
    const kSlice = rawStochasticRSI.slice(i - kSmoothing + 1, i + 1);
    const avgK = kSlice.reduce((sum, val) => sum + val, 0) / kSmoothing;
    kValues.push(round(avgK, 2));
  }

  // Calculate %D (smoothed %K)
  const dValues: number[] = [];
  for (let i = dSmoothing - 1; i < kValues.length; i++) {
    const dSlice = kValues.slice(i - dSmoothing + 1, i + 1);
    const avgD = dSlice.reduce((sum, val) => sum + val, 0) / dSmoothing;
    dValues.push(round(avgD, 2));
  }

  return { k: kValues, d: dValues };
}
