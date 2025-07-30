import { SIGNAL_DIRECTION } from '../constants';

export type zigzagType = 'PEAK' | 'TROUGH';

export interface IZigZag {
  price: number;
  direction: SIGNAL_DIRECTION;
  timestamp: number;
}
