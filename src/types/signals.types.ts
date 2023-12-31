import { SIGNALS, SIGNAL_DIRECTION } from '../constants/signals'
import { INTERVALS } from '../constants/candles'
import { TechnicalIndicators } from '../constants/indicators'
import { CANDLE_OBSERVATIONS } from '../constants/marketProfile'

/**
 * Represents a trading signal with its indicator, type, direction, and applicable intervals.
 */
export interface ISignal {
  indicator: TechnicalIndicators | CANDLE_OBSERVATIONS
  type: SIGNALS
  direction: SIGNAL_DIRECTION
  intervals: INTERVALS[]
}
