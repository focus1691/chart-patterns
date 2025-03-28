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
    let tpoCount = 0;

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const tpoLetter = TPO_LETTERS[i % TPO_LETTERS.length];

      for (let price = candle.low; price <= candle.high; price += priceStep) {
        const roundedPrice = round(
          Math.round(price / priceStep) * priceStep,
          pricePrecision
        );
        profileDistribution[roundedPrice] =
          (profileDistribution[roundedPrice] || '') + tpoLetter;

        tpoCount++;
      }
    }

    const profile: IMarketProfile = {
      startTime,
      endTime,
      initialBalance: calculateInitialBalance(candles, timezone),
      valueArea: calculateValueArea(profileDistribution),
      profileDistribution: includeProfileDistribution
        ? profileDistribution
        : undefined,
      tpoCount
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

  // Calculate TPO counts (time spent) per price level
  const marketProfile = prices.map((price) => ({
    price,
    tpoCount: profileDistribution[price].length
  }));

  const totalTPOs = marketProfile.reduce((sum, { tpoCount }) => sum + tpoCount, 0);
  const valueAreaTPOs = totalTPOs * 0.7;

  // Identify the Point of Control (POC) as price level with highest TPO count
  const sortedByTPO = [...marketProfile].sort((a, b) => b.tpoCount - a.tpoCount);
  const POC = sortedByTPO[0].price;

  // Start from POC and expand outwards
  const pocIndex = prices.indexOf(POC);
  let lowerIndex = pocIndex - 1;
  let upperIndex = pocIndex + 1;

  let cumulativeTPOs = sortedByTPO[0].tpoCount;
  const valueAreaPrices = [POC];

  while (cumulativeTPOs < valueAreaTPOs && (lowerIndex >= 0 || upperIndex < prices.length)) {
    const lowerTPOs = lowerIndex >= 0 ? marketProfile[lowerIndex].tpoCount : -1;
    const upperTPOs = upperIndex < prices.length ? marketProfile[upperIndex].tpoCount : -1;

    if (lowerTPOs >= upperTPOs) {
      if (lowerIndex >= 0) {
        cumulativeTPOs += lowerTPOs;
        valueAreaPrices.push(marketProfile[lowerIndex].price);
        lowerIndex--;
      } else if (upperIndex < prices.length) {
        cumulativeTPOs += upperTPOs;
        valueAreaPrices.push(marketProfile[upperIndex].price);
        upperIndex++;
      }
    } else {
      if (upperIndex < prices.length) {
        cumulativeTPOs += upperTPOs;
        valueAreaPrices.push(marketProfile[upperIndex].price);
        upperIndex++;
      } else if (lowerIndex >= 0) {
        cumulativeTPOs += lowerTPOs;
        valueAreaPrices.push(marketProfile[lowerIndex].price);
        lowerIndex--;
      }
    }
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
