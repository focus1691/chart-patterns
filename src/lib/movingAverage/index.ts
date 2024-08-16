import { INTERVALS, SIGNAL_DIRECTION } from '../../constants'
import { ICandle } from '../../types/candle.types'
import { EmaCrossingResult, IEmaOutcome, MA_Periods } from '../../types/movingAverage.types'
import { round } from '../../utils/math'

const PERIODS: MA_Periods[] = [MA_Periods.NINE, MA_Periods.TWENTY_ONE, MA_Periods.FIFTY, MA_Periods.ONE_HUNDRED, MA_Periods.TWO_HUNDRED]

export const calculateSMA = (data: number[]) => {
  const sma: number = data.reduce((acc, curr) => acc + curr, 0) / data.length
  return sma
}

export function calculateEMA(candles: ICandle[], period: MA_Periods): number[] {
  if (candles.length === 0) {
    return []
  }

  const standardPrecision = 4
  const smoothingFactor = 2 / (period + 1)
  const emas = new Array(candles.length).fill(0)
  emas[0] = Number(candles[0].close)

  for (let i = 1; i < candles.length; i++) {
    const prevEma = emas[i - 1]
    const value = Number(candles[i].close)
    emas[i] = (value - prevEma) * smoothingFactor + prevEma
  }

  return emas.map((ema) => round(ema, standardPrecision))
}

export function calculateEmas(data: ICandle[], periods: number[] = PERIODS): IEmaOutcome {
  const emaOutcome: IEmaOutcome = {} as IEmaOutcome

  for (let i = 0; i < periods.length; i++) {
    emaOutcome[periods[i]] = calculateEMA(data, periods[i])?.pop()
  }

  return emaOutcome
}

export function detectCrossing(interval: string, data: ICandle[], shortPeriod: MA_Periods, longPeriod: MA_Periods): EmaCrossingResult | null {
  // Ensure we have enough data to proceed
  if (data.length < longPeriod + 1) {
    return null
  }

  const shortEmaValues = calculateEMA(data, shortPeriod)
  const longEmaValues = calculateEMA(data, longPeriod)

  // Define variables to hold the time and type of the most recent crossing
  let mostRecentCrossingTime: Date | null = null
  let mostRecentCrossingSignal: SIGNAL_DIRECTION | null = null

  // Start from the most recent data and move backward to find the most recent crossing
  for (let i = shortEmaValues.length - 1; i >= longPeriod; i--) {
    const currentShortEma = shortEmaValues[i]
    const currentLongEma = longEmaValues[i]
    const prevShortEma = shortEmaValues[i - 1]
    const prevLongEma = longEmaValues[i - 1]

    if (currentShortEma > currentLongEma && prevShortEma <= prevLongEma) {
      mostRecentCrossingSignal = SIGNAL_DIRECTION.BULLISH
      mostRecentCrossingTime = new Date(data[i].closeTime)
      break
    }

    if (currentShortEma < currentLongEma && prevShortEma >= prevLongEma) {
      mostRecentCrossingSignal = SIGNAL_DIRECTION.BEARISH
      mostRecentCrossingTime = data[i].closeTime
      break
    }
  }

  if (mostRecentCrossingTime && mostRecentCrossingSignal) {
    return {
      time: mostRecentCrossingTime,
      shortPeriod,
      longPeriod,
      direction: mostRecentCrossingSignal,
      interval: interval as INTERVALS
    }
  }

  return null
}
