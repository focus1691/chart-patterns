export type zigzagType = 'PEAK' | 'TROUGH'

export interface IZigZag {
  price: number
  direction: zigzagType
  timestamp: number
}
