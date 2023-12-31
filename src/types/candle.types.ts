/**
 * Represents a candlestick in a financial chart, with details about its trading interval, price movements, and volume.
 */
export interface ICandle {
  symbol: string
  interval: string
  openTime: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  closeTime: Date
}

/**
 * Represents a candlestick specifically for funding rate data, including the interval, funding rate, and timestamp.
 */
export interface IFundingRateCandle {
  interval: string
  fundingRate: number
  timestamp: number
}

/**
 * Represents a candlestick for open interest data, including the interval, open interest value, and timestamp.
 */
export interface IOpenInterestCandle {
  interval: string
  openInterest: number
  timestamp: number
}
