export function round(number: number, decimalPlaces: number = 2) {
  const factor = Math.pow(10, decimalPlaces)
  return Math.round(number * factor) / factor
}

export const countDecimals = function (value: number): number {
  if (Math.floor(value) === value) return 0
  return value.toString().split('.')[1].length || 0
}
