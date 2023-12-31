export type zigzagType = 'PEAK' | 'TROUGH'

/**
 * Defines a zigzag point in a price movement with its type, price, and timestamp.
 */
export interface IZigZag {
  price: number
  direction: zigzagType
  timestamp: number
}
