import { ISignal } from './signals.types'
import { PRICE_POSITION } from '../constants'

export enum MA_Periods {
  THREE = 3,
  FIVE = 5,
  SEVEN = 7,
  NINE = 9,
  TWENTY_ONE = 21,
  THIRTY = 30,
  FIFTY = 50,
  ONE_HUNDRED = 100,
  TWO_HUNDRED = 200
}

export interface IPriceMA {
  position: PRICE_POSITION
  period: MA_Periods
  value: number
  interval: string
}

export interface IEmaOutcome {
  [period: string]: number
}

export interface EmaCrossingResult extends ISignal {
  time: Date
  shortPeriod: MA_Periods
  longPeriod: MA_Periods
}

export type EmaCrossingMultiResult = { [key: string]: EmaCrossingResult }
