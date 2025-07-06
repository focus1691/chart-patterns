import { from, map } from 'rxjs';
import { FIBONACCI_NUMBERS, IFibonacciRetracement, SIGNAL_DIRECTION } from '../../constants';
import { ICandle } from '../../types/candle.types';
import { IZScoreConfig } from '../../types/peakDetector.types';
import { ILocalRange } from '../../types/range.types';
import { IZigZag } from '../../types/zigzags.types';
import { countDecimals, isBetween, round } from '../../utils/math';
import { ZigZags } from '..';

function isValidRange(range: Partial<ILocalRange>): boolean {
  return range !== undefined && typeof range.support === 'number' && typeof range.resistance === 'number';
}

function toRanges(zigzags: IZigZag[], candles: ICandle[]): ILocalRange[] {
  const ranges: ILocalRange[] = [];
  let currentRange: Partial<ILocalRange> | null = null;

  for (let i = 0; i < zigzags.length - 1; i++) {
    const currentZigzag = zigzags[i];
    const nextZigzag = zigzags[i + 1];

    if (!currentRange) {
      const startCandle = findRangeStartCandle(candles, currentZigzag, nextZigzag);

      if (startCandle) {
        currentRange = {
          start: currentZigzag.timestamp,
          [currentZigzag.direction === SIGNAL_DIRECTION.BULLISH ? 'resistance' : 'support']: currentZigzag.price,
          direction: currentZigzag.direction
        };
      }
    } else {
      if (currentZigzag.direction === SIGNAL_DIRECTION.BULLISH) {
        currentRange.resistance = Math.max(currentRange.resistance || 0, currentZigzag.price);
      } else {
        currentRange.support = Math.min(currentRange.support || Infinity, currentZigzag.price);
      }

      const breakoutCandle = findBreakoutCandle(currentRange, candles, currentZigzag.timestamp, nextZigzag.timestamp);

      if (breakoutCandle) {
        currentRange.end = nextZigzag.timestamp;

        if (isValidRange(currentRange)) {
          ranges.push(currentRange as ILocalRange);
        }

        currentRange = null;
      }
    }
  }

  if (isValidRange(currentRange) && !currentRange.end) {
    currentRange.end = zigzags[zigzags.length - 1].timestamp;
    ranges.push(currentRange as ILocalRange);
  }

  return ranges;
}

function findRangeStartCandle(candles: ICandle[], currentZigzag: IZigZag, nextZigzag: IZigZag): ICandle | null {
  const relevantCandles = candles.filter((c) => {
    const openTimeMs = Math.floor(c.openTime.getTime() / 1000);
    return openTimeMs >= currentZigzag.timestamp && openTimeMs <= nextZigzag.timestamp;
  });

  if (currentZigzag.direction === SIGNAL_DIRECTION.BULLISH) {
    return relevantCandles.find((c) => Number(c.close) < currentZigzag.price) || null;
  } else {
    return relevantCandles.find((c) => Number(c.close) > currentZigzag.price) || null;
  }
}

function findBreakoutCandle(range: Partial<ILocalRange>, candles: ICandle[], startTime: number, endTime: number): ICandle | null {
  const relevantCandles = candles.filter((c) => Math.floor(c.openTime.getTime() / 1000) >= startTime && Math.floor(c.openTime.getTime() / 1000) <= endTime);

  for (const candle of relevantCandles) {
    if (range.resistance && Number(candle.close) > range.resistance) {
      return candle;
    }
    if (range.support && Number(candle.close) < range.support) {
      return candle;
    }
  }

  return null;
}

