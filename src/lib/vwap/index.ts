import { ICandle } from '../../types/candle.types'
import { round } from '../../utils/math'

export function calculateVWAP(candles: ICandle[], pricePrecision: number): number {
  if (candles.length === 0) {
    return null
  }

  let cumulativeTypicalPriceVolume = 0
  let cumulativeVolume = 0

  for (const candle of candles) {
    const typicalPrice = (Number(candle.high) + Number(candle.low) + Number(candle.close)) / 3
    const volume = Number(candle.volume)

    cumulativeTypicalPriceVolume += typicalPrice * volume
    cumulativeVolume += volume
  }

  const vwap = cumulativeTypicalPriceVolume / cumulativeVolume
  return round(vwap, pricePrecision)
}
