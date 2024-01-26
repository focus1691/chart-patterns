import _ from 'lodash'
import moment from 'moment'
import { INTERVALS, TIME_PERIODS } from '../../constants/candles'
import { TechnicalIndicators } from '../../constants/indicators'
import {
  CANDLE_OBSERVATIONS,
  EXCESS_TAIL_LENGTH_SIGNIFICANCE,
  MARKET_PROFILE_OPEN,
  POOR_HIGH_LOW_KLINE_LENGTH_SIGNIFICANCE,
  SINGLE_PRINTS_KLINE_LENGTH_SIGNIFICANCE
} from '../../constants/marketProfile'
import { SIGNAL_DIRECTION, SIGNALS } from '../../constants/signals'
import { ICandle } from '../../types/candle.types'
import { IInitialBalance, IMarketProfile, IMarketProfileConfig, IMarketProfileFindings, IMarketProfileObservation } from '../../types/marketProfile.types'
import { ISignal } from '../../types/signals.types'
import { INakedPointOfControl, IValueArea } from '../../types/valueArea.types'
import { convertTpoPeriodToLetter } from '../../utils/marketProfile'
import { getTicksFromPrice } from '../../utils/math'
import * as ValueArea from '../valueArea'
import momentTimezone from 'moment-timezone'

/**
 * Size of the Time Price Opportunity (TPO) unit.
 */
const TPO_SIZE: number = 1

// Configuration for moment and moment-timezone
moment.updateLocale('en', {
  week: {
    dow: 1 // Monday is the first day of the week.
  }
})
momentTimezone.tz.setDefault('Europe/London')

/**
 * Validates the input configuration for market profile calculations.
 *
 * @param config The market profile configuration object.
 * @throws Error if the configuration is invalid.
 */
function validateInput(config: IMarketProfileConfig): void {
  if (!config.tickSize || typeof config.tickSize !== 'number') throw new Error("You must include the symbol's Tick Size. i.e. 0.5 for BTCUSDT.")
  if (!config?.candles?.length) throw new Error('You need to include the candles array (ICandle format).')
  if (config.candles.length < 24) throw new Error("Not enough candles to compute the Market Profile for a day. You need a minimum of 48 TPO's of 30m candles.")
  for (let i = 0; i < config.candles.length; i++) {
    if (config.candles[i].interval !== INTERVALS.THIRTY_MINUTES)
      throw new Error('Candle contains an interval other than 30m. Market Profile Theory requires 30m candles. 1 TPO = one 30 min candle,')
  }
}

/**
 * Calculates the market profile for a given set of candlestick data based on the specified configuration.
 *
 * The function analyses the candlestick data to construct a series of market profiles, each corresponding to a day.
 * It calculates key market profile elements such as value area, initial balance, and various types of market observations
 * (e.g., failed auctions, excess points, poor highs and lows, etc.).
 *
 * @param {IMarketProfileConfig} config - The configuration object containing the candlestick data and parameters needed for market profile calculation, such as tick size.
 * @returns {IMarketProfile} An object containing the calculated market profiles and any naked points of control (untested price levels with significant past activity).
 *
 * Each market profile includes:
 *   - Value Area: The range of prices where a significant portion of trading activity occurred.
 *   - Initial Balance: The price range established during the first hour of trading.
 *   - Various observations: Insights into market behavior such as failed auctions, excess, poor highs and lows, single prints, and ledges.
 *
 * @example
 * // Assuming 'candles' is an array of ICandle objects representing the price data
 * // Create a market profile with a specified tick size
 * const marketProfile: IMarketProfile = MarketProfile.create({ candles, tickSize: 0.5 });
 *
 * // 'marketProfile' contains the market profile data including value areas and market observations
 * console.log(marketProfile); // Outputs the market profile data
 */
