/**
 * Configuration for Z-Score based algorithms and peak detection
 * 
 * @property {number} lag - The number of periods used for calculating the moving average and standard deviation.
 * Controls how much data is smoothed and how adaptive the algorithm is to long-term changes.
 * Higher values improve robustness for stationary data; lower values allow quicker adaptation to trends.
 * 
 * @property {number} threshold - The number of standard deviations from the moving mean required to classify
 * a new datapoint as a signal. Higher values decrease sensitivity (fewer signals); lower values
 * increase sensitivity (more signals).
 * 
 * @property {number} influence - Factor determining how strongly identified signals affect subsequent
 * calculations (0-1). At 0, signals don't influence the threshold. At 1, signals fully influence
 * the threshold. Use higher values when signals may cause structural shifts in data trends.
 */
export interface IZScoreConfig {
  lag: number;
  threshold: number;
  influence: number;
  normaliseData?: boolean;
}

/**
 * Configuration object used for generating signals, particularly in the context of peak detection algorithms.
 *
 * @property {number[]} values - An array of numerical values (e.g., closing prices of candles) to be analysed.
 * @property {IZScoreConfig} config - Configuration parameters for the Z-Score algorithm.
 * @property {boolean} flatten - Whether to flatten grouped signals into a single signal per direction change.
 */
export interface ISignalsConfig {
  values: number[];
  config: IZScoreConfig;
  flatten?: boolean;
}
