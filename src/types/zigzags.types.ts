import { SIGNAL_DIRECTION } from "../constants";
import { IZScoreConfig } from "./peakDetector.types";

export type zigzagType = 'PEAK' | 'TROUGH';

export interface IZigZag {
  price: number;
  direction: SIGNAL_DIRECTION;
  timestamp: number;
}

/**
 * Configuration options for zigzag calculation
 */
export interface ZigZagConfig extends IZScoreConfig {
  /**
   * Method to use for price determination
   * - 'close': Use close price for all zigzag points (default)
   * - 'extremes': Use high for bullish points and low for bearish points
   */
  priceMethod?: 'close' | 'extremes';
}