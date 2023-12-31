
import { ZScoreOutput, ZScore } from '../zscores'
import { IPeak, IPeakRange } from '../../types/range.types'
import { ISignalsConfig } from '../../types/peakDetector.types'

export default class PeakDetector {
  private validateInput(config: ISignalsConfig): void {
    if (!config.lag || !config.threshold || !config.influence) throw new Error('Parameter(s) required: lag, threshold, influence')
    if (config.influence < 0 || config.influence > 1) throw new Error('\'influence\' should be between 0 - 1')
  }

  public findSignals(config: ISignalsConfig): IPeak[][] {
    this.validateInput(config)
    const output: ZScoreOutput = ZScore.calc(config.values, config.lag, config.threshold, config.influence)
    const signals: IPeak[] = output.signals
      .map((direction, position) => direction !== 0 && ({ position, direction } as IPeak))
      .filter(({ direction }) => Boolean(direction))
    const groupedSignals: IPeak[][] = this.groupSignalsByDirection(signals)
    return groupedSignals
  }

  public groupSignalsByDirection(peaks: IPeak[]): IPeak[][] {
    let lastSignal: IPeak
    const groupedSignals: IPeak[][] = []

    for (let i = 0; i < peaks.length; i++) {
      if (peaks[i].direction === lastSignal?.direction) {
        groupedSignals[groupedSignals.length - 1].push(peaks[i])
      } else {
        groupedSignals.push([peaks[i]])
        lastSignal = peaks[i]
      }
    }
    return groupedSignals
  }

  public getPeakRanges(groupedSignals: IPeak[][], timestamps: number[]): IPeakRange[] {
    const peakRanges: IPeakRange[] = []

    for (let i = 0; i < groupedSignals.length; i++) {
      const nSignals = groupedSignals[i].length
      const { position, direction }: IPeak = groupedSignals[i][0]
      const lastPeakPos = groupedSignals[i][nSignals - 1]?.position
      const peakRange = { direction, start: timestamps[position], end: timestamps[lastPeakPos] } as IPeakRange
      peakRanges.push(peakRange)
    }
    return peakRanges
  }
}
