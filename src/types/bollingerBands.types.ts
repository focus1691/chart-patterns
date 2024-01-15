import { ISignal } from './signals.types'

export interface IBollingerBands {
  upperBand: number
  middleBand: number
  lowerBand: number
}

export interface IBollingerBandSignal extends ISignal {
  upperBand: number
  lowerBand: number
}
