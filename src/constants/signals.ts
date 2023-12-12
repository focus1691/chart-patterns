export enum SIGNALS {
  TRIGGER_POINT = 'trigger_point',
  MARKET_SENTIMENT = 'market_sentiment',
  CANDLE_ANOMALY = 'candle_anomaly',
  POTENTIAL_ROTATION = 'potential_rotation',
  VALUE_AREA_CONTEXT = 'value_area_context',
}

export enum SIGNAL_DIRECTION {
  BULLISH = 'bullish',
  BEARISH = 'bearish',
  SIDEWAYS = 'sideways',
  BOTH = 'both',
  NONE = 'none'
}
