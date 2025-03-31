# chart-patterns

[![npm version](https://badge.fury.io/js/chart-patterns.svg)](https://www.npmjs.com/package/chart-patterns)
[![GitHub license](https://img.shields.io/github/license/focus1691/chart-patterns.svg)](https://github.com/focus1691/chart-patterns/blob/master/LICENSE)


## Advanced Technical Analysis Library for Algo Traders

`chart-patterns` is a comprehensive TypeScript/JavaScript library that provides technical analysis tools for financial markets. This library includes traditional candlestick pattern recognition, volume analysis, order flow insights, and market structure identification.

# Indicators
1. [Market Profile](https://focus1691.github.io/chart-patterns/functions/lib.MarketProfile.build.html "Market Profile")
1. [Volume Profile](https://focus1691.github.io/chart-patterns/functions/lib.VolumeProfile.build.html "Volume Profile")
1. [Value Area](https://focus1691.github.io/chart-patterns/functions/lib.ValueArea.calculate.html, "Value Area")
1. [Peak Detector](https://focus1691.github.io/chart-patterns/modules/lib.PeakDetector.html, "Peak Detector")
1. [Pivot Points](https://focus1691.github.io/chart-patterns/functions/lib.PivotPoints.calculatePivotPoints.html, "Pivot Points")
1. [Range Finder](https://focus1691.github.io/chart-patterns/functions/lib.RangeBuilder.findRanges.html "Range Finder")
1. [Zscore](https://focus1691.github.io/chart-patterns/classes/lib.ZScores.ZScore.html#calc, "Zscore")
1. [Zigzags](https://focus1691.github.io/chart-patterns/functions/lib.ZigZags.create.html, "Zigzags")

# Orderflow Indicators
FootPrint candles built from the [Orderflow service](https://github.com/focus1691/orderflow).

1. [Stacked Imbalances](https://focus1691.github.io/chart-patterns/functions/lib.Orderflow.detectStackedImbalances.html "Stacked Imbalances")
1. [High Volume Node](https://focus1691.github.io/chart-patterns/functions/lib.Orderflow.findHighVolumeNodes.html "High Volume Node")

# General Indicators
1. [EMA](https://focus1691.github.io/chart-patterns/functions/lib.MovingAverage.calculateEMA.html, "EMA")
1. [SMA](https://focus1691.github.io/chart-patterns/functions/lib.MovingAverage.calculateSMA.html, "SMA")
1. [RSI](https://focus1691.github.io/chart-patterns/functions/lib.RSI.calculateRSI.html "RSI")
1. [VWAP](https://focus1691.github.io/chart-patterns/functions/lib.VWAP.calculateVWAP.html "VWAP")

# Candlestick Patterns
1. [Doji](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.getDojiPatternDirection.html, "Doji")
1. [Engulfing](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.getEngulfingPatternDirection.html "Englufing")
1. [Excess](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.getCandleExcessDirection.html "Excess")
1. [Morning Star / Evening Star](https://focus1691.github.io/chart-patterns/functions/lib.CandlestickPatterns.detectMorningEveningStar.html "Morning Star / Evening Star")

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
