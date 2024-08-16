import { format, getTime, getWeek, startOfWeek } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { MARKET_PROFILE_PERIODS, TPO_LETTERS } from '../../constants'
import { ICandle, IInitialBalance, IMarketProfile, IMarketProfileBuilderConfig, IMarketProfileStructure, ITimeFrame, IValueArea } from '../../types'

export function build(config: IMarketProfileBuilderConfig): { [key: string]: IMarketProfile } {
  const { tickSize, tickMultiplier, timezone } = config
  const periods: ITimeFrame[] = groupCandlesByTimePeriod(config)
  const profiles: { [key: string]: IMarketProfile } = buildMarketProfiles(periods, tickSize, tickMultiplier, timezone)

  return profiles
}

function buildMarketProfiles(periods: ITimeFrame[], tickSize: number, tickMultiplier: number, timezone: string): { [key: string]: IMarketProfile } {
  const profiles: { [key: string]: IMarketProfile } = {}
  const priceStep = tickSize * tickMultiplier

  for (const period of periods) {
    const { candles, startTime, endTime, timeFrameKey } = period
    const profile: IMarketProfile = {
      startTime,
      endTime,
      structure: {} as IMarketProfileStructure,
      IB: calculateInitialBalance(candles, timezone)
    }

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i]
      const tpoLetter = TPO_LETTERS[i % TPO_LETTERS.length]

      for (let price = candle.low; price <= candle.high; price += priceStep) {
        const roundedPrice = Math.round(price / priceStep) * priceStep
        profile.structure[roundedPrice] = (profile.structure[roundedPrice] || '') + tpoLetter
      }
    }

    profile.valueArea = calculateValueArea(profile.structure)

    profiles[timeFrameKey] = profile
  }

  return profiles
}

function calculateInitialBalance(candles: ICandle[], timezone: string): IInitialBalance | null {
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

export function calculateValueArea(structure: IMarketProfileStructure): IValueArea {
  const prices = Object.keys(structure)
    .map(Number)
    .sort((a, b) => a - b)

  const high = Math.max(...prices)
  const low = Math.min(...prices)

  const volumeProfile = prices.map((price) => ({ price, volume: structure[price].length }))
  volumeProfile.sort((a, b) => b.volume - a.volume)

  const POC = volumeProfile[0].price

  const totalVolume = volumeProfile.reduce((sum, { volume }) => sum + volume, 0)
  const valueAreaVolume = totalVolume * 0.7

  let cumulativeVolume = 0
  let valueAreaPrices = []

  for (const { price, volume } of volumeProfile) {
    cumulativeVolume += volume
    valueAreaPrices.push(price)
    if (cumulativeVolume >= valueAreaVolume) break
  }

  const VAH = Math.max(...valueAreaPrices)
  const VAL = Math.min(...valueAreaPrices)

  const EQ = (VAH + VAL) / 2

  return {
    high,
    VAH,
    POC,
    EQ,
    VAL,
    low
  }
}

function getTimeFrameKey(date: string | number | Date, period: MARKET_PROFILE_PERIODS, timezone: string): string {
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

function groupCandlesByTimePeriod(config: IMarketProfileBuilderConfig): ITimeFrame[] {
  const { candles, period, timezone } = config

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
        candles: [candle],
        timeFrameKey
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
