import { ICandle } from '../types/candle.types'

export function round(number: number, precision: number = 2) {
  if (precision < 0) {
    const factor = Math.pow(10, precision)
    return Math.round(number * factor) / factor
  } else {
    return +(Math.round(Number(number + 'e+' + precision)) + 'e-' + precision)
  }
}

export function average(numbers: number[]) {
  return round(numbers.reduce((prev, curr) => Number(prev) + Number(curr)) / numbers.length, 3)
}

export const countDecimals = function (value: number): number {
  const text: string = value.toString()
  // verify if number 0.000005 is represented as "5e-6"
  if (text.indexOf('e-') > -1) {
    const [, trail] = text.split('e-')
    const deg: number = parseInt(trail, 10)
    return deg
  }
  // count decimals for number in representation like "0.123456"
  if (Math.floor(value) !== value) {
    return value.toString().split('.')[1].length || 0
  }
  return 0
}

export const getTicksFromPrice = (tpo: ICandle, priceType: string | number, tickSize: number): { up: number; down: number } => {
  const price = tpo[priceType]
  const high = tpo.high
  const low = tpo.low
  const down = low < price ? (price - low) / tickSize : 0
  const up = high > price ? (high - price) / tickSize : 0

  return { up, down }
}

export const isNumberString = (value) => {
  return !isNaN(value) && !isNaN(parseFloat(value))
}

export const getUTCPlusOneHour = (): number => {
  const currentDate = new Date()
  const currentUTCHour = currentDate.getUTCHours()
  const currentHourUTCPlusOne = (currentUTCHour + 1) % 24
  return currentHourUTCPlusOne
}

export function isPriceInRange(price: number, lowerBound: number, upperBound: number): boolean {
  return lowerBound <= price && price <= upperBound
}
