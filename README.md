# chart-patterns

[![npm version](https://badge.fury.io/js/chart-patterns.svg)](https://www.npmjs.com/package/chart-patterns)
[![GitHub license](https://img.shields.io/github/license/focus1691/chart-patterns.svg)](https://github.com/focus1691/chart-patterns/blob/master/LICENSE)

TypeScript library that provides technical analysis for volume-based indicators and uses peak detection algorithms to generate pattern-based indicators.

### 📊 Market & Volume Distribution

| Tool | Description |
|------|-------------|
| [Market Profile](https://focus1691.github.io/chart-patterns/functions/lib.MarketProfile.build.html) | Generates TPO profiles with Value Area, Initial Balance, and Point of Control. |
| [Volume Profile](https://focus1691.github.io/chart-patterns/modules/lib.VolumeProfile.html) | Generate Volume Profiles to find the Value Area. Process either Kline or tick data to build these profiles. |

---

### 🧭 Z-Score Tools for Ranges & Swings

| Tool | Description |
|------|-------------|
| [Divergences](https://focus1691.github.io/chart-patterns/modules/lib.Divergences.html) | Detects bullish/bearish divergences between price and indicators (MFI, RSI). |
| [Peak Detector](https://focus1691.github.io/chart-patterns/modules/lib.PeakDetector.html) | Z-Score-based Peak Detector to find swing highs and lows. |
| [Range Finder](https://focus1691.github.io/chart-patterns/functions/lib.RangeBuilder.findRanges.html) | Finds key support and resistance zones from price swings. |
| [Zigzags](https://focus1691.github.io/chart-patterns/functions/lib.ZigZags.create.html) | Highlights major price swings only. |
| [Zscore](https://focus1691.github.io/chart-patterns/classes/lib.ZScores.ZScore.html#calc) | Measures how far price deviates from the mean — useful for spotting extremes. |

---

### 🔍 Orderflow

Requires raw trade data. More information can be found in my [blog post here](https://blog.chartsignals.trading/blog/crypto-trading-bot-architecture).

| Tool | Description |
|------|-------------|
| [Stacked Imbalances](https://focus1691.github.io/chart-patterns/functions/lib.Orderflow.detectStackedImbalances.html) | Finds clusters of aggressive buying or selling — potential turning points. |
| [High Volume Node](https://focus1691.github.io/chart-patterns/functions/lib.Orderflow.findHighVolumeNodes.html) | Highlights price levels with exceptionally high traded volume. |

---

### ⚙️ General Indicators

| Tool | Description |
|------|-------------|
| [EMA](https://focus1691.github.io/chart-patterns/functions/lib.MovingAverage.calculateEMA.html) | Exponential Moving Average — a weighted moving average that reacts quickly to price. |
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
| [Excess](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.getCandleExcessDirection.html) | Detects large wicks, suggesting rejection from highs or lows. |
| [Harami](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectHarami.html) | Small candle inside a larger one — potential reversal. |
| [Homing Pigeon](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectHarami.html) | Two small-bodied candles in a downtrend — possible bullish reversal. |
| [Inverted Hammer](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectInvertedHammer.html) | Small body with long upper wick — potential bullish reversal. |
| [Marubozu](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectMarubozu.html) | Full-body candle with no wicks — strong directional move. |
| [Morning Star / Evening Star](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectMorningEveningStar.html) | Three-candle reversal pattern — bullish (morning) or bearish (evening). |

# Usage
```ts
import * as ta from 'chart-patterns';
import { IMarketProfile, ILocalRange, IZScoreConfig, IDivergence } from 'chart-patterns/dist/types';
import { MARKET_PROFILE_PERIODS, SIGNAL_DIRECTION } from 'chart-patterns/dist/constants';

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
const volumeProfileBarSession = ta.VolumeProfile.createBarSession({
  valueAreaRowSize: 24,
  valueAreaVolume: 0.7,
  pricePrecision: 2
});

// Process candles one by one
candles.forEach((candle) => volumeProfileBarSession.processCandle(candle));

// Get value area and distribution results
const valueArea = barSession.getValueArea();
const distribution = barSession.getVolumeDistribution();

// For raw trade data - even more precision
const volumeProfileTickSession = ta.VolumeProfile.createTickSession();
// Process each individual trade
for (const trade of trades) {
  volumeProfileTickSession.processTrade(trade);
}
// Get detailed trade analysis with exact price levels
const tickDistribution = volumeProfileTickSession.getVolumeDistribution();

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

const zScoreConfigDivergences: IZScoreConfig = {
  lag: 3,
  threshold: 1,
  influence: 0.75
};

// Divergence Detection - Find divergences between price and indicators
const mfiDivergences: IDivergence[] = ta.Divergences.mfi(candles, zScoreConfigDivergences, 14);
const rsiDivergences: IDivergence[] = ta.Divergences.rsi(candles, zScoreConfigDivergences, 14);

// Candlestick Pattern Detection - Excess (large wicks indicating rejection)
const excessDirection: SIGNAL_DIRECTION = ta.CandlestickPatterns.getCandleExcessDirection(candles[0]);

```

## Visualisations

<table>
   <tr>
      <td align="center" width="50%"><b>Market Profile</b></td>
      <td align="center" width="50%"><b>MFI Divergence</b></td>
   </tr>
   <tr>
      <td width="50%">
         <img src="https://github.com/user-attachments/assets/4b5f81a9-7d55-42f1-ad95-023b47ecfc2a"
            alt="Market Profile visualization showing TPO distribution with Value Area, POC, and VAH/VAL highlighted"
            >
      </td>
      <td width="50%">
         <img src="https://github.com/user-attachments/assets/096d6f25-2136-4429-8bbc-4cff7665a49f"
            alt="Screenshot from 2025-07-30 17-28-54"
            >
      </td>
   </tr>
   <!-- New row spanning both columns for Range Detection -->
   <tr>
      <td colspan="2" align="center"><b>Range Detection</b></td>
   </tr>
   <tr>
      <td colspan="2">
         <img src="https://github.com/user-attachments/assets/22077a58-ed1c-422c-946d-b9d25e586f7e"
            alt="Range detection visualization showing support and resistance levels identified on BTC/USDT price action"
            >
      </td>
   </tr>
</table>
