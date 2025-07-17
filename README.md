# chart-patterns

[![npm version](https://badge.fury.io/js/chart-patterns.svg)](https://www.npmjs.com/package/chart-patterns)
[![GitHub license](https://img.shields.io/github/license/focus1691/chart-patterns.svg)](https://github.com/focus1691/chart-patterns/blob/master/LICENSE)

## Advanced Technical Analysis Library for Algo Traders

`chart-patterns` is a TypeScript library that provides technical analysis for volume based indicators, and also uses peak detection algos for generating pattern based indicators.

### 📊 Market & Volume Distribution

| Tool | Description |
|------|-------------|
| [Market Profile](https://focus1691.github.io/chart-patterns/functions/lib.MarketProfile.build.html) | Generates TPO profiles with Value Area, Initial Balance, and Point of Control. |
| [Volume Profile](https://focus1691.github.io/chart-patterns/modules/lib.VolumeProfile.html) | Generate Volume Profiles to find the Value Area. Process either Kline or tick data to build these profiles. |

---

### 🧭 Z-Score Tools for Ranges & Swings

| Tool | Description |
|------|-------------|
| [Peak Detector](https://focus1691.github.io/chart-patterns/modules/lib.PeakDetector.html) | Z-Score based Peak Detector to find swing highs/lows. |
| [Range Finder](https://focus1691.github.io/chart-patterns/functions/lib.RangeBuilder.findRanges.html) | Finds key support and resistance zones from price swings. |
| [Zigzags](https://focus1691.github.io/chart-patterns/functions/lib.ZigZags.create.html) | Highlights major price swings only. |
| [Zscore](https://focus1691.github.io/chart-patterns/classes/lib.ZScores.ZScore.html#calc) | Measures how far price deviates from the mean — useful for spotting extremes. |

---

### 🔍 Orderflow

Requires raw trade data. More information in my [blog post here](https://blog.chartsignals.trading/blog/crypto-trading-bot-architecture).

| Tool | Description |
|------|-------------|
| [Stacked Imbalances](https://focus1691.github.io/chart-patterns/functions/lib.Orderflow.detectStackedImbalances.html) | Finds clusters of aggressive buying or selling — potential turning points. |
| [High Volume Node](https://focus1691.github.io/chart-patterns/functions/lib.Orderflow.findHighVolumeNodes.html) | Highlights price levels with exceptionally high traded volume. |

---

### ⚙️ General Indicators

| Tool | Description |
|------|-------------|
| [EMA](https://focus1691.github.io/chart-patterns/functions/lib.MovingAverage.calculateEMA.html) | Exponential Moving Average — Weighted moving average that reacts quickly to price. |
| [MFI](https://focus1691.github.io/chart-patterns/functions/lib.MFI.calculateMFI.html) | Money Flow Index — Volume-based oscillator showing buy/sell pressure. |
| [Pivot Points](https://focus1691.github.io/chart-patterns/functions/lib.PivotPoints.calculatePivotPoints.html) | Calculates pivot, support, and resistance levels. |
| [RSI](https://focus1691.github.io/chart-patterns/functions/lib.RSI.calculateRSI.html) | Relative Strength Index — Measures momentum to spot overbought/oversold. |
| [SMA](https://focus1691.github.io/chart-patterns/functions/lib.MovingAverage.calculateSMA.html) | Simple Moving Average — Simple average of price over a period. |
| [Stochastic RSI](https://focus1691.github.io/chart-patterns/functions/lib.RSI.calculateStochasticRSI.html) | Tracks RSI momentum shifts. |
| [VWAP](https://focus1691.github.io/chart-patterns/modules/lib.VWAP.html) | Average price weighted by volume. |

---

### 🕯️ Candlestick Patterns

| Pattern | Description |
|---------|-------------|
| [Doji](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.getDojiPatternDirection.html) | Signals indecision — open and close are nearly equal. |
| [Engulfing](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectEngulfing.html) | Reversal pattern where one candle fully engulfs the previous. |
| [Excess](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.getCandleExcessDirection.html) | Detects large wicks suggesting rejection from highs/lows. |
| [Harami](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectHarami.html) | Small candle inside a larger one — potential reversal. |
| [Homing Pigeon](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectHarami.html) | Two small-bodied candles in a downtrend — possible bullish reversal. |
| [Inverted Hammer](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectInvertedHammer.html) | Small body with long upper wick — potential bullish reversal. |
| [Marubozu](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectMarubozu.html) | Full-body candle with no wicks — strong directional move. |
| [Morning Star / Evening Star](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectMorningEveningStar.html) | Three-candle reversal pattern — bullish (morning) or bearish (evening). |

# Usage
```ts
import * as ta from 'chart-patterns';
import { IVolumeProfile, IMarketProfile, ILocalRange, IZScoreConfig } from 'chart-patterns/dist/types';
import { MARKET_PROFILE_PERIODS } from 'chart-patterns/dist/constants';

// Market Profile
const marketProfiles: IMarketProfile[] = ta.MarketProfile.build({
  candles,
  candleGroupingPeriod: MARKET_PROFILE_PERIODS.DAILY,
  tickSize: 0.1,
  pricePrecision: 2,
  tickMultiplier: 100,
  timezone: 'Europe/London'
});

// Volume Profile - Session-based API
// Create a session for candle-based volume profile
const barSession = ta.VolumeProfile.createBarSession({
  valueAreaRowSize: 24,
  valueAreaVolume: 0.7,
  pricePrecision: 2
});

// Process candles one by one
for (const candle of candles) {
  barSession.processCandle(candle);
}

// Get value area and distribution results
const valueArea = barSession.getValueArea();
const distribution = barSession.getVolumeDistribution();

// For raw trade data - even more precision
const tickSession = ta.VolumeProfile.createTickSession();
// Process each individual trade
for (const trade of trades) {
  tickSession.processTrade(trade);
}
// Get detailed trade analysis with exact price levels
const tickDistribution = tickSession.getVolumeDistribution();

// Money Flow Index - volume-based momentum oscillator
const mfiValues = ta.MFI.calculateMFI(candles, 14);

// RSI and Stochastic RSI
const rsiValues = ta.RSI.calculateRSI(candles, 14);
const stochRsiResult = ta.RSI.calculateStochasticRSI(candles, 14, 14, 3, 3);

// Z-Score configuration for peak/pattern detection algorithms
const zScoreConfig: IZScoreConfig = {
  lag: 2,        // Controls smoothing and adaptability to trend changes
  threshold: 0.1, // Number of standard deviations to classify a signal
  influence: 1    // How strongly signals affect future calculations (0-1)
};

const ranges: ILocalRange[] = ta.RangeBuilder.findRanges(candles, zScoreConfig);

// Create zigzag points for pattern recognition
const zigzags = ta.ZigZags.create(candles, zScoreConfig);
```

- Maket Profile
![image](https://github.com/user-attachments/assets/4b5f81a9-7d55-42f1-ad95-023b47ecfc2a)

- Ranges
![rr_fullsize](https://github.com/user-attachments/assets/22077a58-ed1c-422c-946d-b9d25e586f7e)
