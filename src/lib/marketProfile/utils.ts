import { startOfWeek, getWeek, getTime } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { MARKET_PROFILE_PERIODS, MARKET_PROFILE_OPEN } from '../../constants';
import { ICandle, IInitialBalance, ITimeFrame, IOpenType } from '../../types';

export function calculateInitialBalance(profileDistribution: Record<string, string>): IInitialBalance | null {
  let ibHigh = -Infinity;
  let ibLow = Infinity;

  for (const priceStr in profileDistribution) {
    const letters = profileDistribution[priceStr];

    // Periods 'A' and 'B' form the IB
    if (letters.includes('A') || letters.includes('B')) {
      const price = parseFloat(priceStr);

      if (price > ibHigh) ibHigh = price;
      if (price < ibLow) ibLow = price;
    }
  }

  if (ibHigh === -Infinity || ibLow === Infinity) return null;

  return { high: ibHigh, low: ibLow };
}

export function getTimeFrameKey(date: string | number | Date, candleGroupingPeriod: MARKET_PROFILE_PERIODS, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone);

  switch (candleGroupingPeriod) {
    case MARKET_PROFILE_PERIODS.DAILY:
      return format(zonedDate, 'yyyy-MM-dd');
    case MARKET_PROFILE_PERIODS.WEEKLY:
      const weekStart = startOfWeek(zonedDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'yyyy')}-W${getWeek(weekStart, {
        weekStartsOn: 1
      })
        .toString()
        .padStart(2, '0')}`;
    case MARKET_PROFILE_PERIODS.MONTHLY:
      return format(zonedDate, 'yyyy-MM');
  }
}

export function groupCandlesByTimePeriod(candles: ICandle[], candleGroupingPeriod: MARKET_PROFILE_PERIODS, timezone: string): ITimeFrame[] {
  const periodsMap: Record<string, ITimeFrame> = {};

  for (const candle of candles) {
    const timeFrameKey = getTimeFrameKey(candle.openTime, candleGroupingPeriod, timezone);

    if (!periodsMap[timeFrameKey]) {
      periodsMap[timeFrameKey] = {
        startTime: getTime(candle.openTime),
        endTime: getTime(candle.openTime),
        candles: [candle]
      };
    } else {
      const currentPeriod = periodsMap[timeFrameKey];
      currentPeriod.endTime = getTime(candle.openTime);
      currentPeriod.candles.push(candle);
    }
  }

  return Object.values(periodsMap).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

/**
 * Determines the type of market open based on price action in the first two periods
 *
 * @param candles The first two candles of the profile timeframe
 * @param tickSize The size of each price tick
 * @returns The type of market open (Drive or Auction)
 */
export function determineOpenType(candles: ICandle[], tickSize: number): IOpenType | null {
  if (candles.length !== 2) {
    return null;
  }

  const openPrice = candles[0].open;

  // Get the extreme prices from the first two candles
  const highestHigh = Math.max(candles[0].high, candles[1].high);
  const lowestLow = Math.min(candles[0].low, candles[1].low);

  // For upward drive: lowest price should not be more than 1 tick below open
  // and highest price should be above open
  if (lowestLow >= openPrice - tickSize && highestHigh > openPrice) {
    return {
      type: MARKET_PROFILE_OPEN.OPEN_DRIVE,
      direction: 'up'
    };
  }

  // For downward drive: highest price should not be more than 1 tick above open
  // and lowest price should be below open
  if (highestHigh <= openPrice + tickSize && lowestLow < openPrice) {
    return {
      type: MARKET_PROFILE_OPEN.OPEN_DRIVE,
      direction: 'down'
    };
  }

  // Check for Open Auction - at least 40% of price action above and below open
  const totalRange = highestHigh - lowestLow;
  const rangeAboveOpen = highestHigh - openPrice;
  const rangeBelowOpen = openPrice - lowestLow;

  const percentAbove = rangeAboveOpen / totalRange;
  const percentBelow = rangeBelowOpen / totalRange;

  if (percentAbove >= 0.4 && percentBelow >= 0.4) {
    return { type: MARKET_PROFILE_OPEN.OPEN_AUCTION };
  }

  return null;
}
