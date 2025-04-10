import { ZScoreOutput, ZScore } from '../zscores';
import { IPeak } from '../../types/range.types';
import { ISignalsConfig, IZScoreConfig } from '../../types/peakDetector.types';

/**
 * Validates the Z-Score configuration parameters
 *
 * @param {IZScoreConfig} config - Configuration object containing Z-Score parameters
 * @throws Error if required parameters are missing or invalid
 */
function validateZScoreConfig(config: IZScoreConfig): void {
  if (!config.lag || !config.threshold || !config.influence)
    throw new Error('Parameter(s) required: lag, threshold, influence');

  if (config.influence < 0 || config.influence > 1)
    throw new Error("'influence' should be between 0 - 1");
}

/**
 * Finds signals representing significant changes or anomalies in a numeric time series.
 * 
 * The function uses Z-Score based peak detection to identify periods where values
 * deviate significantly from the moving average, indicating potential 
 * market turning points or trend changes.
 *
 * @param {ISignalsConfig} signalsConfig - Configuration object for peak detection containing:
 *   - values: Array of numerical values to analyze (typically closing prices)
 *   - config: Z-Score algorithm parameters (lag, threshold, influence)
 * 
 * @returns {IPeak[]} An array of detected peaks with their positions and directions:
 *   - position: Index in the original array where the signal was detected
 *   - direction: 1 for bullish (upward) signals, -1 for bearish (downward) signals
 * 
 * @example
 * ```ts
 * const peaks = findSignals({
 *   values: [101, 102, 99, 101, 102, 107, 109, 105, 102, 100, 97, 95, 97],
 *   config: { lag: 5, threshold: 2.5, influence: 0.5 }
 * });
 * ```
 */
export function findSignals(signalsConfig: ISignalsConfig): IPeak[] {
  validateZScoreConfig(signalsConfig.config);

  const output: ZScoreOutput = ZScore.calc(
    signalsConfig.values,
    signalsConfig.config
  );

  const signals: IPeak[] = output.signals
    .map((direction, position) => direction !== 0 && ({ position, direction } as IPeak))
    .filter(({ direction }) => Boolean(direction));

  return signals;
}
