import { startOfWeek, getWeek, getTime } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { MARKET_PROFILE_PERIODS } from '../../constants';
import { ICandle, IInitialBalance, ITimeFrame } from '../../types';

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
