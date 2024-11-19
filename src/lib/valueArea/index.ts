import { ICandle } from '../../types/candle.types'
import { IValueArea, IVolumeRow } from '../../types/valueArea.types'
import { countDecimals, round } from '../../utils/math'

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
    const low = Math.max(lowest, round(lowest + stepSize * row, nDecimals))
    const high = Math.min(highest, round(lowest + stepSize * row + stepSize, nDecimals))
    const mid = round((low + high) / 2, nDecimals)

    histogram.push({
      volume: 0,
      low,
      mid,
      high
    } as IVolumeRow)

    row++
  }

  for (let i = 0; i < klines.length; i++) {
    const volume: number = Number(klines[i].volume)
    const open: number = Number(klines[i].open)
    const high: number = Number(klines[i].high)
    const low: number = Number(klines[i].low)
    const close: number = Number(klines[i].close)
    const typicalPrice: number = round((open + high + low + close) / 4, nDecimals)
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
  const VALUE_AREA_PERCENTAGE = 0.7 // 70% for the value area
  const VALUE_AREA_VOLUME = VALUE_AREA_PERCENTAGE * V_TOTAL

  let currentVolume = histogram[POC_ROW].volume
  let lowerIndex = POC_ROW
  let upperIndex = POC_ROW

  while (currentVolume < VALUE_AREA_VOLUME) {
    const lowerVolume = lowerIndex > 0 ? histogram[lowerIndex - 1].volume : 0
    const upperVolume = upperIndex < histogram.length - 1 ? histogram[upperIndex + 1].volume : 0

    if (lowerVolume === 0 && lowerIndex > 0) {
      // If lower volume is 0, skip to the next lower row
      lowerIndex--
    } else if (upperVolume === 0 && upperIndex < histogram.length - 1) {
      // If upper volume is 0, skip to the next upper row
      upperIndex++
    } else if (lowerVolume > upperVolume && lowerIndex > 0) {
      // Expand to the side with higher volume
      lowerIndex--
      currentVolume += histogram[lowerIndex].volume
    } else if (upperIndex < histogram.length - 1) {
      upperIndex++
      currentVolume += histogram[upperIndex].volume
    } else {
      break // Stop if no more rows to expand
    }
  }

  // Determine VAL and VAH
  const VAL = histogram[lowerIndex].high
  const VAH = histogram[upperIndex].low

  return { VAL, VAH }
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
  const maxDecimals: number = Math.max(countDecimals(high), countDecimals(low))
  const EQ: number = round(low + (high - low) / 2, maxDecimals)
  const { histogram, POC, POC_ROW }: { histogram: IVolumeRow[]; POC: number; POC_ROW: number } = buildHistogram(candles, high, low, maxDecimals)
  const { VAH, VAL }: { VAH: number; VAL: number } = findValueAreas(POC_ROW, histogram, V_TOTAL)

  return { VAH, VAL, POC, EQ, low, high }
}
