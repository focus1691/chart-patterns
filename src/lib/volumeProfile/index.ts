import {
  SIGNAL_DIRECTION,
  EXCESS_TAIL_LENGTH_SIGNIFICANCE,
  POOR_HIGH_LOW_KLINE_LENGTH_SIGNIFICANCE,
  SINGLE_PRINTS_KLINE_LENGTH_SIGNIFICANCE
} from '../../constants'
import {
  ICandle,
  ITimeFrame,
  IInitialBalance,
  INakedPointOfControl,
  IValueArea,
  IVolumeProfileConfig,
  IVolumeProfile,
  IVolumeProfileObservation
} from '../../types'
import { convertTpoPeriodToLetter } from '../../utils'
import { calculateInitialBalance, groupCandlesByTimePeriod } from '../marketProfile/utils'
import * as ValueArea from '../valueArea'

/**
 * Calculates the volume profile for a given set of candlestick data based on the specified configuration.
 *
 * The function analyses the candlestick data to construct a series of v profiles, each corresponding to a day.
 * It calculates key volume profile elements such as value area, initial balance, and various types of market observations
 * (e.g., failed auctions, excess points, poor highs and lows, etc.).
 *
 * @param {IVolumeProfileConfig} config - Configuration for how you want to construct the profile. The session (London / Frankfurt / New York), and the tick size.
 * @returns {IVolumeProfile} List of generated Volume Profiles.
 *
 * Each volume profile includes:
 *   - Value Area: The range of prices where a significant portion of volume occurred.
 *   - Initial Balance: The price range established during the first hour of trading.
 *   - Various observations: Failed Auction, Excess, Poor High / low, Single Print.
 *
 * @example
 * // Assuming 'candles' is an array of ICandle objects representing the price data
 * // Create a volume profile with a specified tick size
 * const volumeProfile: IVolumeProfile = VolumeProfile.build({ candles, tickSize: 0.5, period: MARKET_PROFILE_PERIODS.DAILY, timezone: 'Europe/London' });
 *
 */

export function build(config: IVolumeProfileConfig): IVolumeProfile[] {
  const { candles, period, timezone, valueAreaRowSize, valueAreaVolume } = config
  const periods: ITimeFrame[] = groupCandlesByTimePeriod(candles, period, timezone)
  const profiles: IVolumeProfile[] = buildVolumeProfiles(periods, timezone, valueAreaRowSize, valueAreaVolume)

  return profiles
}

function buildVolumeProfiles(periods: ITimeFrame[], timezone: string, valueAreaRowSize: number, valueAreaVolume: number): IVolumeProfile[] {
  const profiles: IVolumeProfile[] = []

  for (const period of periods) {
    const { candles, startTime, endTime } = period
    const profile: IVolumeProfile = {
      startTime,
      endTime,
      valueArea: ValueArea.calculate(candles, valueAreaRowSize, valueAreaVolume),
      IB: calculateInitialBalance(candles, timezone)
    }

    if (profile.IB && profile.valueArea) {
      profile.failedAuction = isFailedAuction(candles, profile.IB)
      profile.excess = findExcess(candles, profile.valueArea)
      profile.poorHighLow = findPoorHighAndLows(candles, profile.valueArea)
      profile.singlePrints = findSinglePrints(candles)
      profile.ledges = []
    }

    profiles.push(profile)
  }

  return profiles
}

/**
 * Finds excess points in the volume profile.
 *
 * Excess points in volume profile theory are areas where the price has made a significant move away from the value area,
 * typically indicating strong rejection or acceptance of certain price levels. They often appear at the extremes of the
 * volume profile and can signal potential market reversals or continuations.
 *
 * This function examines each candlestick in the provided array to identify such points of excess, based on the relation
 * between the candle's high/low and the value area's high/low.
 *
 * This function should be used with a specific set of 30-minute candlesticks for one trading day,
 * starting from the 00:00 candle and ending with the 23:30 candle.
 *
 * @param {ICandle[]} tpos - An array of candlesticks to analyse for excess points. These should ideally cover a full trading period.
 * @param {IValueArea} VA - The value area object, containing the high and low values that define the main area of trading activity.
 * @returns {IVolumeProfileObservation[]} An array of volume profile observations indicating excess points.
 *
 * @note The significance of an excess point is determined by comparing the length of the candle's tail (upper or lower) to its overall length.
 *       A long tail relative to the candle's body, extending beyond the value area, indicates a significant excess point.
 */
