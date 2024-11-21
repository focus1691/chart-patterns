import { ImbalanceType } from '../../constants';

export interface Imbalance {
  price: number;
  imbalanceType: ImbalanceType;
  volSumAsk: number;
  volSumBid: number;
}

export interface IStackedImbalancesResult {
  startPrice: number;
  endPrice: number;
  count: number;
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
  tickSize?: number;
}
