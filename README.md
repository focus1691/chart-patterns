# `@focus1691/chart-patterns` Library

This library provides a comprehensive toolkit for technical analysis in financial markets, focusing on chart patterns and market profiles. Below are detailed examples of how to use various modules of this library.

## Chart Patterns

### Harmonics

The `Harmonic` module allows you to identify harmonic patterns in financial market charts. These patterns are crucial for technical analysis and can indicate potential market movements.

**Usage:**

```typescript
import { ZigZags, findHarmonicPatterns } from '@focus1691/chart-patterns'
import { IZigZag } from '@focus1691/chart-patterns/dist/types/zigzags.types'
import { IHarmonic } from '@focus1691/chart-patterns/dist/types/harmonics.types'

// Parameters for ZigZag pattern detection
const lag: number = 5
const threshold: number = 2
const influence: number = 0.3

// Generate ZigZag patterns
const zigzags: IZigZag[] = ZigZags.create(candles, lag, threshold, influence)

// Find Harmonic patterns
const harmonics: IHarmonic[] = findHarmonicPatterns(zigzags)
```

### Market Profile

The `MarketProfile` module helps you to analyse the market profile of financial instruments. Market profiles can be used to understand the price distribution and trading activity over a specified time frame.

**Usage:**

```typescript
import { MarketProfile, IMarketProfile } from '@focus1691/chart-patterns'
import { IMarketProfileConfig } from '@focus1691/chart-patterns/dist/types/marketProfile.types'

const market = new MarketProfileService()
const config: IMarketProfileConfig = { candles, tickSize: 0.5 } // 0.5 for BTCUSDT.
// Candles must be in a 30m timeframe (Market Profile Theory for 30m candles)
const marketProfile: IMarketProfile = market.getMarketProfile(config)
```

### Candles

The `Candles` module includes functions for analysing individual candlesticks, which are essential in understanding market sentiment and potential reversals.

**Usage:**

```typescript
import { isExcess } from '@focus1691/chart-patterns'

const isExcessCandle: boolean = isExcess(candle)
```

### Shape Patterns

The `Shapes` module is designed for detecting and analysing geometric patterns in financial charts, such as triangles, rectangles, and wedges. These patterns are vital for predicting market continuations or reversals, making them essential tools in technical trading analysis.

**Usage:**

```typescript
import { Shapes } from '@focus1691/chart-patterns'
import { ITrianglePattern } from '@focus1691/chart-patterns/dist/types/triangle.types'

const triangles: ITrianglePattern[] = Shapes.findTrianglePatterns(zigzags)