function findExcess(tpos: ICandle[], VA: IValueArea): IVolumeProfileObservation[] {
  const excess: IVolumeProfileObservation[] = []

  for (let i = 0; i < tpos.length; i++) {
    const { open, high, low, close } = tpos[i]

    if (high >= VA.high || low <= VA.low) {
      const klineLength = Math.abs(close - open)
      const klineUpperTail = Math.abs(close - high)
      const klineLowerTail = Math.abs(close - low)

      if (high >= VA.high && klineUpperTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE) {
        excess.push({ period: convertTpoPeriodToLetter(i), peakValue: high, troughValue: low })
      } else if (low <= VA.low && klineLowerTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE) {
        excess.push({ period: convertTpoPeriodToLetter(i), peakValue: high, troughValue: low })
      }
    }
  }
  return excess
}

/**
 * Identifies failed auctions within a set of candlesticks based on the initial balance.
 * A failed auction is a volume profile concept that occurs when the price breaks out of the initial balance range but then fails to sustain that breakout, indicating a potential reversal.
 *
 * This function should be used with a specific set of 30-minute candlesticks for one trading day,
 * starting from the 00:00 candle and ending with the 23:30 candle. The initial balance (IB) typically
 * represents the range of the first hour of trading and is used as a reference for the rest of the day.
 *
 * @param {ICandle[]} tpos - An array of 30-minute candlesticks for a single trading day.
 * @param {IInitialBalance} IB - The initial balance object, containing the high and low values of the first hour of trading.
 * @returns {IVolumeProfileObservation[]} An array of volume profile observations indicating failed auctions.
 *
 * @note The function is based on volume profile theory, which is a technique used in financial trading to analyse price movements
 *       and trading volumes over a certain period. It helps in identifying key trading ranges and potential turning points in the market.
 */
function isFailedAuction(tpos: ICandle[], IB: IInitialBalance): IVolumeProfileObservation[] {
  const failedAuctions: IVolumeProfileObservation[] = []
  let ibBroken = false
  for (let i = 0; i < tpos.length; i++) {
    const breakAbove = tpos[i].high > IB.high
    const breakBelow = tpos[i].low < IB.low
    if (!ibBroken && (breakAbove || breakBelow)) {
      ibBroken = true
      for (let j = i + 1; j < tpos.length; j++) {
        if ((breakAbove && tpos[j].close < IB.high) || (breakBelow && tpos[j].close > IB.low)) {
          failedAuctions.push({ period: convertTpoPeriodToLetter(j) })
        }
        return failedAuctions
      }
    }
  }
  return failedAuctions
}

/**
 * Finds poor highs and lows in the volume profile.
 *
 * Poor highs and lows are volume profile concepts that refer to price levels where the market has not effectively auctioned.
 * These are typically identified as price levels where the market reaches a high or low point but shows a lack of conviction,
 * often resulting in a narrow range of trading activity at these extremes. This can signal potential areas where the market
 * might revisit due to unfinished business.
 *
 * The function examines each candlestick in the array to determine if its high or low qualifies as a poor high or low based
 * on its relationship to the overall candle length and the value area.
 *
 * This function should be used with a specific set of 30-minute candlesticks for one trading day,
 * starting from the 00:00 candle and ending with the 23:30 candle.
 *
 * @param {ICandle[]} tpos - An array of candlesticks to analyse. These should ideally represent a complete trading period.
 * @param {IValueArea} VA - The value area object, providing the high and low values that define the main area of trading activity.
 * @returns {IVolumeProfileObservation[]} An array of volume profile observations indicating poor highs and lows.
 *
 * @note The significance of a poor high or low is evaluated by comparing the candle's upper or lower tail length to its overall body length.
 *       A disproportionately small tail at the high or low end, especially at or beyond the value area boundaries, is indicative of a poor high or low.
 */
function findPoorHighAndLows(tpos: ICandle[], VA: IValueArea): IVolumeProfileObservation[] {
  const poorHighLow: IVolumeProfileObservation[] = []

  for (let i = 0; i < tpos.length; i++) {
    const open: number = tpos[i].open
    const high: number = tpos[i].high
    const low: number = tpos[i].low
    const close: number = tpos[i].close
    const klineLength: number = Math.abs(close - open)
    const klineUpperTail: number = Math.abs(close - high)
    const klineLowerTail: number = Math.abs(close - low)

    if (high >= VA?.high && klineLength / klineUpperTail > POOR_HIGH_LOW_KLINE_LENGTH_SIGNIFICANCE) {
      poorHighLow.push({ period: convertTpoPeriodToLetter(i), peakValue: high, troughValue: low })
    }
    if (low <= VA?.low && klineLength / klineLowerTail > POOR_HIGH_LOW_KLINE_LENGTH_SIGNIFICANCE) {
      poorHighLow.push({ period: convertTpoPeriodToLetter(i), peakValue: high, troughValue: low })
    }
  }
  return poorHighLow
}

