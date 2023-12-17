import { HARMONIC_PATTERNS } from '../../constants/harmonics'
import { IHarmonic, IXABCDPattern, IXABCDRatio } from '../../types/harmonics.types'
import { IZigZag } from '../../types/zigzags.types'
import { round } from '../../utils/math'

export function calcHarmonicRatios(X: IZigZag, A: IZigZag, B: IZigZag, C: IZigZag, D: IZigZag): IXABCDPattern {
  const XA: number = Math.round(Math.abs(X.price - A.price))
  const AB: number = Math.round(Math.abs(A.price - B.price))
  const BC: number = Math.round(Math.abs(B.price - C.price))
  const CD: number = Math.round(Math.abs(C.price - D.price))
  const XD: number = Math.round(Math.abs(X.price - D.price))

  const XAB: number = round(AB / XA)
  const ABC: number = round(BC / AB)
  const BCD: number = round(CD / BC)
  const XAD: number = round(XD / XA)

  const XABCD = { X, A, B, C, D, XAB, ABC, BCD, XAD } as IXABCDPattern

  return XABCD
}

export function findHarmonics(type: HARMONIC_PATTERNS, xabcdPattern: IXABCDPattern, ratios: IXABCDRatio): IHarmonic | null {
  const { XAB, ABC, BCD, XAD } = xabcdPattern
  const {
    XAB: [minXAB, maxXAB],
    ABC: [minABC, maxABC],
    BCD: [minBCD, maxBCD],
    XAD: [minXAD, maxXAD]
  } = ratios

  const XAB_ERROR: number = round(calculateError(XAB, [minXAB, maxXAB]))
  const ABC_ERROR: number = round(calculateError(ABC, [minABC, maxABC]))
  const BCD_ERROR: number = round(calculateError(BCD, [minBCD, maxBCD]))
  const XAD_ERROR: number = round(calculateError(XAD, [minXAD, maxXAD]))

  const totalError: number = round(XAB_ERROR + ABC_ERROR + BCD_ERROR + XAD_ERROR)
  const isComplete: boolean = typeof XAB === 'number' && typeof ABC === 'number' && typeof BCD === 'number' && typeof XAD === 'number'
  const isDeveloping: boolean = !isComplete && typeof XAB === 'number' && typeof ABC === 'number' && typeof BCD === 'number'
  const lastTimestamp: number = isDeveloping ? xabcdPattern.C.timestamp : xabcdPattern.D?.timestamp ?? null

  if ((totalError < 50 && isComplete) || isDeveloping) {
    return {
      ...xabcdPattern,
      error: totalError,
      type,
      isDeveloping,
      lastTimestamp
    }
  }
  return null
}

export function findXABCDCombinations(zigzags: IZigZag[]): number[][] {
  const combinations: number[][] = []

  for (let i = 0; i < zigzags.length - 4; i++) {
    const potentialCombination = [i, i + 1, i + 2, i + 3, i + 4]
    if (
      isValidCombination([
        zigzags[potentialCombination[0]],
        zigzags[potentialCombination[1]],
        zigzags[potentialCombination[2]],
        zigzags[potentialCombination[3]],
        zigzags[potentialCombination[4]]
      ])
    ) {
      combinations.push(potentialCombination)
    }
  }

  return combinations
}

function isValidCombination(points: IZigZag[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].direction === points[i + 1].direction) {
      return false
    }
  }
  return true
}

function calculateError(calculated, expected_range) {
  if (calculated < expected_range[0]) {
    return Math.abs((calculated - expected_range[0]) / calculated) * 100
  } else if (calculated > expected_range[1]) {
    return Math.abs((calculated - expected_range[1]) / calculated) * 100
  } else {
    return 0
  }
}
