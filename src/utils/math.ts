import { ICandle } from '../types/candle.types'

export function round(number: number, decimalPlaces: number = 2) {
  const factor = Math.pow(10, decimalPlaces)
  return Math.round(number * factor) / factor
}

export function average(numbers: number[]) {
  return round(numbers.reduce((prev, curr) => Number(prev) + Number(curr)) / numbers.length, 3)
}

export const countDecimals = function (value: number): number {
  if (Math.floor(value) === value) return 0
  return value.toString().split('.')[1].length || 0
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
