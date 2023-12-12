import { INTERVALS } from "../../constants/candles"
import { EXCESS_TAIL_LENGTH_SIGNIFICANCE, CANDLE_OBSERVATIONS } from "../../constants/marketProfile"
import { SIGNALS, SIGNAL_DIRECTION } from "../../constants/signals"
import { ICandle } from "../../types/candle.types"
import { IMarketProfileObservation } from "../../types/marketProfile.types"
import { IValueArea } from "../../types/valueArea.types"
import { convertTpoPeriodToLetter } from "../../utils/marketProfile"

export const findExcess = (tpos: ICandle[], VA?: IValueArea): IMarketProfileObservation[] => {
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