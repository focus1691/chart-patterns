import { from, map } from 'rxjs';
import { ICandle } from '../../types/candle.types';
import { IZScoreConfig } from '../../types/zScore.types';
import { IDivergence, IDivergencePoint, IDivergenceConfig, IndicatorCalculator } from '../../types/divergence.types';
import { ZigZags, PeakDetector, MFI, RSI } from '..';

/**
 * Core divergence detection function that works with any indicator
 */
function findDivergences(
  candles: ICandle[],
  zScoreConfig: IZScoreConfig,
  indicatorValues: number[],
  indicatorName: string,
  config: IDivergenceConfig = {}
): IDivergence[] {
  const { maxTimeSpanHours = 48 } = config;
  const minPoints: number = 4;

  let divergences: IDivergence[] = [];

  const pricePeaks = PeakDetector.findSignals(candles.map((v => v.close)), zScoreConfig);

  // Create synthetic candles for indicator zigzag calculation
  const indicatorCandles = indicatorValues.map((value, index) => ({
    openTime: candles[index].openTime,
    close: value,
  }));

  const indicatorZigzags = ZigZags.create(indicatorCandles as ICandle[], zScoreConfig);

  from([{ pricePeaks, indicatorZigzags }])
    .pipe(
      map(({ pricePeaks, indicatorZigzags }) => collectCorrelations(candles, pricePeaks, indicatorZigzags, indicatorName)),
      map(correlations => findSequences(correlations, minPoints, maxTimeSpanHours)),
      map(sequences => analyzeSequences(sequences, indicatorName)),
      map(divs => removeDuplicateDivergences(divs))
    )
    .subscribe((result: IDivergence[]) => {
      divergences = result;
    });

  return divergences;
}

function collectCorrelations(
  candles: ICandle[],
  pricePeaks: any[],
  indicatorZigzags: any[],
  indicatorName: string
): IDivergencePoint[] {
  const correlations: IDivergencePoint[] = [];

  for (const [peakIndex, peak] of pricePeaks.entries()) {
    const candleAtPeak = candles[peak.position];
    if (!candleAtPeak) continue;

    const matchingZigzag = indicatorZigzags.find(zigzag => {
      const zigzagTime = new Date(zigzag.timestamp * 1000);
      const timeDiff = Math.abs(zigzagTime.getTime() - candleAtPeak.openTime.getTime());
      return timeDiff === 0;
    });

    if (matchingZigzag && peak.direction === matchingZigzag.direction) {
      const peakPrice = peak.direction === 1 ? candleAtPeak.high : candleAtPeak.low;

      correlations.push({
        time: candleAtPeak.openTime,
        priceValue: peakPrice,
        indicatorValue: matchingZigzag.price,
        direction: peak.direction === 1 ? 'HIGH' : 'LOW',
        peakIndex
      });
    }
  }

  correlations.sort((a, b) => a.time.getTime() - b.time.getTime());

  // REMOVE DEBUG
  console.log(`\n🔍 DEBUG: ${indicatorName} correlations:`);
  correlations.forEach((corr, i) => {
    console.log(`${i}: Peak ${corr.peakIndex} ${corr.direction} at ${corr.time.toISOString().slice(11, 19)} | Price: ${corr.priceValue.toFixed(3)} | ${indicatorName}: ${corr.indicatorValue.toFixed(1)}`);
  });

  return correlations;
}

function findSequences(
  correlations: IDivergencePoint[],
  minPoints: number,
  maxTimeSpanHours: number
): IDivergencePoint[][] {
  const sequences: IDivergencePoint[][] = [];

  // Try different starting points for sequences
  for (let startIdx = 0; startIdx <= correlations.length - minPoints; startIdx++) {
    for (let endIdx = startIdx + minPoints - 1; endIdx < correlations.length; endIdx++) {
      const sequence = correlations.slice(startIdx, endIdx + 1);

      // Check if this is a valid sequence (time span not too large)
      const timeSpanHours = (sequence[sequence.length - 1].time.getTime() - sequence[0].time.getTime()) / (1000 * 60 * 60);
      if (timeSpanHours <= maxTimeSpanHours) {
        sequences.push(sequence);
      }
    }
  }

  return sequences;
}

function analyzeSequences(sequences: IDivergencePoint[][], indicatorName: string): IDivergence[] {
  const divergences: IDivergence[] = [];

  for (const sequence of sequences) {
    const divergence = analyzeDivergencePattern(sequence, indicatorName);
    if (divergence) {
      divergences.push(divergence);
    }
  }

  return divergences;
}

