import { ZScoreOutput, ZScore } from '../zscores';
import { IPeak } from '../../types/range.types';
import { IZScoreConfig } from '../../types/zScore.types';

/**
 * Validates the Z-Score configuration parameters
 *
 * @param {IZScoreConfig} config - Configuration object containing Z-Score parameters
 * @throws Error if required parameters are missing or invalid
 */
function validateZScoreConfig(config: IZScoreConfig): void {
  if (!config.lag || !config.threshold || !config.influence) {
    throw new Error('Parameter(s) required: lag, threshold, influence');
  }

  if (config.influence < 0 || config.influence > 1) {
    throw new Error("'influence' should be between 0 - 1");
  }
}

/**
 * Finds signals representing significant changes or anomalies in a numeric time series.
 *
 * The function uses Z-Score based peak detection to identify periods where values
 * deviate significantly from the moving average, indicating potential
 * market turning points or trend changes.
 *
 * @param {number[]} values - Array of numerical values to analyse (typically closing prices)
 * @param {IZScoreConfig} zScoreConfig - Z-Score algorithm parameters containing:
 *   - lag: Number of previous observations to use for calculating moving average
 *   - threshold: Z-Score threshold for signal detection
 *   - influence: Weight of new signals on the algorithm (0-1)
 *
 * @returns {IPeak[]} An array of detected peaks with their positions and directions:
 *   - position: Index in the original array where the signal was detected
 *   - direction: 1 for bullish (upward) signals, -1 for bearish (downward) signals
 *
 * @example
 * ```ts
 * const peaks = findSignals(
 *   [101, 102, 99, 101, 102, 107, 109, 105, 102, 100, 97, 95, 97],
 *   { lag: 5, threshold: 2.5, influence: 0.5 }
 * );
 * ```
 */
export function findSignals(values: number[], zScoreConfig: IZScoreConfig): IPeak[] {
  validateZScoreConfig(zScoreConfig);

  const output: ZScoreOutput = ZScore.calc(values, zScoreConfig);

  const signals: IPeak[] = output.signals.flatMap((direction, position) => (direction !== 0 ? [{ position, direction } as IPeak] : []));

  return signals;
}
