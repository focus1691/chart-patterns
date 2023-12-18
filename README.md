# Chart Patterns

```typescript
import { ZigZags, findHarmonicPatterns } from '@focus1691/chart-patterns'
import { IZigZag } from '@focus1691/chart-patterns/dist/types/zigzags.types'
import { IHarmonic } from '@focus1691/chart-patterns/dist/types/harmonics.types'

/** These parameters generated zig zags open ended **/
const lag: number = 5
const threshold: number = 2
const influence: number = 0.3

const zigzags: IZigZag[] = ZigZags.create(candles, lag, threshold, influence)

const harmonics: IHarmonic[] = findHarmonicPatterns(zigzags)
```
