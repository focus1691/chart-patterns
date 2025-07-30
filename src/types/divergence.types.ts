import { SIGNAL_DIRECTION } from '../constants/signals';

export interface IDivergencePoint {
  time: Date;
  priceValue: number;
  indicatorValue: number;
  direction: 'HIGH' | 'LOW';
  peakIndex: number;
  isMatch: boolean; // Whether the price and indicator directions match
}

export interface IDivergence {
  type: SIGNAL_DIRECTION;
  startTime: Date;
  endTime: Date;
  points: IDivergencePoint[];
  strength: number; // number of points
  description: string;
}
