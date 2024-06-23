import { ImbalanceType } from '../constants'

/**
 * Represents a single row of order flow data, showing the volume of trades at a particular price.
 */
export interface OrderFlowRow {
  volSumAsk: number
  volSumBid: number
  bidImbalancePercent: number
}

/**
 * Represents an imbalance in the order flow data, indicating whether the imbalance is on the buying or selling side.
 */
export interface Imbalance {
  price: number
  imbalanceType: ImbalanceType
  volSumAsk: number
  volSumBid: number
}

/**
 * Configuration options for detecting stacked imbalances.
 */
export interface IStackedImbalanceConfig {
  /**
   * The threshold percentage to determine an imbalance.
   * Default is 300.
   */
  threshold?: number

  /**
   * The minimum number of consecutive imbalances required to form a stack.
   * Default is 3.
   */
  stackCount?: number
}
