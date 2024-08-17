# chart-patterns

[![npm version](https://badge.fury.io/js/chart-patterns.svg)](https://www.npmjs.com/package/chart-patterns)
[![GitHub license](https://img.shields.io/github/license/focus1691/chart-patterns.svg)](https://github.com/focus1691/chart-patterns/blob/master/LICENSE)

I am building various technical indicators not available elsewhere. These include:

- Market Profile - A distribution to identify value in relation to time.
- Volume Profile - A distribution to identify value in relation to volume.
- Stacked Imbalances - Orderflow data to identify stacks of buying/selling discrepancies at certain prices.

```ts
import { MarketProfile, VolumeProfile } from 'chart-patterns'

const marketProfiles = MarketProfile.build({
  candles,
  period: MARKET_PROFILE_PERIODS.DAILY,
  tickSize: 0.1,
  tickMultiplier: 100,
  timezone: 'Europe/London'
});

const volumeProfiles: IVolumeProfile = VolumeProfile.create({
  candles,
  tickSize: 0.1,
  period: MARKET_PROFILE_PERIODS.DAY,
  timezone: 'Europe/London'
})
```
