import { format, getWeek, startOfWeek } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { MARKET_PROFILE_PERIODS } from '../../constants'
import { ICandle, IMarketProfile } from '../../types'

interface IMarketProfileBuilderConfig {
  candles: ICandle[]
  period: MARKET_PROFILE_PERIODS
  tickSize: number
  tickMultiplier: number
  timezone: string
}

interface ITimeFrame {
  startTime: string | number | Date
  endTime: string | number | Date
  candles: ICandle[]
}

function getTimeFrameKey(startTime: string | number | Date, period: MARKET_PROFILE_PERIODS, timezone: string): string {
  const zonedDate = toZonedTime(startTime, timezone)

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

function groupCandlesByTimeFrame(candles: ICandle[], period: MARKET_PROFILE_PERIODS, timezone: string): ITimeFrame[] {
  const timeFrames: ITimeFrame[] = new Array(Math.ceil(candles.length / 24))
  let timeFrameCount = 0

  let currentTimeFrame: ITimeFrame | null = null
  let currentTimeFrameKey = ''

  for (const candle of candles) {
    const timeFrameKey = getTimeFrameKey(candle.openTime, period, timezone)

    if (timeFrameKey !== currentTimeFrameKey) {
      if (currentTimeFrame) {
        timeFrames[timeFrameCount++] = currentTimeFrame
      }
      currentTimeFrame = {
        startTime: candle.openTime,
        endTime: candle.openTime,
        candles: [candle]
      }
      currentTimeFrameKey = timeFrameKey
    } else if (currentTimeFrame) {
      currentTimeFrame.endTime = candle.openTime
      currentTimeFrame.candles.push(candle)
    }
  }

  if (currentTimeFrame) {
    timeFrames[timeFrameCount++] = currentTimeFrame
  }

  timeFrames.length = timeFrameCount

  return timeFrames
}
export function build(config: IMarketProfileBuilderConfig): IMarketProfile {
  const { candles, period, timezone } = config

  const timeFrames = groupCandlesByTimeFrame(candles, period, timezone)
}
