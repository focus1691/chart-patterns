import { ICandle } from './candle.types';

export interface IDivergencePoint {
  time: Date;
  priceValue: number;
  indicatorValue: number;
  direction: 'HIGH' | 'LOW';
  peakIndex: number;
}

export interface IDivergence {
  type: 'bullish' | 'bearish';
  startTime: Date;
  endTime: Date;
  points: IDivergencePoint[];
  strength: number; // number of points
  description: string;
  indicator: string; // 'MFI', 'RSI', etc.
}

export interface IDivergenceConfig {
  maxTimeSpanHours?: number; // Maximum time span for a sequence (default: 48)
}

export type IndicatorCalculator = (candles: ICandle[], ...args: any[]) => number[]; 