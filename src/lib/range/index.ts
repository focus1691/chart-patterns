import moment from 'moment';
import { from, map, toArray } from 'rxjs';
import { FIBONACCI_NUMBERS, IFibonacciRetracement, SIGNAL_DIRECTION } from '../../constants';
import { ICandle } from '../../types/candle.types';
import { ISignalsConfig } from '../../types/peakDetector.types';
import { ILocalRange, IPeak } from '../../types/range.types';
import { IZigZag } from '../../types/zigzags.types';
import { countDecimals, isBetween, round } from '../../utils/math';
import * as PeakDetector from '../peakDetector';

function toZigzags(klines: ICandle[], peaks: IPeak[]): IZigZag {
  const zigzag: IZigZag = {} as IZigZag;
  for (let i = 0; i < peaks.length; i++) {
    const { position, direction }: IPeak = peaks[i];
    const close: number = Number(klines[position!]?.close);
    if (!zigzag.price) {
      zigzag.direction = direction === 1 ? 'PEAK' : 'TROUGH';
      zigzag.price = close;
      zigzag.timestamp = moment(klines[position!].openTime).unix();
    } else {
      if ((zigzag.direction === 'PEAK' && close > zigzag.price) || (zigzag.direction === 'TROUGH' && close < zigzag.price)) {
        zigzag.price = close;
        zigzag.timestamp = moment(klines[position!].openTime).unix();
      }
    }
  }
  return zigzag;
}

function calculateFibonacci(range: ILocalRange, direction: SIGNAL_DIRECTION): IFibonacciRetracement {
  const fibonacci: IFibonacciRetracement = {} as IFibonacciRetracement;

  if (!range.resistance || !range.support) return fibonacci;

  const diff: number = Math.abs(range.resistance - range.support);

  const retracement = (fibNumber: number): number | null => {
    const decimals = Math.max(countDecimals(range.support), countDecimals(range.resistance));
    return direction === SIGNAL_DIRECTION.BULLISH
      ? round(range.support + diff * fibNumber, decimals) // Low to High
      : round(range.resistance - diff * fibNumber, decimals); // High to Low
  };

  Object.values(FIBONACCI_NUMBERS)
    .filter((fib): fib is number => typeof fib === 'number') // Ensure only numeric values
    .forEach((fib) => {
      fibonacci[fib as keyof IFibonacciRetracement] = retracement(fib);
    });

  return fibonacci;
}

function toRanges(zigzags: IZigZag[], candles: ICandle[]): ILocalRange[] {
  const ranges: ILocalRange[] = [];
  let currentRange: ILocalRange | null = null;

  for (let i = 0; i < zigzags.length - 1; i++) {
    const currentZigzag = zigzags[i];
    const nextZigzag = zigzags[i + 1];

    if (!currentRange) {
      const startCandle = findRangeStartCandle(candles, currentZigzag, nextZigzag);

      if (startCandle) {
        currentRange = {
          start: moment(startCandle.openTime).unix(),
          [currentZigzag.direction === 'PEAK' ? 'resistance' : 'support']: currentZigzag.price,
          direction: currentZigzag.direction === 'PEAK' ? SIGNAL_DIRECTION.BULLISH : SIGNAL_DIRECTION.BEARISH
        };
      }
    } else {
      if (currentZigzag.direction === 'PEAK') {
        currentRange.resistance = Math.max(currentRange.resistance || 0, currentZigzag.price);
      } else {
        currentRange.support = Math.min(currentRange.support || Infinity, currentZigzag.price);
      }

      const breakoutCandle = findBreakoutCandle(currentRange, candles, currentZigzag.timestamp, nextZigzag.timestamp);

      if (breakoutCandle) {
        currentRange.end = moment(breakoutCandle.openTime).unix();
        ranges.push(currentRange);

        currentRange = null;
      }
    }
  }

  if (currentRange && !currentRange.end) {
    const lastBreakout = findBreakoutCandle(currentRange, candles, zigzags[zigzags.length - 2].timestamp, zigzags[zigzags.length - 1].timestamp);
    currentRange.end = lastBreakout ? moment(lastBreakout.openTime).unix() : zigzags[zigzags.length - 1].timestamp;
    ranges.push(currentRange);
  }

  return ranges;
}

function findRangeStartCandle(candles: ICandle[], currentZigzag: IZigZag, nextZigzag: IZigZag): ICandle | null {
  const relevantCandles = candles.filter((c) => moment(c.openTime).unix() >= currentZigzag.timestamp && moment(c.openTime).unix() <= nextZigzag.timestamp);

  if (currentZigzag.direction === 'PEAK') {
    return relevantCandles.find((c) => Number(c.close) < currentZigzag.price) || null;
  } else {
    return relevantCandles.find((c) => Number(c.close) > currentZigzag.price) || null;
  }
}

function findBreakoutCandle(range: ILocalRange, candles: ICandle[], startTime: number, endTime: number): ICandle | null {
  const relevantCandles = candles.filter((c) => moment(c.openTime).unix() >= startTime && moment(c.openTime).unix() <= endTime);

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

    if (!nextResistance || !nextSupport) {
      fullExtendedRanges.push(ranges[i]);
    } else if (isInPrevRange(nextResistance) || isInPrevRange(nextSupport)) {
      const beginning: number = Math.min(moment(start).valueOf(), moment(end).valueOf(), moment(ranges[i].start).valueOf(), moment(ranges[i].end).valueOf());
      const ending: number = Math.max(moment(start).valueOf(), moment(end).valueOf(), moment(ranges[i].start).valueOf(), moment(ranges[i].end).valueOf());
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

function appendFibs(ranges: ILocalRange[]): ILocalRange[] {
  for (let i = 0; i < ranges.length; i++) {
    ranges[i].fibs = {
      lowToHigh: calculateFibonacci(ranges[i], SIGNAL_DIRECTION.BEARISH),
      highToLow: calculateFibonacci(ranges[i], SIGNAL_DIRECTION.BULLISH)
    };
  }
  return ranges;
}

export function findRanges(candles: ICandle[], lag: number, threshold: number, influence: number): ILocalRange[] {
  let ranges: ILocalRange[] = [];

  const config: ISignalsConfig = {
    values: candles.map((candle) => (Number(candle.high) + Number(candle.low) + Number(candle.close)) / 3),
    lag,
    threshold,
    influence
  };

  from(PeakDetector.findSignals(config))
    .pipe(
      map((peaks) => toZigzags(candles, peaks as IPeak[])),
      toArray(),
      map((zigzags) => toRanges(zigzags, candles)),
      map(mergeRanges),
      map(appendFibs)
    )
    .subscribe((result: ILocalRange[]) => {
      ranges = result;
    });

  return ranges;
}
