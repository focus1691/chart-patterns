import _ from 'lodash'
import moment from 'moment'
import { INTERVALS, TIME_PERIODS } from '../../constants/candles'
import { TechnicalIndicators } from '../../constants/indicators'
import { CANDLE_OBSERVATIONS, EXCESS_TAIL_LENGTH_SIGNIFICANCE, MARKET_PROFILE_OPEN, POOR_HIGH_LOW_KLINE_LENGTH_SIGNIFICANCE, SINGLE_PRINTS_KLINE_LENGTH_SIGNIFICANCE } from '../../constants/marketProfile'
import { SIGNAL_DIRECTION, SIGNALS } from '../../constants/signals'
import { ICandle } from '../../types/candle.types'
import { IInitialBalance, IMarketProfile, IMarketProfileFindings, IMarketProfileObservation } from '../../types/marketProfile.types'
import { ISignal } from '../../types/signals.types'
import { INakedPointOfControl, IValueArea } from '../../types/valueArea.types'
import { convertTpoPeriodToLetter } from '../../utils/marketProfile'
import { getTicksFromPrice } from '../../utils/math'
import { ValueArea } from '../valueArea'
import momentTimezone from 'moment-timezone'

export class MarketProfile {
  private valueArea: ValueArea = new ValueArea()
  constructor() {
    moment.updateLocale('en', {
      week: {
        dow: 1 // Monday is the first day of the week.
      }
    })
    momentTimezone.tz.setDefault('Europe/London')
  }

  getMarketProfile(period: TIME_PERIODS, data: ICandle[], tpoSize?: number, tickSize?: number): IMarketProfile {
    if (period === TIME_PERIODS.DAY && (!tpoSize || !tickSize)) throw new Error('No TPO Size / Tick Size to process the market profile calculations')

    const timestamp = moment(data[0].openTime)
    const from: moment.Moment = moment(timestamp).startOf(period)
    const marketProfile: IMarketProfile = { marketProfiles: null, npoc: null }
    const values: IMarketProfileFindings[] = []
    let tpos: ICandle[] = []
    do {
      const marketProfile: IMarketProfileFindings = { startOfPeriod: from.unix() }
      // Filter the Klines for this period alone
      tpos = data.filter((kline) => {
        const timestamp = moment(kline.openTime)
        return moment(timestamp).isSame(from, period)
      })
      if (!_.isEmpty(tpos)) {
        const valueArea: IValueArea = this.valueArea.getLevelsForPeriod(tpos)
        marketProfile.valueArea = valueArea
        const numTpos: number = tpoSize * tpos.length

        if (period === TIME_PERIODS.DAY) {
          marketProfile.IB = this.calcInitialBalance(tpos)
          if (values.length > 0 && marketProfile.IB.low && marketProfile.IB.high && numTpos > 2) {
            marketProfile.failedAuction = this.isFailedAuction(tpos, marketProfile.IB)
            marketProfile.excess = this.findExcess(tpos, marketProfile.valueArea)
            marketProfile.poorHighLow = this.findPoorHighAndLows(tpos, marketProfile.valueArea)
            marketProfile.singlePrints = this.findSinglePrints(tpos)
            // marketProfile.ledges = this.findLedges(tpos, marketProfile.valueArea)
            marketProfile.ledges = []
            marketProfile.openType = this.findOpenType(tpos, tpoSize, tickSize, marketProfile.IB, values[values.length - 1]?.valueArea)
            // marketProfile.dayType = this.findDayType(tpos, tickSize, marketProfile.IB)
          }
        }
        from.add(1, period) // Go to the previous day / week / month
        values.push(marketProfile)
      }
    } while (!_.isEmpty(tpos))

    if (values) {
      marketProfile.marketProfiles = values
      marketProfile.npoc = this.findNakedPointOfControl(values)
    }

    return marketProfile
  }