/**
 * Identifies single prints in the volume profile.
 *
 * Single prints in volume profile theory refer to areas on the profile where trading activity is significantly low,
 * often represented by a single line or a very narrow range. These are considered important because they might indicate
 * areas where the market moved too quickly, leaving potential opportunities for future trade entries or exits.
 *
 * The function assesses each candlestick in the array to determine if it represents a single print, based on its size relative
 * to the average candle size and whether new high or low price levels were created.
 *
 * This function should be used with a specific set of 30-minute candlesticks for one trading day,
 * starting from the 00:00 candle and ending with the 23:30 candle.
 *
 * @param {ICandle[]} tpos - An array of candlesticks to analyse. These should ideally represent a full trading period.
 * @returns {IVolumeProfileObservation[]} An array of volume profile observations indicating single prints.
 *
 * @note The function identifies single prints by looking for long candles that create new highs or lows without subsequent price retracement.
 *       This indicates a rapid price movement with minimal trading activity at these levels, characteristic of single prints.
 */
function findSinglePrints(tpos: ICandle[]): IVolumeProfileObservation[] {
  const singlePrints: IVolumeProfileObservation[] = []
  const numTpos: number = tpos.length

  // Find the length of the Kline
  const klineLengths = tpos.map((tpo) => Math.abs(tpo.close - tpo.open))
  const klineLengthsTotal = klineLengths.reduce((acc, tot) => acc + tot)
  const averageKlineLength = klineLengthsTotal / numTpos

  let highestHigh = Math.max(tpos[0].close, tpos[0].open)
  let lowestLow = Math.min(tpos[0].close, tpos[0].open)

  for (let i = 1; i < numTpos - 1; i++) {
    const open: number = tpos[i].open
    const close: number = tpos[i].close
    const previousClose: number = tpos[i - 1].close
    const high: number = tpos[i].high
    const low: number = tpos[i].low
    const klineLength = Math.abs(close - open)
    const isLongCandle = klineLength / averageKlineLength > SINGLE_PRINTS_KLINE_LENGTH_SIGNIFICANCE
    const direction: SIGNAL_DIRECTION = close > previousClose ? SIGNAL_DIRECTION.BULLISH : SIGNAL_DIRECTION.BEARISH

    const isNewHighMade: boolean = close > highestHigh
    const isNewLowMade: boolean = close < lowestLow

    if (isNewHighMade) highestHigh = close
    if (isNewLowMade) lowestLow = close

    if (isLongCandle && (isNewHighMade || isNewLowMade)) {
      let isPriceRetraced = false
      for (let k = i + 1; k < numTpos; k++) {
        if ((direction === SIGNAL_DIRECTION.BULLISH && tpos[k].low < low) || (direction === SIGNAL_DIRECTION.BEARISH && tpos[k].high > high)) {
          isPriceRetraced = true
          break
        }
      }
      if (!isPriceRetraced) {
        singlePrints.push({ period: convertTpoPeriodToLetter(i), peakValue: tpos[i].high, troughValue: tpos[i].low })
      }
    }
  }
  return singlePrints
}

/**
 * Finds naked points of control (NPOC) in a series of volume profiles.
 *
 * @param volumeProfiles An array of volume profile findings.
 * @returns An object containing support and resistance levels of naked points of control.
 */
export function findNakedPointOfControl(valueAreas: IValueArea[]): INakedPointOfControl {
  if (!valueAreas || valueAreas.length <= 1) return null

  const npoc: INakedPointOfControl = { support: null, resistance: null }
  let high: number = valueAreas[valueAreas.length - 1].high
  let low: number = valueAreas[valueAreas.length - 1].low

  for (let i = valueAreas.length - 2; i >= 0; i--) {
    const curr: IValueArea = valueAreas[i]

    // The NPOC to the upside or downside is valid if the POC is above any previous high or low, respectively
    if (npoc.resistance === null && curr?.POC > high) npoc.resistance = curr?.POC
    if (npoc.support === null && curr?.POC < low) npoc.support = curr?.POC

    // Set the new highs and lows
    if (curr?.high > high) high = curr.high
    if (curr?.low < low) low = curr.low

    // Return if both NPOC's are found -- no more checks are required
    if (npoc.resistance !== null && npoc.support !== null) return npoc
  }
  return npoc
}
