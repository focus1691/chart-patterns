import { ICandle } from '../../types/candle.types'
import { round } from '../../utils/math'

const standardPrecision = 4

export function calculateVWAP(candles: ICandle[]): number {
  if (candles.length === 0) {
    return null
  }

  let cumulativeTotalPriceVolume = 0
  let cumulativeVolume = 0

  for (let i = 0; i < candles.length; i++) {
    const typicalPrice = (Number(candles[i].high) + Number(candles[i].low) + Number(candles[i].close)) / 3
    const volume = Number(candles[i].volume)
    cumulativeTotalPriceVolume += typicalPrice * volume
    cumulativeVolume += volume
  }

  const latestVWAP = cumulativeTotalPriceVolume / cumulativeVolume
  return round(latestVWAP, standardPrecision)
}
