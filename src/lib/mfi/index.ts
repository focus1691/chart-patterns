import { ICandle } from '../../types/candle.types';
import { round } from '../../utils/math';

/**
 * Calculate Money Flow Index (MFI) for a series of candles.
 *
 * The Money Flow Index is a momentum oscillator that uses both price and volume
 * to measure buying and selling pressure. It's often called the "Volume RSI"
 * because it incorporates volume into the RSI formula.
 *
 * The MFI oscillates between 0 and 100:
 * - Values above 80 typically indicate overbought conditions
 * - Values below 20 typically indicate oversold conditions
 * - Values above 50 suggest buying pressure dominates
 * - Values below 50 suggest selling pressure dominates
 *
 * @param candles - Array of candlestick data to analyse
 * @param period - Period for MFI calculation (default: 14)
 * @param precision - Number of decimal places for rounding (default: 2)
 * @param useRollingWindow - Use O(N) rolling window optimization vs O(N*period) (default: true)
 * @returns Array of MFI values (same length as input, with null for insufficient data)
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * const mfiValues = ta.MFI.calculateMFI(candles, 14);
 * console.log('Latest MFI:', mfiValues[mfiValues.length - 1]);
 *
 * // Check for overbought/oversold conditions
 * const latestMFI = mfiValues[mfiValues.length - 1];
 * if (latestMFI && latestMFI > 80) {
 *   console.log('Overbought condition detected');
 * } else if (latestMFI && latestMFI < 20) {
 *   console.log('Oversold condition detected');
 * }
 * ```
 */
export function calculateMFI(candles: ICandle[], period: number = 14, precision: number = 2, useRollingWindow: boolean = true): (number | null)[] {
  if (candles.length < period + 1) {
    return Array(candles.length).fill(null);
  }

  const mfi: (number | null)[] = Array(candles.length).fill(null);
  const typicalPrices: number[] = [];
  const moneyFlows: { positive: number; negative: number }[] = [];

  // Calculate typical prices and money flows
  for (let i = 0; i < candles.length; i++) {
    const { high, low, close, volume } = candles[i];
    const typicalPrice = (high + low + close) / 3;
    typicalPrices.push(typicalPrice);

    if (i === 0) {
      // First candle: no previous price to compare, neutral flow
      moneyFlows.push({ positive: 0, negative: 0 });
    } else {
      const rawMoneyFlow = typicalPrice * volume;
      const prevTypicalPrice = typicalPrices[i - 1];

      if (typicalPrice > prevTypicalPrice) {
        moneyFlows.push({ positive: rawMoneyFlow, negative: 0 });
      } else if (typicalPrice < prevTypicalPrice) {
        moneyFlows.push({ positive: 0, negative: rawMoneyFlow });
      } else {
        // Flat typical price: neutral flow
        moneyFlows.push({ positive: 0, negative: 0 });
      }
    }
  }

  if (useRollingWindow) {
    calculateMFIRolling(mfi, moneyFlows, period, precision);
  } else {
    calculateMFIWindowed(mfi, moneyFlows, period, precision);
  }

  return mfi;
}

/**
 * Calculate MFI using O(N) rolling window optimization.
 * @private
 */
function calculateMFIRolling(mfi: (number | null)[], moneyFlows: { positive: number; negative: number }[], period: number, precision: number): void {
  let positiveSum = 0;
  let negativeSum = 0;

  // Initialize window for first MFI calculation (skip first money flow since it's always neutral)
  for (let i = 1; i <= period; i++) {
    positiveSum += moneyFlows[i].positive;
    negativeSum += moneyFlows[i].negative;
  }

  // Calculate first MFI value at index period
  mfi[period] = calculateMFIValue(positiveSum, negativeSum, precision);

  // Rolling window: add new, subtract old
  for (let i = period + 1; i < moneyFlows.length; i++) {
    // Add new value entering window
    positiveSum += moneyFlows[i].positive;
    negativeSum += moneyFlows[i].negative;

    // Subtract old value leaving window (the one that's now period+1 positions back)
    const oldIndex = i - period;
    positiveSum -= moneyFlows[oldIndex].positive;
    negativeSum -= moneyFlows[oldIndex].negative;

    mfi[i] = calculateMFIValue(positiveSum, negativeSum, precision);
  }
}

/**
 * Calculate MFI using O(N*period) windowed approach.
 * @private
 */
function calculateMFIWindowed(mfi: (number | null)[], moneyFlows: { positive: number; negative: number }[], period: number, precision: number): void {
  // Start from period because we need period money flow comparisons
  for (let i = period; i < moneyFlows.length; i++) {
    let positiveSum = 0;
    let negativeSum = 0;

    // Sum money flows for the current window (from i-period+1 to i, but skip index 0)
    const windowStart = Math.max(1, i - period + 1);
    for (let j = windowStart; j <= i; j++) {
      positiveSum += moneyFlows[j].positive;
      negativeSum += moneyFlows[j].negative;
    }

    mfi[i] = calculateMFIValue(positiveSum, negativeSum, precision);
  }
}

/**
 * Calculate MFI value from positive and negative money flow sums.
 * @private
 */
function calculateMFIValue(positiveSum: number, negativeSum: number, precision: number): number {
  if (positiveSum === 0 && negativeSum === 0) {
    return 50; // Neutral when no money flow
  } else if (negativeSum === 0) {
    return 100; // All positive money flow
  } else if (positiveSum === 0) {
    return 0; // All negative money flow
  } else {
    const moneyFlowRatio = positiveSum / negativeSum;
    const mfiValue = 100 - 100 / (1 + moneyFlowRatio);
    return round(mfiValue, precision);
  }
}
