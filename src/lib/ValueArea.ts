import moment from 'moment'
import { IValueArea, IVolumeRow } from '../types/valueArea.types'
import { countDecimals, round } from '../utils/math'
import { ICandle } from '../types/candle.types'

export class ValueArea {
  private readonly nRows: number = 24
  private static VA_VOL_PERCENT = 0.7
  constructor() {
    moment.updateLocale('en', {
      week: {
        dow: 1 // Monday is the first day of the week.
      }
    })
  }
  sumVolumes(klines: ICandle[]) {
    let V_TOTAL: number = 0
    let highest: number = 0
    let lowest: number = Infinity

    for (let i = 0; i < klines.length; i++) {
      const volume: number = Number(klines[i].volume)
      const high: number = Number(klines[i].high)
      const low: number = Number(klines[i].low)
      V_TOTAL += volume

      if (high > highest) highest = high
      if (low < lowest) lowest = low
    }

    return { V_TOTAL: round(V_TOTAL), high: highest, low: lowest }
  }

  valueAreaHistogram(klines: ICandle[], highest: number, lowest: number, nDecimals: number) {
    let row = 0
    const range: number = highest - lowest
    const stepSize: number = round(range / this.nRows, nDecimals)

    if (range <= 0) return { histogram: null, POC: null, POC_ROW: null }

    const histogram: IVolumeRow[] = []
    let POC_ROW: number = 0
    let POC: number = 0
    let highestVolumeRow: number = 0
    while (histogram.length < this.nRows) {
      histogram.push({
        volume: 0,
        low: round(lowest + stepSize * row, nDecimals),
        mid: round(lowest + stepSize * row + stepSize / 2, nDecimals),
        high: round(lowest + stepSize * row + stepSize, nDecimals)
      } as IVolumeRow)
      row++
    }

    for (let i = 0; i < klines.length; i++) {
      const volume: number = Number(klines[i].volume)
      const high: number = Number(klines[i].high)
      const low: number = Number(klines[i].low)
      const close: number = Number(klines[i].close)
      const typicalPrice: number = round((high + low + close) / 3, nDecimals)
      const ROW: number = stepSize === 0 ? 0 : Math.min(this.nRows - 1, Math.floor((typicalPrice - lowest) / stepSize))

      histogram[ROW].volume += volume

      if (histogram[ROW].volume > highestVolumeRow) {
        highestVolumeRow = histogram[ROW].volume
        POC = histogram[ROW].mid
        POC_ROW = ROW
      }
    }
    return { histogram, POC, POC_ROW }
  }

  calcValueArea(POC_ROW: number, histogram: IVolumeRow[], V_TOTAL: number) {
    if (!POC_ROW || !histogram || !V_TOTAL) return { VAH: null, VAL: null }
    // 70% of the total volume
    const VA_VOL: number = V_TOTAL * ValueArea.VA_VOL_PERCENT

    // Set the upper / lower indices to the POC row to begin with
    // They will move up / down the histogram when adding the volumes
    let lowerIndex: number = POC_ROW
    let upperIndex: number = POC_ROW

    // The histogram bars
    const bars: number = histogram.length - 1

    // The volume area starts with the POC volume
    let volumeArea: number = histogram[POC_ROW].volume

    function isTargetVolumeReached(): boolean {
      return volumeArea >= VA_VOL
    }

    function getNextLowerBar(): number {
      return lowerIndex > 0 ? histogram[--lowerIndex].volume : 0
    }

    function getNextHigherBar(): number {
      return upperIndex < bars ? histogram[++upperIndex].volume : 0
    }

    function getDualPrices(goUp: boolean): number {
      return goUp ? getNextHigherBar() + getNextHigherBar() : getNextLowerBar() + getNextLowerBar()
    }

    function isAtBottomOfHistogram(): boolean {
      return lowerIndex <= 0
    }

    function isAtTopOfHistogram(): boolean {
      return upperIndex >= bars
    }

    do {
      const remainingLowerBars: number = Math.min(Math.abs(0 - lowerIndex), 2)
      const remainingUpperBars: number = Math.min(Math.abs(bars - upperIndex), 2)
      const lowerDualPrices: number = getDualPrices(false)
      const higherDualPrices: number = getDualPrices(true)

      if (lowerDualPrices > higherDualPrices) {
        volumeArea += lowerDualPrices
        if (!isAtTopOfHistogram() || remainingUpperBars) {
          // Upper dual prices aren't used, go back to original position
          upperIndex = Math.min(bars, upperIndex - remainingUpperBars)
        }
      } else if (higherDualPrices > lowerDualPrices) {
        volumeArea += higherDualPrices
        if (!isAtBottomOfHistogram() || remainingLowerBars) {
          // Lower dual prices aren't used, go back to original position
          lowerIndex = Math.max(0, lowerIndex + remainingLowerBars)
        }
      }
    } while (!isTargetVolumeReached() && !(isAtBottomOfHistogram() && isAtTopOfHistogram()))

    const VAL: number = histogram[lowerIndex].low
    const VAH: number = histogram[upperIndex].high
    return { VAH, VAL }
  }

  getLevelsForPeriod(data: ICandle[]): IValueArea {
    // We need to start at the start of the (day / week / month), in order to filter all the klines for the VA calculations for that period
    // current day vs previous day, current week vs previous week, current month vs previous month
    const { V_TOTAL, high, low }: { V_TOTAL: number; high: number; low: number } = this.sumVolumes(data)
    const nDecimals = Math.max(countDecimals(high), countDecimals(low))
    const EQ: number = round(low + (high - low) / 2, nDecimals)
    const { histogram, POC, POC_ROW }: { histogram: IVolumeRow[]; POC: number; POC_ROW: number } = this.valueAreaHistogram(
      data,
      high,
      low,
      nDecimals
    )
    const { VAH, VAL }: { VAH: number; VAL: number } = this.calcValueArea(POC_ROW, histogram, V_TOTAL)

    return { VAH, VAL, POC, EQ, low, high }
  }
}
