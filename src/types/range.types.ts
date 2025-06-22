import { SIGNAL_DIRECTION, IFibonacciRetracement } from '../constants';

export interface ILocalRange {
  support?: number;
  resistance?: number;
  start?: number;
  end?: number;
  direction?: SIGNAL_DIRECTION;
  fibs?: {
    highToLow?: IFibonacciRetracement;
    lowToHigh?: IFibonacciRetracement;
  };
}

export interface IPeak {
  position: number;
  direction: SIGNAL_DIRECTION;
}
