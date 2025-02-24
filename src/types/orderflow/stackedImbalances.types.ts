import { ImbalanceSide } from '../../constants';

export interface Imbalance {
  price: string;
  imbalanceSide: ImbalanceSide;
  volSumAsk: number;
  volSumBid: number;
}

export interface IStackedImbalancesResult {
  imbalanceStartAt: string;
  imbalanceEndAt: string;
  stackedCount: number;
  imbalanceSide: ImbalanceSide;
}

export interface IStackedImbalanceConfig {
  /**
   * The threshold percentage to determine an imbalance.
   * Default is 300.
   */
  threshold?: number;

  /**
   * The minimum number of consecutive imbalances required to form a stack.
   * Default is 3.
   */
  stackCount?: number;

  /**
   * The size of the price tick.
   */
  tickSize: number;
}
