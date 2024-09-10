import { round } from '../../utils/math'

export class ZScoreOutput {
  input: number[]
  signals: number[]
  avgFilter: number[]
  filtered_stddev: number[]
  peakCount: number = 0
}

export class ZScore {
  public static calc(input: number[], lag: number, threshold: number, influence: number, normaliseData?: boolean): ZScoreOutput {
    if (normaliseData) {
      // For input with negative values
      input = ZScore.normaliseData(input);
    }

    const result: ZScoreOutput = new ZScoreOutput()
    const signals: number[] = Array(input.length).fill(0)
    const filteredY: number[] = input.slice(0)
    const avgFilter = Array(input.length).fill(0)
    const stdFilter = Array(input.length).fill(0)
    let inPeak: boolean = true

    const initialWindow = filteredY.slice(0, lag)

    avgFilter[lag - 1] = ZScore.avg(initialWindow)
    stdFilter[lag - 1] = ZScore.stdDev(initialWindow)

    for (let i: number = lag; i < input.length; i++) {
      if (Math.abs(input[i] - avgFilter[i - 1]) > threshold * stdFilter[i - 1]) {
        signals[i] = (input[i] > avgFilter[i - 1]) ? 1 : -1
        filteredY[i] = influence * input[i] + (1 - influence) * filteredY[i - 1]

        inPeak = true
      } else {
        signals[i] = 0
        filteredY[i] = input[i]

        if (inPeak) {
          result.peakCount++
          inPeak = false
        }
      }

      // Update rolling average and deviation
      const slidingWindow = filteredY.slice(i - lag + 1, i + 1)

      avgFilter[i] = ZScore.avg(slidingWindow)
      stdFilter[i] = ZScore.stdDev(slidingWindow)
    }

    // Copy to convenience class
    result.input = input
    result.avgFilter = avgFilter
    result.signals = signals
    result.filtered_stddev = stdFilter

    return result
  }

  private static sum(values: number[]): number {
    return values.reduce((partial_sum, a) => partial_sum + a)
  }

  private static avg(values: number[]): number {
    let avg: number = 0

    if (values && values.length) {
      const sum = ZScore.sum(values)
      avg = sum / values.length
    }

    return round(avg)
  }

  private static stdDev(values: number[]): number {
    let stdDev: number = 0

    if (values && values.length) {
      const avg: number = ZScore.avg(values)

      const squareDiffs: number[] = values.map((value) => {
        const diff: number = value - avg
        const sqrDiff: number = diff * diff
        return sqrDiff
      })

      const avgSquareDiff: number = ZScore.avg(squareDiffs)

      stdDev = Math.sqrt(avgSquareDiff)
    }

    return round(stdDev)
  }

  private static normaliseData(data: number[]): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    return data.map(value => (value - min) / (max - min));
  }
}