export function create(config: IMarketProfileConfig): IMarketProfile {
  validateInput(config)

  const period: TIME_PERIODS = config.period ?? TIME_PERIODS.DAY
  const timestamp = moment(config.candles[0].openTime)
  const from: moment.Moment = moment(timestamp).startOf(period)
  const marketProfile: IMarketProfile = { marketProfiles: null, npoc: null }
  const values: IMarketProfileFindings[] = []
  let tpos: ICandle[] = []
  do {
    const marketProfile: IMarketProfileFindings = { startOfDay: from.unix() }
    // Filter the Klines for this period alone
    tpos = config.candles.filter((candle) => {
      const timestamp = moment(candle.openTime)
      return moment(timestamp).isSame(from, period)
    })
    if (!_.isEmpty(tpos)) {
      marketProfile.valueArea = ValueArea.calculate(tpos)

      if (period === TIME_PERIODS.DAY) {
        marketProfile.IB = calcInitialBalance(tpos)
        const numTpos: number = TPO_SIZE * tpos.length

        if (values.length > 0 && marketProfile.IB.low && marketProfile.IB.high && numTpos > 2) {
          marketProfile.failedAuction = isFailedAuction(tpos, marketProfile.IB)
          marketProfile.excess = findExcess(tpos, marketProfile.valueArea)
          marketProfile.poorHighLow = findPoorHighAndLows(tpos, marketProfile.valueArea)
          marketProfile.singlePrints = findSinglePrints(tpos)
          // marketProfile.ledges = findLedges(tpos, marketProfile.valueArea)
          marketProfile.ledges = []
          marketProfile.openType = findOpenType(tpos, TPO_SIZE, config.tickSize, marketProfile.IB, values[values.length - 1]?.valueArea)
          // marketProfile.dayType = findDayType(tpos, tickSize, marketProfile.IB)
        }
      }

      from.add(1, period) // Go to the previous day / week / month
      values.push(marketProfile)
    }
  } while (!_.isEmpty(tpos))

  if (values) {
    const valueAreas: IValueArea[] = values.map((finding: IMarketProfileFindings) => finding.valueArea)
    marketProfile.marketProfiles = values
    marketProfile.npoc = findNakedPointOfControl(valueAreas)
  }

  return marketProfile
}

/**
 * Calculates the initial balance (IB) of the market profile.
 *
 * @param tpos An array of candlesticks to analyse.
 * @returns An object representing the initial balance with high and low values.
 */
export function calcInitialBalance(tpos: ICandle[]): IInitialBalance {
  const firstTPOPeriods = tpos.filter((kline) => {
    const timestamp = moment(kline.openTime)
    const hour: number = moment(timestamp).hour()
    // The first 2 TPO's are the first 30 minutes
    // The 2 candle times are between 00:00 and 01:00
    return hour === 0
  })
  const low: number = _.isEmpty(firstTPOPeriods) ? null : Math.min(...firstTPOPeriods.map((kline) => kline.low))
  const high: number = _.isEmpty(firstTPOPeriods) ? null : Math.max(...firstTPOPeriods.map((kline) => kline.high))
  const IB: IInitialBalance = { high, low }
  return IB
}

/**
 * Evaluates the market's opening price against the previous day's Value Area High and Low.
 * Generates a signal based on the 80% rotation rule for market profile, specifically when
 * the opening price is outside the previous day's value area.
 *
 * @param dOpen The day's opening price.
 * @param pdVAH Previous day's Value Area High.
 * @param pdVAL Previous day's Value Area Low.
 * @returns A signal object if the opening price is outside the previous day's value area, 
 *          indicating a potential 80% rotation, otherwise null.
 */