function mergeRanges(ranges: ILocalRange[]): ILocalRange[] {
  if (!ranges) return [];
  const fullExtendedRanges: ILocalRange[] = [ranges[0]];

  for (let i = 1; i < ranges.length; i++) {
    const { resistance, support, start, end } = fullExtendedRanges[fullExtendedRanges.length - 1];
    const nextResistance = ranges[i].resistance;
    const nextSupport = ranges[i].support;
    const isInPrevRange = isBetween(support!)(resistance!);

    // Check if previous range is completely contained within the next range
    const isPrevRangeInNext = support !== undefined && resistance !== undefined &&
                             nextSupport !== undefined && nextResistance !== undefined &&
                             support >= nextSupport && resistance <= nextResistance;

    // Calculate range sizes to avoid joining when next range is significantly larger
    const prevRangeSize = resistance !== undefined && support !== undefined ? resistance - support : 0;
    const nextRangeSize = nextResistance !== undefined && nextSupport !== undefined ? nextResistance - nextSupport : 0;
    const sizeRatio = prevRangeSize > 0 ? nextRangeSize / prevRangeSize : Infinity;

    // Only join if the next range isn't more than 2.5x the size of the previous range
    const shouldJoinContainedRange = isPrevRangeInNext && sizeRatio <= 2.5;

    if (!nextResistance || !nextSupport) {
      fullExtendedRanges.push(ranges[i]);
    } else if (isInPrevRange(nextResistance) || isInPrevRange(nextSupport) || shouldJoinContainedRange) {
      const beginning: number = Math.min(start!, end!, ranges[i].start!, ranges[i].end!);
      const ending: number = Math.max(start!, end!, ranges[i].start!, ranges[i].end!);
      fullExtendedRanges[fullExtendedRanges.length - 1].resistance = Math.max(resistance ?? nextResistance, nextResistance);
      fullExtendedRanges[fullExtendedRanges.length - 1].support = Math.min(support ?? nextSupport, nextSupport);
      fullExtendedRanges[fullExtendedRanges.length - 1].start = beginning;
      fullExtendedRanges[fullExtendedRanges.length - 1].end = ending;
    } else {
      fullExtendedRanges.push(ranges[i]);
    }
  }
  return fullExtendedRanges;
}

/**
 * Find price ranges using Z-Score based peak detection algorithm
 *
 * @param candles - Array of candlestick data to analyse
 * @param zScoreConfig - Configuration parameters for the Z-Score algorithm:
 *   - lag: Controls smoothing and adaptability to long-term changes
 *   - threshold: Number of standard deviations required to classify a signal
 *   - influence: How strongly signals affect future calculations (0-1)
 * @returns Array of local price ranges with support and resistance levels
 */
export function findRanges(candles: ICandle[], zScoreConfig: IZScoreConfig): ILocalRange[] {
  let ranges: ILocalRange[] = [];

  const zigzags = ZigZags.create(candles, {
    ...zScoreConfig,
    priceMethod: 'close'
  });

  from([zigzags])
    .pipe(
      map((zigzags) => toRanges(zigzags, candles)),
      map(mergeRanges),
      map(appendFibs)
    )
    .subscribe((result: ILocalRange[]) => {
      ranges = result;
    });

  return ranges;
}

function calculateFibonacci(range: ILocalRange, direction: SIGNAL_DIRECTION): IFibonacciRetracement {
  const fibonacci: IFibonacciRetracement = {} as IFibonacciRetracement;

  if (!range.resistance || !range.support) return fibonacci;

  const diff: number = Math.abs(range.resistance - range.support);

  const retracement = (fibNumber: number): number | null => {
    const decimals = Math.max(countDecimals(range.support!), countDecimals(range.resistance!));
    return direction === SIGNAL_DIRECTION.BULLISH
      ? round(range.support! + diff * fibNumber, decimals) // Low to High
      : round(range.resistance! - diff * fibNumber, decimals); // High to Low
  };

  Object.values(FIBONACCI_NUMBERS)
    .filter((fib): fib is number => typeof fib === 'number') // Ensure only numeric values
    .forEach((fib) => {
      fibonacci[fib as keyof IFibonacciRetracement] = retracement(fib);
    });

  return fibonacci;
}

function appendFibs(ranges: ILocalRange[]): ILocalRange[] {
  if (!ranges) return [];

  for (let i = 0; i < ranges.length; i++) {
    // Skip undefined ranges or those without both support and resistance
    if (!ranges[i] || ranges[i].resistance === undefined || ranges[i].support === undefined) {
      continue;
    }

    ranges[i].fibs = {
      lowToHigh: calculateFibonacci(ranges[i], SIGNAL_DIRECTION.BEARISH),
      highToLow: calculateFibonacci(ranges[i], SIGNAL_DIRECTION.BULLISH)
    };
  }
  return ranges;
}
