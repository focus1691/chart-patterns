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

export interface IFundingRateCandle {
  interval: string
  fundingRate: number
  timestamp: number
}

export interface IOpenInterestCandle {
  interval: string
  openInterest: number
  timestamp: number
}
