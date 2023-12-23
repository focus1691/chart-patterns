import { ICandle } from './candle.types'

export interface IEngulfingCandleConfig {
  candles: ICandle[]
  index?: number
}
