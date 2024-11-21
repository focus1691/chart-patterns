/**
 * Configuration object used for generating signals, particularly in the context of peak detection algorithms.
 *
 * @property {number[]} values - An array of numerical values (e.g., closing prices of candles) to be analysed.
 * @property {number} lag - The number of periods (or candles) that will be considered for calculating the moving average, which is used in signal detection.
 * @property {number} threshold - The threshold value for determining significant deviations from the moving average, used in identifying potential signals.
 * @property {number} influence - A factor that determines the influence of signals on subsequent calculations, affecting how strongly the identified signals affect the moving average.
 */
export interface ISignalsConfig {
  values: number[];
  lag: number;
  threshold: number;
  influence: number;
  flatten?: boolean;
  normaliseData?: boolean;
}
