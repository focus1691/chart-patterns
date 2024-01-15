import { CANDLE_OBSERVATIONS, SIGNAL_DIRECTION } from '../constants'

export type KeyLevel = number

export interface ILevelStrategy {
  level: CANDLE_OBSERVATIONS
  direction: SIGNAL_DIRECTION
}

export interface ITradeSetupInstruction {
  percent?: number
  direction?: SIGNAL_DIRECTION
  position?: PRICE_POSITION
  level?: KEY_LEVELS
  window?: ITradeWindow
}

export interface ITradeWindow {
  start: number
  end: number
}

export enum LEVEL_ZONE {
  SUPPORT = 'support',
  RESISTANCE = 'resistance'
}

export enum PRICE_POSITION {
  INSIDE = 'inside',
  ABOVE = 'above',
  BELOW = 'below'
}

export enum KEY_LEVELS {
  PREVIOUS_DAY_CLOSE = 'pdClose',
  DAILY_OPEN = 'dOpen',
  WEEKLY_OPEN = 'wOpen',
  MONTHLY_OPEN = 'mOpen',
  // Point of Control
  PREVIOUS_DAY_POINT_OF_CONTROL = 'pdPOC',
  DEVELOPING_POINT_OF_CONTROL = 'POC',
  WEEKLY_POINT_OF_CONTROL = 'wPOC',
  PREVIOUS_WEEK_POINT_OF_CONTROL = 'pwPOC',
  MONTHLY_POINT_OF_CONTROL = 'mPOC',
  PREVIOUS_MONTH_POINT_OF_CONTROL = 'pmPOC',
  // Value Area High
  PREVIOUS_DAY_VALUE_AREA_HIGH = 'pdVAH',
  DEVELOPING_VALUE_AREA_HIGH = 'VAH',
  WEEKLY_VALUE_AREA_HIGH = 'wVAH',
  PREVIOUS_WEEK_VALUE_AREA_HIGH = 'pwVAH',
  MONTHLY_VALUE_AREA_HIGH = 'mVAH',
  PREVIOUS_MONTH_VALUE_AREA_HIGH = 'pmVAH',
  // Value Area Low
  PREVIOUS_DAY_VALUE_AREA_LOW = 'pdVAL',
  DEVELOPING_VALUE_AREA_LOW = 'VAL',
  WEEKLY_VALUE_AREA_LOW = 'wVAL',
  PREVIOUS_WEEK_VALUE_AREA_LOW = 'pwVAL',
  MONTHLY_VALUE_AREA_LOW = 'mVAL',
  PREVIOUS_MONTH_VALUE_AREA_LOW = 'pmVAL',

  HIGH = 'high',
  LOW = 'low'
}