export function evaluateOpeningPriceAgainstPrevDayValueArea(dOpen?: number, pdVAH?: number, pdVAL?: number): ISignal | null {
  if (!dOpen || !pdVAH || !pdVAL) {
    return null
  }

  const openedBelowValue: boolean = dOpen < pdVAL
  const openedAboveValue: boolean = dOpen > pdVAH

  // Check if the market has re-entered the previous day's value area
  if (openedAboveValue || openedBelowValue) {
    const signal: ISignal | null = {
      indicator: TechnicalIndicators.OPEN_OUTSIDE_VALUE,
      type: SIGNALS.TRIGGER_POINT,
      direction: openedAboveValue ? SIGNAL_DIRECTION.BEARISH : SIGNAL_DIRECTION.BULLISH,
      intervals: [INTERVALS.THIRTY_MINUTES]
    }
    return signal
  }

  return null
}

/**
 * Finds excess points in the market profile.
 *
 * Excess points in market profile theory are areas where the price has made a significant move away from the value area,
 * typically indicating strong rejection or acceptance of certain price levels. They often appear at the extremes of the
 * market profile and can signal potential market reversals or continuations.
 *
 * This function examines each candlestick in the provided array to identify such points of excess, based on the relation
 * between the candle's high/low and the value area's high/low.
 *
 * This function should be used with a specific set of 30-minute candlesticks for one trading day,
 * starting from the 00:00 candle and ending with the 23:30 candle.
 *
 * @param {ICandle[]} tpos - An array of candlesticks to analyse for excess points. These should ideally cover a full trading period.
 * @param {IValueArea} VA - The value area object, containing the high and low values that define the main area of trading activity.
 * @returns {IMarketProfileObservation[]} An array of market profile observations indicating excess points.
 *
 * @note The significance of an excess point is determined by comparing the length of the candle's tail (upper or lower) to its overall length.
 *       A long tail relative to the candle's body, extending beyond the value area, indicates a significant excess point.
 */
export function findExcess(tpos: ICandle[], VA: IValueArea): IMarketProfileObservation[] {
  if (!VA) return []

  const excess: IMarketProfileObservation[] = []

  for (let i = 0; i < tpos.length; i++) {
    const interval: INTERVALS = tpos[i].interval as INTERVALS
    const open: number = tpos[i].open
    const high: number = tpos[i].high
    const low: number = tpos[i].low
    const close: number = tpos[i].close
    const klineLength: number = Math.abs(close - open)
    const klineUpperTail: number = Math.abs(close - high)
    const klineLowerTail: number = Math.abs(close - low)

    if (high >= VA?.high && klineUpperTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE) {
      excess.push({
        indicator: CANDLE_OBSERVATIONS.EXCESS,
        intervals: [interval],
        type: SIGNALS.CANDLE_ANOMALY,
        period: convertTpoPeriodToLetter(i),
        direction: SIGNAL_DIRECTION.BULLISH,
        peakValue: high,
        troughValue: low
      })
    }
    if (low <= VA?.low && klineLowerTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE) {
      excess.push({
        indicator: CANDLE_OBSERVATIONS.EXCESS,
        intervals: [interval],
        type: SIGNALS.CANDLE_ANOMALY,
        period: convertTpoPeriodToLetter(i),
        direction: SIGNAL_DIRECTION.BEARISH,
        peakValue: high,
        troughValue: low
      })
    }
  }
  return excess
}

/**
 * Identifies failed auctions within a set of candlesticks based on the initial balance.
 * A failed auction is a market profile concept that occurs when the price breaks out of the initial balance range but then fails to sustain that breakout, indicating a potential reversal.
 *
 * This function should be used with a specific set of 30-minute candlesticks for one trading day,
 * starting from the 00:00 candle and ending with the 23:30 candle. The initial balance (IB) typically
 * represents the range of the first hour of trading and is used as a reference for the rest of the day.
 *
 * @param {ICandle[]} tpos - An array of 30-minute candlesticks for a single trading day.
 * @param {IInitialBalance} IB - The initial balance object, containing the high and low values of the first hour of trading.
 * @returns {IMarketProfileObservation[]} An array of market profile observations indicating failed auctions.
 *
 * @note The function is based on market profile theory, which is a technique used in financial trading to analyse price movements
 *       and trading volumes over a certain period. It helps in identifying key trading ranges and potential turning points in the market.
 */
