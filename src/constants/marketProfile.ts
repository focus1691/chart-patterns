export const SINGLE_PRINTS_KLINE_LENGTH_SIGNIFICANCE = 5
export const EXCESS_TAIL_LENGTH_SIGNIFICANCE = 15
export const POOR_HIGH_LOW_KLINE_LENGTH_SIGNIFICANCE = 15

export enum MARKET_PROFILE_OPEN {
  OPEN_DRIVE = 'Open Drive',
  OPEN_TEST_DRIVE = 'Open Test Drive',
  OPEN_REJECTION_REVERSE = 'Open Rejection Reverse',
  OPEN_AUCTION = 'Open Auction'
}

export enum MARKET_PROFILE_DAYS {
  NORMAL = 'normal',
  NEUTRAL = 'neutral',
  TREND = 'trend',
  DOUBLE_DISTRIBUTION = 'double_distribution',
  B_SHAPE = 'b_shape',
  P_SHAPE = 'p_shape'
}
