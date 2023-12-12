
import { ZScoreOutput, ZScore } from '../zscores'
import { IPeak, IPeakRange } from '../range/range.types'

export class PeakDetector {
  public lag: number = 5
  public threshold: number = 2
  public influence: number = 0.3

  constructor(lag: number, threshold: number, infleunce: number) {
    this.lag = lag
    this.threshold = threshold
    this.influence = infleunce
  }

  public findSignals(values: number[]): IPeak[][] {
    const output: ZScoreOutput = ZScore.calc(values, this.lag, this.threshold, this.influence)
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
