/**
 * Enumerates various technical indicators used in market analysis.
 */
export enum TechnicalIndicators {
  RANGES = 'ranges',
  EMA = 'ema',
  EMA_CROSSING = 'emaCrossing',
  BOLLINGER_BANDS = 'bollingerBands',
  PIVOT_POINTS = 'pivotPoints',
  VWAP = 'vwap',
  LINEAR_REGRESSION = 'linearRegression',
  HARMONICS = 'harmonics',
  OPEN_INTEREST_SENTIMENT = 'openInterestSentiment',
  FUNDING_RATE_SENTIMENT = 'fundingRateSentiment',
  CUMULATIVE_VOLUME_DELTA = 'cumulativeVolumeDelta',
  VOLUME_DELTA = 'volumeDelta',
  VOLUME_DELTA_DIRECTION = 'volumeDeltaDirection',
  CVD_DIVERGENCE = 'cvd_divergence',
  OPEN_OUTSIDE_VALUE = 'openOutsideValue'
}