  calcInitialBalance(tpos: ICandle[]): IInitialBalance {
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

  check80Rule(tpo: ICandle, dOpen?: number, pdVAH?: number, pdVAL?: number): ISignal | null {
    if (!dOpen || !pdVAH || !pdVAL) {
      return null
    }

    let signal: ISignal | null = null
    const openedBelowValue: boolean = dOpen < pdVAL
    const openedAboveValue: boolean = dOpen > pdVAH

    // Check if the market has re-entered the previous day's value area
    if (openedAboveValue || openedBelowValue) {
      const reenteredBelowValue: boolean = openedAboveValue && tpo.low <= pdVAH
      const reenteredAboveValue: boolean = openedBelowValue && tpo.high >= pdVAL

      if (reenteredBelowValue || reenteredAboveValue) {
        signal = {
          indicator: TechnicalIndicators.MARKET_PROFILE_80_RULE,
          type: SIGNALS.TRIGGER_POINT,
          direction: reenteredBelowValue ? SIGNAL_DIRECTION.BEARISH : SIGNAL_DIRECTION.BULLISH,
          intervals: [INTERVALS.THIRTY_MINUTES]
        }
      }
    }

    return signal
  }

  findExcess = (tpos: ICandle[], VA?: IValueArea): IMarketProfileObservation[] => {
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
  
      if (high >= VA.high && klineUpperTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE) {
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
      if (low <= VA.low && klineLowerTail / klineLength > EXCESS_TAIL_LENGTH_SIGNIFICANCE) {
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

  isFailedAuction(tpos: ICandle[], IB: IInitialBalance): IMarketProfileObservation[] {
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

  findPoorHighAndLows(tpos: ICandle[], VA?: IValueArea): IMarketProfileObservation[] {
    const poorHighLow: IMarketProfileObservation[] = []

    for (let i = 0; i < tpos.length; i++) {
      const open: number = tpos[i].open
      const high: number = tpos[i].high
      const low: number = tpos[i].low
      const close: number = tpos[i].close
      const klineLength: number = Math.abs(close - open)
      const klineUpperTail: number = Math.abs(close - high)
      const klineLowerTail: number = Math.abs(close - low)

      if (high >= VA.high && klineLength / klineUpperTail > POOR_HIGH_LOW_KLINE_LENGTH_SIGNIFICANCE) {
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
      if (low <= VA.low && klineLength / klineLowerTail > POOR_HIGH_LOW_KLINE_LENGTH_SIGNIFICANCE) {
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

  findSinglePrints(tpos: ICandle[]): IMarketProfileObservation[] {
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

  findLedges(tpos: ICandle[], VA?: IValueArea, tolerancePercent: number = 0.01): IMarketProfileObservation[] {
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

  isInBalance(tpo: ICandle, VA?: IValueArea): boolean {
    return tpo.high <= VA.VAH && tpo.low >= VA.VAL
  }

  isLevelBreakoutUp(tpo: ICandle, VA?: IValueArea): boolean {
    return tpo.high > VA.VAH
  }

  isLevelBreakoutDown(tpo: ICandle, VA?: IValueArea): boolean {
    return tpo.low < VA.VAL
  }

  findOpenType(tpos: ICandle[], tpoSize: number, tickSize: number, IB: IInitialBalance, pdVA?: IValueArea): MARKET_PROFILE_OPEN {
    const { up: ticksAboveOpen, down: ticksBelowOpen } = getTicksFromPrice(tpos[0], 'open', tickSize)
    const tickMovement: number = Math.abs(ticksAboveOpen - ticksBelowOpen)
    let openAuction: boolean = true
    let retestedLevel: boolean = false

    if ((ticksAboveOpen <= 1 || ticksBelowOpen <= 1) && tickMovement > 50) {
      const openedAboveBalance = tpos[0].open > pdVA.VAH
      const openedBelowBalance = tpos[0].open < pdVA.VAL
      const firstTpoLevelBreakup: boolean = ticksAboveOpen > 1 && this.isLevelBreakoutUp(tpos[0], pdVA)
      const firstTpoLevelBreakdown: boolean = ticksBelowOpen > 1 && this.isLevelBreakoutDown(tpos[0], pdVA)
      const startingTpos: number = 4 / tpoSize

      if (openedAboveBalance || openedBelowBalance) {
        for (let i = 1; i < startingTpos; i++) {
          if ((openedAboveBalance && !this.isLevelBreakoutUp(tpos[i], pdVA)) || (openedBelowBalance && !this.isLevelBreakoutDown(tpos[i], pdVA))) {
            retestedLevel = true
          }
        }
        for (let i = startingTpos; i < tpos.length / 2; i++) {
          const breakBackAbove: boolean = this.isLevelBreakoutUp(tpos[i], pdVA)
          const breakBackBelow: boolean = this.isLevelBreakoutDown(tpos[i], pdVA)
          if ((openedAboveBalance && retestedLevel && breakBackAbove) || (openedBelowBalance && retestedLevel && breakBackBelow)) {
            return MARKET_PROFILE_OPEN.OPEN_TEST_DRIVE
          }
        }
      }

      if (firstTpoLevelBreakup || firstTpoLevelBreakdown) {
        for (let i = 1; i < startingTpos; i++) {
          if ((firstTpoLevelBreakup && !this.isLevelBreakoutUp(tpos[i], pdVA)) || (firstTpoLevelBreakdown && !this.isLevelBreakoutDown(tpos[i], pdVA))) {
            return MARKET_PROFILE_OPEN.OPEN_REJECTION_REVERSE
          }
        }
      }
      return MARKET_PROFILE_OPEN.OPEN_DRIVE
    }

    for (let i = 0; i < tpos.length; i++) {
      if (openAuction && !this.isInBalance(tpos[i], pdVA)) {
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

  getPrice(data: ICandle[], timePeriod: TIME_PERIODS, key: string | number, goBackByOne?: boolean): number {
    const period: moment.Moment = moment().startOf(timePeriod)
    goBackByOne && period.subtract(1, timePeriod)
    let price: number

    // Start checking the most recent Klines first
    for (let i = data.length - 1; i >= 0; i--) {
      const openTime: moment.Moment = moment(data[i].openTime)
      if (openTime.isSame(period, timePeriod)) {
        price = data[i][key]
      }
      if (openTime.isBefore(period)) break // The latest Kline date is before yesterday so it can't be there
    }
    return price
  }

  findNakedPointOfControl(marketProfiles: IMarketProfileFindings[]): INakedPointOfControl {
    if (_.isEmpty(marketProfiles) || marketProfiles.length <= 1) return null

    const npoc: INakedPointOfControl = { support: null, resistance: null }
    let high: number = marketProfiles[marketProfiles.length - 1]?.valueArea?.high
    let low: number = marketProfiles[marketProfiles.length - 1]?.valueArea?.low

    for (let i = marketProfiles.length - 2; i >= 0; i--) {
      const curr: IMarketProfileFindings = marketProfiles[i]

      // The NPOC to the upside or downside is valid if the POC is above any previous high or low, respectively
      if (npoc.resistance === null && curr.valueArea?.POC > high) npoc.resistance = curr.valueArea?.POC
      if (npoc.support === null && curr.valueArea?.POC < low) npoc.support = curr.valueArea?.POC

      // Set the new highs and lows
      if (curr.valueArea?.high > high) high = curr.valueArea.high
      if (curr.valueArea?.low < low) low = curr.valueArea.low

      // Return if both NPOC's are found -- no more checks are required
      if (npoc.resistance !== null && npoc.support !== null) return npoc
    }
    return npoc
  }
}
