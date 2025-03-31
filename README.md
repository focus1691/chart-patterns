# chart-patterns

[![npm version](https://badge.fury.io/js/chart-patterns.svg)](https://www.npmjs.com/package/chart-patterns)
[![GitHub license](https://img.shields.io/github/license/focus1691/chart-patterns.svg)](https://github.com/focus1691/chart-patterns/blob/master/LICENSE)


## Advanced Technical Analysis Library for Algo Traders

`chart-patterns` is a comprehensive TypeScript/JavaScript library that provides technical analysis tools for financial markets. This library includes traditional candlestick pattern recognition, volume analysis, order flow insights, and market structure identification.

### 📊 Market & Volume Distribution

| Tool | Description |
|------|-------------|
| [Market Profile](https://focus1691.github.io/chart-patterns/functions/lib.MarketProfile.build.html) | Generates TPO profiles with Value Area, Initial Balance, and Point of Control. |
| [Volume Profile](https://focus1691.github.io/chart-patterns/functions/lib.VolumeProfile.build.html) | Builds a volume histogram with Point of Control and Value Area. |
| [Value Area](https://focus1691.github.io/chart-patterns/functions/lib.ValueArea.calculate.html) | Calculates Value Area, POC, and key volume levels from price data. |

---

### 🧭 Support & Resistance

| Tool | Description |
|------|-------------|
| [Peak Detector](https://focus1691.github.io/chart-patterns/modules/lib.PeakDetector.html) | Detects local highs and lows in price to identify swing points. |
| [Pivot Points](https://focus1691.github.io/chart-patterns/functions/lib.PivotPoints.calculatePivotPoints.html) | Calculates classic pivot points and support/resistance levels. |
| [Range Finder](https://focus1691.github.io/chart-patterns/functions/lib.RangeBuilder.findRanges.html) | Detects trading ranges where price is consolidating. |
| [Zscore](https://focus1691.github.io/chart-patterns/classes/lib.ZScores.ZScore.html#calc) | Measures how far price deviates from the mean — useful for spotting extremes. |
| [Zigzags](https://focus1691.github.io/chart-patterns/functions/lib.ZigZags.create.html) | Identifies significant price swings, filtering out minor moves. |

---

### 🔍 Orderflow

Footprint candles built from the [Orderflow service](https://github.com/focus1691/orderflow).

| Tool | Description |
|------|-------------|
| [Stacked Imbalances](https://focus1691.github.io/chart-patterns/functions/lib.Orderflow.detectStackedImbalances.html) | Finds clusters of aggressive buying or selling — potential turning points. |
| [High Volume Node](https://focus1691.github.io/chart-patterns/functions/lib.Orderflow.findHighVolumeNodes.html) | Highlights price levels with exceptionally high traded volume. |

---

### ⚙️ General Indicators

| Tool | Description |
|------|-------------|
| [EMA](https://focus1691.github.io/chart-patterns/functions/lib.MovingAverage.calculateEMA.html) | Exponential Moving Average — responds faster to price changes. |
| [SMA](https://focus1691.github.io/chart-patterns/functions/lib.MovingAverage.calculateSMA.html) | Simple Moving Average — smooths out price over a defined window. |
| [RSI](https://focus1691.github.io/chart-patterns/functions/lib.RSI.calculateRSI.html) | Relative Strength Index — shows overbought/oversold conditions. |
| [VWAP](https://focus1691.github.io/chart-patterns/functions/lib.VWAP.calculateVWAP.html) | Volume-Weighted Average Price — key level used by institutions. |

---

### 🕯️ Candlestick Patterns

| Pattern | Description |
|---------|-------------|
| [Doji](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.getDojiPatternDirection.html) | Indicates indecision — open and close are nearly equal. |
| [Engulfing](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.getEngulfingPatternDirection.html) | A reversal pattern where one candle fully engulfs the previous one. |
| [Excess](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.getCandleExcessDirection.html) | Identifies candles with excess (tails/wicks) suggesting rejection. |
| [Morning Star / Evening Star](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectMorningEveningStar.html) | Reversal patterns formed across three candles — bullish or bearish. |

# Usage
```ts
import * as ta from 'chart-patterns';
import { IVolumeProfile, IMarketProfile, ILocalRange } from 'chart-patterns/dist/types';
import { MARKET_PROFILE_PERIODS } from 'chart-patterns/dist/constants';

const marketProfiles: IMarketProfile[] = ta.MarketProfile.build({
  candles,
  candleGroupingPeriod: MARKET_PROFILE_PERIODS.DAILY,
  tickSize: 0.1,
  pricePrecision: 2,
  tickMultiplier: 100,
  timezone: 'Europe/London'
});

const volumeProfiles: IVolumeProfile[] = ta.VolumeProfile.build({
  candles,
  tickSize: 0.1,
  period: MARKET_PROFILE_PERIODS.DAILY,
  timezone: 'Europe/London'
});

const LAG = 2;
const threshold = 0.1;
const influence = 1;
const ranges: ILocalRange[] = ta.RangeBuilder.findRanges(candles, LAG, THRESHOLD, INFLUENCE);
```

- Maket Profile
![image](https://github.com/user-attachments/assets/4b5f81a9-7d55-42f1-ad95-023b47ecfc2a)

- Ranges
![rr_fullsize](https://github.com/user-attachments/assets/22077a58-ed1c-422c-946d-b9d25e586f7e)
