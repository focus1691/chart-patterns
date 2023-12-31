/**
 * Represents the Fibonacci retracement levels for a given price range.
 * Each property corresponds to a standard Fibonacci retracement level and holds the price at that level.
 */
export interface IFibonacciRetracement {
  0: number | null
  0.236: number | null
  0.382: number | null
  0.5: number | null
  0.618: number | null
  0.66: number | null
  0.786: number | null
  1: number | null
  1.618: number | null
}

/**
 * Enumerates key Fibonacci retracement levels commonly used in financial markets to identify potential support and resistance levels.
 */
export enum FIBONACCI_NUMBERS {
  ZERO = 0,
  TWO_THREE_SIX = 0.236,
  THREE_EIGHT_TWO = 0.382,
  FIVE = 0.5,
  SIX_ONE_EIGHT = 0.618,
  SIX_SIX = 0.66,
  SEVEN_EIGHT_SIX = 0.786,
  ONE = 1,
  ONE_SIX_EIGHT = 1.618
}
