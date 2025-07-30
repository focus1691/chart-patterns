import { from, map } from 'rxjs';
import { ICandle } from '../../types/candle.types';
import { IZScoreConfig } from '../../types/zScore.types';
import { IDivergence, IDivergencePoint } from '../../types/divergence.types';
import { SIGNAL_DIRECTION } from '../../constants/signals';
import { ZigZags, PeakDetector, MFI, RSI } from '..';

const defaultZscoreConfig = {
  lag: 3,
  threshold: 1,
  influence: 0.75
}

/**
 * Core divergence detection function that works with any indicator
 */
function findDivergences(
  candles: ICandle[],
  zScoreConfig: IZScoreConfig,
  indicatorValues: number[],
): IDivergence[] {
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
      map(({ pricePeaks, indicatorZigzags }) => collectCorrelations(candles, pricePeaks, indicatorZigzags)),
      map(correlations => findConsecutiveGroups(correlations)),
      map(groups => findDivergencesInGroups(groups))
    )
    .subscribe((result: IDivergence[]) => {
      divergences = result;
    });

  return divergences;
}

function collectCorrelations(
  candles: ICandle[],
  pricePeaks: any[],
  indicatorZigzags: any[]
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

  console.log(`\n🔍 DEBUG: correlations:`);
  correlations.forEach((corr, i) => {
    console.log(`${i}: Peak ${corr.peakIndex} ${corr.direction} at ${corr.time.toISOString().slice(11, 19)} | Price: ${corr.priceValue.toFixed(3)} | ${corr.indicatorValue.toFixed(1)}`);
  });

  return correlations;
}

/**
 * Find consecutive groups of correlations (allowing small gaps in peak indices)
 * This is much more efficient than generating all possible subsequences
 */
