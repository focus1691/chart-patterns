import { INTERVALS, SIGNAL_DIRECTION, SIGNALS, TechnicalIndicators } from '../../constants'
import { ICandle } from '../../types/candle.types'
import { EmaCrossingResult, IEmaOutcome, MA_Periods } from '../../types/movingAverage.types'
import { countDecimals, round } from '../../utils/math'

const PERIODS: MA_Periods[] = [MA_Periods.NINE, MA_Periods.TWENTY_ONE, MA_Periods.FIFTY, MA_Periods.ONE_HUNDRED, MA_Periods.TWO_HUNDRED]

export const calculateSMA = (data: number[]) => {
  const sma: number = data.reduce((acc, curr) => acc + curr, 0) / data.length
  return sma
}

export function calculateEMA(data: number[], period: MA_Periods): number[] {
  const numDecimals: number = data.reduce((highestNumDecimals, ema) => {
    const numDecimals: number = countDecimals(Number(ema))
    return numDecimals > highestNumDecimals ? numDecimals : highestNumDecimals
  }, 0)
  const emas: number[] = [Number(data.shift())]
  const smoothingFactor: number = 2 / (period + 1)

  for (let i = 0; i < data.length; i++) {
    const prevEma: number = emas[emas.length - 1]
    const value: number = Number(data[i])
    const ema: number = smoothingFactor * (value - prevEma) + prevEma
    const roundedEma: number = round(ema, numDecimals)
    emas.push(roundedEma)
  }

  return emas
}

export function calculateEmas(data: number[], periods: number[] = PERIODS): IEmaOutcome {
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

  // Extract the closing prices from the candlestick data
  const closePrices = data.map((row) => row.close)

  // Calculate the EMA values for the chosen short and long periods
  const shortEmaValues = calculateEMA([...closePrices], shortPeriod)
  const longEmaValues = calculateEMA([...closePrices], longPeriod)

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
      break // Exit the loop as we've found the most recent crossing
    }

    if (currentShortEma < currentLongEma && prevShortEma >= prevLongEma) {
      mostRecentCrossingSignal = SIGNAL_DIRECTION.BEARISH
      mostRecentCrossingTime = data[i].closeTime
      break // Exit the loop as we've found the most recent crossing
    }
  }

  // If a crossing was found, return the details
  if (mostRecentCrossingTime && mostRecentCrossingSignal) {
    return {
      indicator: TechnicalIndicators.EMA_CROSSING,
      type: SIGNALS.TRIGGER_POINT,
      direction: mostRecentCrossingSignal,
      time: mostRecentCrossingTime,
      shortPeriod,
      longPeriod,
      intervals: [interval as INTERVALS]
    }
  }

  return null // No crossing was found
}
