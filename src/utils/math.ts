export function round(number: number, decimalPlaces: number = 2) {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(number * factor) / factor;
}

export const countDecimals = function (value: number): number {
  if (Math.floor(value) === value) return 0;
  return value.toString().split('.')[1].length || 0;
};

export const isBetween =
  (a: number) =>
  (b: number) =>
  (num: number): boolean => {
    const [min, max] = [a, b].sort((x, y) => x - y);
    return num >= min && num <= max;
  };