export function isFailedAuction(tpos: ICandle[], IB: IInitialBalance): IMarketProfileObservation[] {
  if (!IB) return []

  const failedAuctions: IMarketProfileObservation[] = []
  let ibBroken = false
  for (let i = 0; i < tpos.length; i++) {
    const breakAbove = tpos[i].high > IB.high
    const breakBelow = tpos[i].low < IB.low
    if (!ibBroken && (breakAbove || breakBelow)) {
      ibBroken = true
      for (let j = i + 1; j < tpos.length; j++) {
        if ((breakAbove && tpos[j].close < IB.high) || (breakBelow && tpos[j].close > IB.low)) {
          failedAuctions.push({
            indicator: CANDLE_OBSERVATIONS.FAILED_AUCTION,
            intervals: [INTERVALS.THIRTY_MINUTES],
            type: SIGNALS.CANDLE_ANOMALY,
            period: convertTpoPeriodToLetter(j),
            direction: breakAbove ? SIGNAL_DIRECTION.BULLISH : SIGNAL_DIRECTION.BULLISH
          })
        }
        return failedAuctions
      }
    }
  }
  return failedAuctions
}

/**
 * Finds poor highs and lows in the market profile.
 *
 * Poor highs and lows are market profile concepts that refer to price levels where the market has not effectively auctioned.
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
 * @returns {IMarketProfileObservation[]} An array of market profile observations indicating poor highs and lows.
 *
 * @note The significance of a poor high or low is evaluated by comparing the candle's upper or lower tail length to its overall body length.
 *       A disproportionately small tail at the high or low end, especially at or beyond the value area boundaries, is indicative of a poor high or low.
 */
export function findPoorHighAndLows(tpos: ICandle[], VA: IValueArea): IMarketProfileObservation[] {
  if (!VA) return []

  const poorHighLow: IMarketProfileObservation[] = []

  for (let i = 0; i < tpos.length; i++) {
    const open: number = tpos[i].open
    const high: number = tpos[i].high
    const low: number = tpos[i].low
    const close: number = tpos[i].close
    const klineLength: number = Math.abs(close - open)
    const klineUpperTail: number = Math.abs(close - high)
    const klineLowerTail: number = Math.abs(close - low)

    if (high >= VA?.high && klineLength / klineUpperTail > POOR_HIGH_LOW_KLINE_LENGTH_SIGNIFICANCE) {
      poorHighLow.push({
        indicator: CANDLE_OBSERVATIONS.POOR_HIGH_LOW,
        intervals: [INTERVALS.THIRTY_MINUTES],
        type: SIGNALS.CANDLE_ANOMALY,
        period: convertTpoPeriodToLetter(i),
        direction: SIGNAL_DIRECTION.BULLISH,
        peakValue: high,
        troughValue: low
      })
    }
    if (low <= VA?.low && klineLength / klineLowerTail > POOR_HIGH_LOW_KLINE_LENGTH_SIGNIFICANCE) {
      poorHighLow.push({
        indicator: CANDLE_OBSERVATIONS.POOR_HIGH_LOW,
        intervals: [INTERVALS.THIRTY_MINUTES],
        type: SIGNALS.CANDLE_ANOMALY,
        period: convertTpoPeriodToLetter(i),
        direction: SIGNAL_DIRECTION.BEARISH,
        peakValue: high,
        troughValue: low
      })
    }
  }
  return poorHighLow
}

/**
 * Identifies single prints in the market profile.
 *
 * Single prints in market profile theory refer to areas on the profile where trading activity is significantly low,
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
 * @returns {IMarketProfileObservation[]} An array of market profile observations indicating single prints.
 *
 * @note The function identifies single prints by looking for long candles that create new highs or lows without subsequent price retracement.
 *       This indicates a rapid price movement with minimal trading activity at these levels, characteristic of single prints.
 */
