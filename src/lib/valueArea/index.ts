import moment from 'moment'
import { ICandle } from '../../types/candle.types'
import { IValueArea, IVolumeRow } from '../../types/valueArea.types'
import { countDecimals, round } from '../../utils/math'

moment.updateLocale('en', {
  week: {
    dow: 1 // Monday is the first day of the week.
  }
})

/**
 * The number of rows used for the histogram calculation.
 */
const N_ROWS: number = 24

/**
 * The percentage of total volume that defines the value area.
 */
const VA_VOL_PERCENT: number = 0.7

/**
 * Calculates the total volume, highest price, and lowest price from an array of candlesticks.
 *
 * @param klines An array of candlesticks to analyse.
 * @returns An object containing the total volume (V_TOTAL), highest price, and lowest price of the given candlesticks.
 */
function sumVolumes(klines: ICandle[]) {
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

/**
 * Generates a histogram for value area calculation and identifies the Point of Control (POC) and its corresponding row.
 *
 * @param klines An array of candlesticks to analyse.
 * @param highest The highest price in the range of candlesticks.
 * @param lowest The lowest price in the range of candlesticks.
 * @param nDecimals The number of decimal places to consider in calculations.
 * @returns An object containing the histogram, the price of the Point of Control (POC), and the row of the POC.
 */
function buildHistogram(klines: ICandle[], highest: number, lowest: number, nDecimals: number) {
  let row = 0
  const range: number = highest - lowest
  const stepSize: number = round(range / N_ROWS, nDecimals)

  if (range <= 0) return { histogram: null, POC: null, POC_ROW: null }

  const histogram: IVolumeRow[] = []
  let POC_ROW: number = 0
  let POC: number = 0
  let highestVolumeRow: number = 0
  while (histogram.length < N_ROWS) {
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
    const ROW: number = stepSize === 0 ? 0 : Math.min(N_ROWS - 1, Math.floor((typicalPrice - lowest) / stepSize))

    histogram[ROW].volume += volume

    if (histogram[ROW].volume > highestVolumeRow) {
      highestVolumeRow = histogram[ROW].volume
      POC = histogram[ROW].mid
      POC_ROW = ROW
    }
  }
  return { histogram, POC, POC_ROW }
}

/**
 * Calculates the Value Area High (VAH) and Value Area Low (VAL) based on the histogram and total volume.
 *
 * @param POC_ROW The row number of the Point of Control in the histogram.
 * @param histogram An array of volume rows representing the histogram.
 * @param V_TOTAL The total volume of the candlesticks.
 * @returns An object containing the Value Area High (VAH) and Value Area Low (VAL).
 */
function findValueAreas(POC_ROW: number, histogram: IVolumeRow[], V_TOTAL: number) {
  if (!POC_ROW || !histogram || !V_TOTAL) return { VAH: null, VAL: null }
  // 70% of the total volume
  const VA_VOL: number = V_TOTAL * VA_VOL_PERCENT

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

/**
 * analyses a set of candlesticks to calculate the value area and related metrics for a specific period.
 *
 * @param candles An array of candlesticks for the period to analyse.
 * @returns An object representing the value area metrics, including VAH, VAL, POC, EQ (Equilibrium), and the low and high prices.
 */
export function calculate(candles: ICandle[]): IValueArea {
  // We need to start at the start of the (day / week / month), in order to filter all the klines for the VA calculations for that period
  // current day vs previous day, current week vs previous week, current month vs previous month
  const { V_TOTAL, high, low }: { V_TOTAL: number; high: number; low: number } = sumVolumes(candles)
  const nDecimals: number = Math.max(countDecimals(high), countDecimals(low))
  const EQ: number = round(low + (high - low) / 2, nDecimals)
  const { histogram, POC, POC_ROW }: { histogram: IVolumeRow[]; POC: number; POC_ROW: number } = buildHistogram(candles, high, low, nDecimals)
  const { VAH, VAL }: { VAH: number; VAL: number } = findValueAreas(POC_ROW, histogram, V_TOTAL)

  return { VAH, VAL, POC, EQ, low, high }
}
