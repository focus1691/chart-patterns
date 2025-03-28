# chart-patterns

[![npm version](https://badge.fury.io/js/chart-patterns.svg)](https://www.npmjs.com/package/chart-patterns)
[![GitHub license](https://img.shields.io/github/license/focus1691/chart-patterns.svg)](https://github.com/focus1691/chart-patterns/blob/master/LICENSE)

I am building various technical indicators not available elsewhere. These include:

- Market Profile - A distribution to identify value in relation to time.
- Volume Profile - A distribution to identify value in relation to volume.
- Stacked Imbalances - Identify stacks of buying/selling imbalances on the price level (needs orderflow data).
- High Volume Node - Identify nodes where a large trade volume occurred (needs orderflow data).

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