export function findSinglePrints(tpos: ICandle[]): IMarketProfileObservation[] {
  const singlePrints: IMarketProfileObservation[] = []
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
        singlePrints.push({
          indicator: CANDLE_OBSERVATIONS.SINGLE_PRINT,
          intervals: [INTERVALS.THIRTY_MINUTES],
          type: SIGNALS.CANDLE_ANOMALY,
          period: convertTpoPeriodToLetter(i),
          direction,
          peakValue: tpos[i].high,
          troughValue: tpos[i].low
        })
      }
    }
  }
  return singlePrints
}

/**
 * Identifies ledges in the market profile based on a tolerance percentage.
 *
 * @param tpos An array of candlesticks.
 * @param VA The value area object.
 * @param tolerancePercent A percentage used to define the tolerance for identifying ledges.
 * @returns An array of market profile observations indicating ledges.
 */
export function findLedges(tpos: ICandle[], VA: IValueArea, tolerancePercent: number = 0.01): IMarketProfileObservation[] {
  if (!VA) return []

  const ledges: IMarketProfileObservation[] = []
  const groupedLedges: number[][] = []

  // Find the range of TPO prices
  const prices = tpos.map((tpo) => tpo.close)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice

  // Calculate the tolerance range
  const tolerance = Math.round(tolerancePercent * priceRange)

  for (let i = 0; i < tpos.length; i++) {
    let groupFound = false

    // check if there is a group of TPOs within the tolerance range
    if (groupedLedges.length > 0) {
      const last: number = groupedLedges.length - 1
      const size: number = groupedLedges[last]?.length
      const close: number = tpos[i].close
      const total: number = groupedLedges[last].map((v) => tpos[v].close).reduce((accumulator, currentValue) => accumulator + currentValue, 0)
      const avg: number = total / size

      if (total > 0 && Math.abs(Number(avg) - close) <= tolerance) {
        groupedLedges[last].push(i)
        groupFound = true
        i++
      }
    }

    // if no group was found, create a new group
    if (!groupFound) {
      groupedLedges.push([i])
    }
  }

  // check if each group of TPOs meets the criteria for a ledge
  for (let i = 0; i < groupedLedges.length; i++) {
    if (groupedLedges[i].length >= 2) {
      const closes = groupedLedges[i].map((value) => tpos[value].close)
      const low = Math.min(...closes)
      const high = Math.max(...closes)
      const close = closes.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / closes?.length ?? 0

      const isLedge = low >= VA?.VAL && high <= VA?.VAH
      const direction: SIGNAL_DIRECTION = close < VA?.POC ? SIGNAL_DIRECTION.BEARISH : SIGNAL_DIRECTION.BULLISH
      if (isLedge) {
        ledges.push({
          indicator: CANDLE_OBSERVATIONS.LEDGE,
          intervals: [INTERVALS.THIRTY_MINUTES],
          type: SIGNALS.CANDLE_ANOMALY,
          period: convertTpoPeriodToLetter(groupedLedges[i][0]),
          direction
        })
      }
    }
  }

  return ledges
}

/**
 * Checks if a candlestick is within the value area boundaries.
 *
 * @param tpo A single candlestick.
 * @param VA The value area object.
 * @returns True if the candlestick is within the value area, false otherwise.
 */
export function isInBalance(tpo: ICandle, VA: IValueArea): boolean {
  return !VA ? false : tpo.high <= VA?.VAH && tpo.low >= VA?.VAL
}

/**
 * Determines if there is a level breakout upwards from the value area high.
 *
 * @param tpo A single candlestick.
 * @param VA The value area object.
 * @returns True if there is a breakout above the value area high, false otherwise.
 */
export function isLevelBreakoutUp(tpo: ICandle, VA: IValueArea): boolean {
  return !VA ? false : tpo.high > VA?.VAH
}

/**
 * Determines if there is a level breakout downwards from the value area low.
 *
 * @param tpo A single candlestick.
 * @param VA The value area object.
 * @returns True if there is a breakout below the value area low, false otherwise.
 */
