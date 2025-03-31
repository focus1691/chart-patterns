import { ZScoreOutput, ZScore } from '../zscores';
import { IPeak, IPeakRange } from '../../types/range.types';
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
 * Finds and groups signals representing peaks based on the provided configuration.
 *
 * @param {ISignalsConfig} signalsConfig - Configuration object for peak detection
 * @returns {IPeak[][] | IPeak[]} Peaks grouped by direction or flattened version if requested
 */
export function findSignals(signalsConfig: ISignalsConfig): IPeak[][] | IPeak[] {
  validateZScoreConfig(signalsConfig.config);
  
  const output: ZScoreOutput = ZScore.calc(
    signalsConfig.values, 
    signalsConfig.config
  );
  
  const signals: IPeak[] = output.signals
    .map((direction, position) => direction !== 0 && ({ position, direction } as IPeak))
    .filter(({ direction }) => Boolean(direction));
  
  const groupedSignals: IPeak[][] = groupSignalsByDirection(signals);

  if (signalsConfig.flatten) {
    const flattenedSignals: IPeak[] = groupedSignals.map((group) => group[0]); // (-1, -1, 1, 1, -1, -1) becomes -1, 1, -1
    return flattenedSignals;
  }

  return groupedSignals;
}

/**
 * Groups consecutive signals based on their direction to form distinct peak groups.
 *
 * @param {IPeak[]} peaks - An array of individual peak signals.
 * @returns {IPeak[][]} An array of grouped peak signals.
 */
function groupSignalsByDirection(peaks: IPeak[]): IPeak[][] {
  let lastSignal: IPeak;
  const groupedSignals: IPeak[][] = [];

  for (let i = 0; i < peaks.length; i++) {
    if (peaks[i].direction === lastSignal?.direction) {
      groupedSignals[groupedSignals.length - 1].push(peaks[i]);
    } else {
      groupedSignals.push([peaks[i]]);
      lastSignal = peaks[i];
    }
  }
  return groupedSignals;
}

/**
 * Converts groups of peak signals into ranges, capturing the start and end timestamps of each peak.
 *
 * @param {IPeak[][]} groupedSignals - Groups of peak signals.
 * @param {number[]} timestamps - Array of timestamps corresponding to each data point.
 * @returns {IPeakRange[]} An array of peak ranges, each with a direction, start, and end timestamp.
 */
export function getPeakRanges(groupedSignals: IPeak[][], timestamps: number[]): IPeakRange[] {
  const peakRanges: IPeakRange[] = [];

  for (let i = 0; i < groupedSignals.length; i++) {
    const nSignals = groupedSignals[i].length;
    const { position, direction }: IPeak = groupedSignals[i][0];
    const lastPeakPos = groupedSignals[i][nSignals - 1]?.position;
    const peakRange = { direction, start: timestamps[position], end: timestamps[lastPeakPos] } as IPeakRange;
    peakRanges.push(peakRange);
  }
  return peakRanges;
}
