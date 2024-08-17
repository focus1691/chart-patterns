import { TPO_LETTERS } from '../../constants'
import { IMarketProfile, IMarketProfileBuilderConfig, IMarketProfileStructure, ITimeFrame, IValueArea } from '../../types'
import { calculateInitialBalance, groupCandlesByTimePeriod } from './utils'

/**
 * Calculates the market profile for an array of candles. Typically, you use 30m candles, but you can theoretically use any timeframe.
 *
 * @param {IMarketProfileBuilderConfig} config - Configuration for how you want to construct the profile. The session (London / Frankfurt / New York), and the tick size & multiplier.
 * @returns {IMarketProfile} List of generated Market Profiles.
 *
 * Each market profile includes:
 *   - Value Area: The range of prices where a significant portion of time was spent.
 *   - Initial Balance: The price range established during the first hour of trading.
 *
 * @example
 * // Assuming 'candles' is an array of ICandle objects representing the price data
 * // Create a volume profile with a specified tick size
 * const marketProfile: IMarketProfile = MarketProfile.build({ candles, tickSize: 0.1, tickMultiplier: 100, period: MARKET_PROFILE_PERIODS.DAILY, timezone: 'Europe/London' });
 *
 */
export function build(config: IMarketProfileBuilderConfig): IMarketProfile[] {
  const { candles, tickSize, tickMultiplier, period, timezone } = config
  const periods: ITimeFrame[] = groupCandlesByTimePeriod(candles, period, timezone)
  const profiles: IMarketProfile[] = buildMarketProfiles(periods, tickSize, tickMultiplier, timezone)

  return profiles
}

function buildMarketProfiles(periods: ITimeFrame[], tickSize: number, tickMultiplier: number, timezone: string): IMarketProfile[] {
  const profiles: IMarketProfile[] = []
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

    profiles.push(profile)
  }

  return profiles
}

export function calculateValueArea(structure: IMarketProfileStructure): IValueArea {
  const prices = Object.keys(structure)
    .map(Number)
    .sort((a, b) => a - b)

  const high = Math.max(...prices)
  const low = Math.min(...prices)

  const volumeProfile = prices.map((price) => ({
    price,
    volume: structure[price].length
  }))
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