export function isLevelBreakoutDown(tpo: ICandle, VA: IValueArea): boolean {
  return !VA ? false : tpo.low < VA?.VAL
}

/**
 * analyses the opening type of the market based on the initial balance and previous day's value area.
 *
 * @param tpos An array of candlesticks.
 * @param tpoSize The size of the Time Price Opportunity unit.
 * @param tickSize The size of a single tick.
 * @param IB The initial balance object.
 * @param pdVA The previous day's value area.
 * @returns The type of market opening identified.
 */
export function findOpenType(tpos: ICandle[], tpoSize: number, tickSize: number, IB: IInitialBalance, pdVA?: IValueArea): MARKET_PROFILE_OPEN {
  const { up: ticksAboveOpen, down: ticksBelowOpen } = getTicksFromPrice(tpos[0], 'open', tickSize)
  const tickMovement: number = Math.abs(ticksAboveOpen - ticksBelowOpen)
  let openAuction: boolean = true
  let retestedLevel: boolean = false

  if ((ticksAboveOpen <= 1 || ticksBelowOpen <= 1) && tickMovement > 50) {
    const openedAboveBalance = tpos[0].open > pdVA.VAH
    const openedBelowBalance = tpos[0].open < pdVA.VAL
    const firstTpoLevelBreakup: boolean = ticksAboveOpen > 1 && isLevelBreakoutUp(tpos[0], pdVA)
    const firstTpoLevelBreakdown: boolean = ticksBelowOpen > 1 && isLevelBreakoutDown(tpos[0], pdVA)
    const startingTpos: number = 4 / tpoSize

    if (openedAboveBalance || openedBelowBalance) {
      for (let i = 1; i < startingTpos; i++) {
        if ((openedAboveBalance && !isLevelBreakoutUp(tpos[i], pdVA)) || (openedBelowBalance && !isLevelBreakoutDown(tpos[i], pdVA))) {
          retestedLevel = true
        }
      }
      for (let i = startingTpos; i < tpos.length / 2; i++) {
        const breakBackAbove: boolean = isLevelBreakoutUp(tpos[i], pdVA)
        const breakBackBelow: boolean = isLevelBreakoutDown(tpos[i], pdVA)
        if ((openedAboveBalance && retestedLevel && breakBackAbove) || (openedBelowBalance && retestedLevel && breakBackBelow)) {
          return MARKET_PROFILE_OPEN.OPEN_TEST_DRIVE
        }
      }
    }

    if (firstTpoLevelBreakup || firstTpoLevelBreakdown) {
      for (let i = 1; i < startingTpos; i++) {
        if ((firstTpoLevelBreakup && !isLevelBreakoutUp(tpos[i], pdVA)) || (firstTpoLevelBreakdown && !isLevelBreakoutDown(tpos[i], pdVA))) {
          return MARKET_PROFILE_OPEN.OPEN_REJECTION_REVERSE
        }
      }
    }
    return MARKET_PROFILE_OPEN.OPEN_DRIVE
  }

  for (let i = 0; i < tpos.length; i++) {
    if (openAuction && !isInBalance(tpos[i], pdVA)) {
      openAuction = false
    }
  }

  if (openAuction === true) {
    return MARKET_PROFILE_OPEN.OPEN_AUCTION
  }

  return null
}

// findDayType(tpos: ICandle[], tickSize: number, IB: IInitialBalance): MARKET_PROFILE_DAYS {
//   let dayType: MARKET_PROFILE_DAYS
//   return dayType
// }

/**
 * Finds naked points of control (NPOC) in a series of market profiles.
 *
 * @param marketProfiles An array of market profile findings.
 * @returns An object containing support and resistance levels of naked points of control.
 */
export function findNakedPointOfControl(valueAreas: IValueArea[]): INakedPointOfControl {
  if (_.isEmpty(valueAreas) || valueAreas.length <= 1) return null

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
