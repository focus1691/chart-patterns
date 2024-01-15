import { INTERVALS } from '../constants/candles'

export interface ILinearRegression {
  sumX: number
  sumY: number
  sumXSquared: number
  sumYSquared: number
  sumXYProducts: number
  meanX: number
  meanY: number
  r: number
  r2: number
}

export interface ILinearRegressionInterval {
  amount: number
  duration: string
}

export enum LINEAR_REGRESSION_PERIODS {
  ONE_WEEK = INTERVALS.ONE_WEEK,
  ONE_MONTH = INTERVALS.ONE_MONTH,
  THREE_MONTHS = INTERVALS.THREE_MONTHS,
  SIX_MONTHS = INTERVALS.SIX_MONTHS,
  ONE_YEAR = INTERVALS.ONE_YEAR,
  TWO_YEARS = INTERVALS.TWO_YEARS
}

export const LinearRegressionTimes: Record<LINEAR_REGRESSION_PERIODS, ILinearRegressionInterval> = {
  [LINEAR_REGRESSION_PERIODS.ONE_WEEK]: { amount: 1, duration: 'week' },
  [LINEAR_REGRESSION_PERIODS.ONE_MONTH]: { amount: 1, duration: 'month' },
  [LINEAR_REGRESSION_PERIODS.THREE_MONTHS]: { amount: 3, duration: 'month' },
  [LINEAR_REGRESSION_PERIODS.SIX_MONTHS]: { amount: 6, duration: 'month' },
  [LINEAR_REGRESSION_PERIODS.ONE_YEAR]: { amount: 1, duration: 'year' },
  [LINEAR_REGRESSION_PERIODS.TWO_YEARS]: { amount: 2, duration: 'year' }
}
