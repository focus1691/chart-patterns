import { round } from '../../utils';
import { TPO_LETTERS } from '../../constants';
import { IMarketProfile, IMarketProfileBuilderConfig, ITimeFrame, IValueArea } from '../../types';
import { calculateInitialBalance, groupCandlesByTimePeriod } from './utils';

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
 * const marketProfile: IMarketProfile = MarketProfile.build({ candles, tickSize: 0.1, tickMultiplier: 100, pricePrecision: 2, candleGroupingPeriod: MARKET_PROFILE_PERIODS.DAILY, timezone: 'Europe/London' });
 *
 */
export function build(config: IMarketProfileBuilderConfig): IMarketProfile[] {
  const { candles, tickSize, tickMultiplier, candleGroupingPeriod, timezone, pricePrecision, includeProfileDistribution = false } = config;
  const periods: ITimeFrame[] = groupCandlesByTimePeriod(candles, candleGroupingPeriod, timezone);
  const profiles: IMarketProfile[] = buildMarketProfiles(periods, tickSize, tickMultiplier, timezone, pricePrecision, includeProfileDistribution);

  return profiles;
}

function buildMarketProfiles(
  periods: ITimeFrame[],
  tickSize: number,
  tickMultiplier: number,
  timezone: string,
  pricePrecision: number,
  includeProfileDistribution: boolean
): IMarketProfile[] {
  const profiles: IMarketProfile[] = [];
  const priceStep = tickSize * tickMultiplier;

  for (const period of periods) {
    const { candles, startTime, endTime } = period;
    const profileDistribution: Record<string, string> = {};

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const tpoLetter = TPO_LETTERS[i % TPO_LETTERS.length];

      for (let price = candle.low; price <= candle.high; price += priceStep) {
        const roundedPrice = round((price / priceStep) * priceStep, pricePrecision);
        profileDistribution[roundedPrice] = (profileDistribution[roundedPrice] || '') + tpoLetter;
      }
    }

    const profile: IMarketProfile = {
      startTime,
      endTime,
      initialBalance: calculateInitialBalance(candles, timezone),
      valueArea: calculateValueArea(profileDistribution),
      profileDistribution: includeProfileDistribution ? profileDistribution : undefined
    };

    profiles.push(profile);
  }

  return profiles;
}

function calculateValueArea(profileDistribution: Record<string, string>): IValueArea {
  const prices = Object.keys(profileDistribution)
    .map(Number)
    .sort((a, b) => a - b);

  const high = Math.max(...prices);
  const low = Math.min(...prices);

  const marketProfile = prices.map((price) => ({
    price,
    volume: profileDistribution[price].length
  }));
  marketProfile.sort((a, b) => b.volume - a.volume);

  const POC = marketProfile[0].price;

  const totalVolume = marketProfile.reduce((sum, { volume }) => sum + volume, 0);
  const valueAreaVolume = totalVolume * 0.7;

  let cumulativeVolume = 0;
  let valueAreaPrices: number[] = [];

  for (const { price, volume } of marketProfile) {
    cumulativeVolume += volume;
    valueAreaPrices.push(price);
    if (cumulativeVolume >= valueAreaVolume) break;
  }

  const VAH = Math.max(...valueAreaPrices);
  const VAL = Math.min(...valueAreaPrices);

  const EQ = (VAH + VAL) / 2;

  return {
    high,
    VAH,
    POC,
    EQ,
    VAL,
    low
  };
}
