import { startOfWeek, getWeek, getTime } from 'date-fns'
import { format, toZonedTime } from 'date-fns-tz'
import { MARKET_PROFILE_PERIODS } from '../../constants'
import { ICandle, IInitialBalance, ITimeFrame } from '../../types'

export function calculateInitialBalance(candles: ICandle[], timezone: string): IInitialBalance | null {
  let ibHigh = -Infinity
  let ibLow = Infinity
  let ibDataFound = false

  for (const candle of candles) {
    const zonedCandleTime = toZonedTime(candle.openTime, timezone)
    const candleHour = zonedCandleTime.getHours()

    if (candleHour > 0) break

    ibHigh = Math.max(ibHigh, candle.high)
    ibLow = Math.min(ibLow, candle.low)
    ibDataFound = true
  }

  if (ibDataFound && ibHigh !== -Infinity && ibLow !== Infinity) {
    return {
      high: ibHigh,
      low: ibLow
    }
  }

  return null
}

export function getTimeFrameKey(date: string | number | Date, period: MARKET_PROFILE_PERIODS, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone)

  switch (period) {
    case MARKET_PROFILE_PERIODS.DAILY:
      return format(zonedDate, 'yyyy-MM-dd')
    case MARKET_PROFILE_PERIODS.WEEKLY:
      const weekStart = startOfWeek(zonedDate, { weekStartsOn: 1 })
      return `${format(weekStart, 'yyyy')}-W${getWeek(weekStart, {
        weekStartsOn: 1
      })
        .toString()
        .padStart(2, '0')}`
    case MARKET_PROFILE_PERIODS.MONTHLY:
      return format(zonedDate, 'yyyy-MM')
  }
}

export function groupCandlesByTimePeriod(candles: ICandle[], period: MARKET_PROFILE_PERIODS, timezone: string): ITimeFrame[] {
  const periods: ITimeFrame[] = new Array(Math.ceil(candles.length / 24))
  let timeFrameCount = 0

  let currentTimeFrame: ITimeFrame | null = null
  let currentTimeFrameKey = ''

  for (const candle of candles) {
    const timeFrameKey = getTimeFrameKey(candle.openTime, period, timezone)

    if (timeFrameKey !== currentTimeFrameKey) {
      if (currentTimeFrame) {
        periods[timeFrameCount++] = currentTimeFrame
      }
      currentTimeFrame = {
        startTime: getTime(candle.openTime),
        endTime: getTime(candle.openTime),
        candles: [candle]
      }
      currentTimeFrameKey = timeFrameKey
    } else if (currentTimeFrame) {
      currentTimeFrame.endTime = getTime(candle.openTime)
      currentTimeFrame.candles.push(candle)
    }
  }

  if (currentTimeFrame) {
    periods[timeFrameCount++] = currentTimeFrame
  }

  periods.length = timeFrameCount

  return periods
}