function findConsecutiveGroups(correlations: IDivergencePoint[]): IDivergencePoint[][] {
  if (correlations.length < 2) return [];

  const groups: IDivergencePoint[][] = [];
  let currentGroup: IDivergencePoint[] = [correlations[0]];

  for (let i = 1; i < correlations.length; i++) {
    const current = correlations[i];
    const last = currentGroup[currentGroup.length - 1];

    // Allow gaps up to 10 peak indices (adjustable based on your data)
    const peakGap = current.peakIndex - last.peakIndex;

    if (peakGap <= 15) { // Consecutive enough
      currentGroup.push(current);
    } else {
      // Save current group if it has enough points
      if (currentGroup.length >= 4) {
        groups.push([...currentGroup]);
      }
      // Start new group
      currentGroup = [current];
    }
  }

  // Don't forget the last group
  if (currentGroup.length >= 4) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Find the longest valid divergence in each consecutive group
 * This eliminates the need for duplicate removal
 */
function findDivergencesInGroups(groups: IDivergencePoint[][]): IDivergence[] {
  const divergences: IDivergence[] = [];

  for (const group of groups) {
    // Try to find the longest valid divergence starting from the full group
    // and working backwards if needed
    let foundDivergence = false;

    for (let length = group.length; length >= 4 && !foundDivergence; length--) {
      for (let start = 0; start <= group.length - length && !foundDivergence; start++) {
        const sequence = group.slice(start, start + length);
        const divergence = analyseDivergencePattern(sequence);

        if (divergence) {
          divergences.push(divergence);
          foundDivergence = true; // Exit both loops for this group
        }
      }
    }
  }

  return divergences;
}

function analyseDivergencePattern(points: IDivergencePoint[]): IDivergence | null {
  if (points.length < 4) return null;

  // Points are already in chronological order
  // For valid divergences, we need consecutive zigzag points (alternating pattern)

  // Check for bullish divergence with consecutive lows
  const bullishDiv = checkConsecutiveLowsDivergence(points);
  if (bullishDiv) return bullishDiv;

  // Check for bearish divergence with consecutive highs  
  const bearishDiv = checkConsecutiveHighsDivergence(points);
  if (bearishDiv) return bearishDiv;

  return null;
}

function checkConsecutiveLowsDivergence(points: IDivergencePoint[]): IDivergence | null {
  // Extract only the LOWs and ensure they form a valid sequence
  const lows = points.filter(p => p.direction === 'LOW');
  if (lows.length < 2) return null;

  // Verify these lows are properly spaced in the original sequence
  // (i.e., there should be at least one HIGH between consecutive lows)
  const validLows: IDivergencePoint[] = [lows[0]];

  for (let i = 1; i < lows.length; i++) {
    const currentLow = lows[i];
    const lastValidLow = validLows[validLows.length - 1];

    // Find positions in original points array
    const lastLowPos = points.indexOf(lastValidLow);
    const currentLowPos = points.indexOf(currentLow);

    // Check if there's at least one HIGH between them
    const pointsBetween = points.slice(lastLowPos + 1, currentLowPos);
    const hasHighBetween = pointsBetween.some(p => p.direction === 'HIGH');

    if (hasHighBetween) {
      validLows.push(currentLow);
    }
  }

  if (validLows.length < 2) return null;

  const firstPrice = validLows[0].priceValue;
  const lastPrice = validLows[validLows.length - 1].priceValue;
  const firstIndicator = validLows[0].indicatorValue;
  const lastIndicator = validLows[validLows.length - 1].indicatorValue;

  // Check for bullish divergence: price lower lows, indicator higher lows
  const priceDecreasing = lastPrice < firstPrice;
  const indicatorIncreasing = lastIndicator > firstIndicator;

  if (priceDecreasing && indicatorIncreasing) {
    return {
      type: SIGNAL_DIRECTION.BULLISH,
      startTime: validLows[0].time,
      endTime: validLows[validLows.length - 1].time,
      points: validLows,
      strength: validLows.length,
      description: `Bullish divergence: Price lower lows (${firstPrice.toFixed(3)} → ${lastPrice.toFixed(3)}) while higher lows (${firstIndicator.toFixed(1)} → ${lastIndicator.toFixed(1)})`
    };
  }

  return null;
}

function checkConsecutiveHighsDivergence(points: IDivergencePoint[]): IDivergence | null {
  // Extract only the HIGHs and ensure they form a valid sequence
  const highs = points.filter(p => p.direction === 'HIGH');
  if (highs.length < 2) return null;

  // Verify these highs are properly spaced in the original sequence
  // (i.e., there should be at least one LOW between consecutive highs)
  const validHighs: IDivergencePoint[] = [highs[0]];

  for (let i = 1; i < highs.length; i++) {
    const currentHigh = highs[i];
    const lastValidHigh = validHighs[validHighs.length - 1];

    // Find positions in original points array
    const lastHighPos = points.indexOf(lastValidHigh);
    const currentHighPos = points.indexOf(currentHigh);

    // Check if there's at least one LOW between them
    const pointsBetween = points.slice(lastHighPos + 1, currentHighPos);
    const hasLowBetween = pointsBetween.some(p => p.direction === 'LOW');

    if (hasLowBetween) {
      validHighs.push(currentHigh);
    }
  }

  if (validHighs.length < 2) return null;

  const firstPrice = validHighs[0].priceValue;
  const lastPrice = validHighs[validHighs.length - 1].priceValue;
  const firstIndicator = validHighs[0].indicatorValue;
  const lastIndicator = validHighs[validHighs.length - 1].indicatorValue;

  // Check for bearish divergence patterns
  const priceIncreasing = lastPrice > firstPrice; // higher highs
  const indicatorDecreasing = lastIndicator < firstIndicator; // lower highs

  const priceDecreasing = lastPrice < firstPrice; // lower highs
  const indicatorIncreasing = lastIndicator > firstIndicator; // higher highs

  if ((priceIncreasing && indicatorDecreasing) || (priceDecreasing && indicatorIncreasing)) {
    const pattern = priceIncreasing && indicatorDecreasing
      ? `higher highs (${firstPrice.toFixed(3)} → ${lastPrice.toFixed(3)}) while lower highs (${firstIndicator.toFixed(1)} → ${lastIndicator.toFixed(1)})`
      : `lower highs (${firstPrice.toFixed(3)} → ${lastPrice.toFixed(3)}) while higher highs (${firstIndicator.toFixed(1)} → ${lastIndicator.toFixed(1)})`;

    return {
      type: SIGNAL_DIRECTION.BEARISH,
      startTime: validHighs[0].time,
      endTime: validHighs[validHighs.length - 1].time,
      points: validHighs,
      strength: validHighs.length,
      description: `Bearish divergence: Price ${pattern}`
    };
  }

  return null;
}

/**
 * Find divergences using Money Flow Index (MFI)
 */
export function mfi(
  candles: ICandle[],
  zScoreConfig: IZScoreConfig = defaultZscoreConfig,
  mfiPeriod: number = 14
): IDivergence[] {
  const mfiValues = MFI.calculateMFI(candles, mfiPeriod);
  return findDivergences(candles, zScoreConfig, mfiValues);
}

/**
 * Find divergences using Relative Strength Index (RSI)
 */
export function rsi(
  candles: ICandle[],
  zScoreConfig: IZScoreConfig = defaultZscoreConfig,
  rsiPeriod: number = 14
): IDivergence[] {
  const rsiValues = RSI.calculateRSI(candles, rsiPeriod);
  return findDivergences(candles, zScoreConfig, rsiValues);
}

/**
 * Generic divergence finder for custom indicators
 */
export function custom(
  candles: ICandle[],
  zScoreConfig: IZScoreConfig = defaultZscoreConfig,
  indicatorValues: number[]
): IDivergence[] {
  return findDivergences(candles, zScoreConfig, indicatorValues);
}