function analyzeDivergencePattern(points: IDivergencePoint[], indicatorName: string): IDivergence | null {
  // Separate highs and lows
  const highs = points.filter(p => p.direction === 'HIGH').sort((a, b) => a.time.getTime() - b.time.getTime());
  const lows = points.filter(p => p.direction === 'LOW').sort((a, b) => a.time.getTime() - b.time.getTime());

  // Check both patterns and return the one that exists
  const bullishDiv = lows.length >= 2 ? checkBullishDivergence(lows, indicatorName) : null;
  const bearishDiv = highs.length >= 2 ? checkBearishDivergence(highs, indicatorName) : null;

  // Return the divergence that exists, prefer stronger one if both exist
  if (bullishDiv && bearishDiv) {
    return bullishDiv.strength >= bearishDiv.strength ? bullishDiv : bearishDiv;
  }

  return bullishDiv || bearishDiv;
}

function checkBullishDivergence(lows: IDivergencePoint[], indicatorName: string): IDivergence | null {
  if (lows.length < 2) return null;

  const firstPrice = lows[0].priceValue;
  const lastPrice = lows[lows.length - 1].priceValue;
  const firstIndicator = lows[0].indicatorValue;
  const lastIndicator = lows[lows.length - 1].indicatorValue;

  const priceDecreasing = lastPrice < firstPrice;
  const indicatorIncreasing = lastIndicator > firstIndicator;

  if (priceDecreasing && indicatorIncreasing) {
    return {
      type: 'bullish',
      startTime: lows[0].time,
      endTime: lows[lows.length - 1].time,
      points: lows,
      strength: lows.length,
      indicator: indicatorName,
      description: `Bullish divergence: Price lower lows (${firstPrice.toFixed(3)} → ${lastPrice.toFixed(3)}) while ${indicatorName} higher lows (${firstIndicator.toFixed(1)} → ${lastIndicator.toFixed(1)})`
    };
  }

  return null;
}

function checkBearishDivergence(highs: IDivergencePoint[], indicatorName: string): IDivergence | null {
  if (highs.length < 2) return null;

  const firstPrice = highs[0].priceValue;
  const lastPrice = highs[highs.length - 1].priceValue;
  const firstIndicator = highs[0].indicatorValue;
  const lastIndicator = highs[highs.length - 1].indicatorValue;

  const priceIncreasing = lastPrice > firstPrice;
  const indicatorDecreasing = lastIndicator < firstIndicator;

  const priceDecreasing = lastPrice < firstPrice;
  const indicatorIncreasing = lastIndicator > firstIndicator;

  if ((priceIncreasing && indicatorDecreasing) || (priceDecreasing && indicatorIncreasing)) {
    const pattern = priceIncreasing && indicatorDecreasing
      ? `higher highs (${firstPrice.toFixed(3)} → ${lastPrice.toFixed(3)}) while ${indicatorName} lower highs (${firstIndicator.toFixed(1)} → ${lastIndicator.toFixed(1)})`
      : `lower highs (${firstPrice.toFixed(3)} → ${lastPrice.toFixed(3)}) while ${indicatorName} higher highs (${firstIndicator.toFixed(1)} → ${lastIndicator.toFixed(1)})`;

    return {
      type: 'bearish',
      startTime: highs[0].time,
      endTime: highs[highs.length - 1].time,
      points: highs,
      strength: highs.length,
      indicator: indicatorName,
      description: `Bearish divergence: Price ${pattern}`
    };
  }

  return null;
}

function removeDuplicateDivergences(divergences: IDivergence[]): IDivergence[] {
  const unique: IDivergence[] = [];

  for (const div of divergences) {
    const overlapping = unique.find(existing => {
      // Check if they overlap in time
      const overlapStart = Math.max(existing.startTime.getTime(), div.startTime.getTime());
      const overlapEnd = Math.min(existing.endTime.getTime(), div.endTime.getTime());
      return overlapStart < overlapEnd;
    });

    if (!overlapping) {
      unique.push(div);
    } else if (div.strength > overlapping.strength) {
      // Replace with stronger divergence
      const index = unique.indexOf(overlapping);
      unique[index] = div;
    }
  }

  return unique;
}

/**
 * Find divergences using Money Flow Index (MFI)
 */
export function mfi(
  candles: ICandle[],
  zScoreConfig: IZScoreConfig,
  config: IDivergenceConfig = {},
  mfiPeriod: number = 14
): IDivergence[] {
  const mfiValues = MFI.calculateMFI(candles, mfiPeriod);
  return findDivergences(candles, zScoreConfig, mfiValues, 'MFI', config);
}

/**
 * Find divergences using Relative Strength Index (RSI)
 */
export function rsi(
  candles: ICandle[],
  zScoreConfig: IZScoreConfig,
  config: IDivergenceConfig = {},
  rsiPeriod: number = 14
): IDivergence[] {
  const rsiValues = RSI.calculateRSI(candles, rsiPeriod);
  return findDivergences(candles, zScoreConfig, rsiValues, 'RSI', config);
}

/**
 * Generic divergence finder for custom indicators
 */
export function custom(
  candles: ICandle[],
  zScoreConfig: IZScoreConfig,
  indicatorValues: number[],
  indicatorName: string,
  config: IDivergenceConfig = {}
): IDivergence[] {
  return findDivergences(candles, zScoreConfig, indicatorValues, indicatorName, config);
}
