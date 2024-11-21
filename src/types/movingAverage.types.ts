import { INTERVALS, SIGNAL_DIRECTION } from '../constants';

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

export interface IEmaOutcome {
  [period: string]: number;
}

export interface EmaCrossingResult {
  time: Date;
  interval: INTERVALS;
  direction: SIGNAL_DIRECTION;
  shortPeriod: MA_Periods;
  longPeriod: MA_Periods;
}

export type EmaCrossingMultiResult = { [key: string]: EmaCrossingResult };
