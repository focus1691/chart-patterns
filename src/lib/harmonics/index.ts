import { HARMONIC_PATTERNS, harmonicRatios } from '../../constants/harmonics'
import { IHarmonic, IXABCDPattern, IXABCDRatio } from '../../types/harmonics.types'
import { IZigZag } from '../../types/zigzags.types'
import { round } from '../../utils/math'

/**
 * Calculates the harmonic ratios between the specified points of a zigzag pattern.
 *
 * @param X The starting point of the XABCD pattern.
 * @param A The second point of the XABCD pattern.
 * @param B The third point of the XABCD pattern.
 * @param C The fourth point of the XABCD pattern.
 * @param D The fifth point of the XABCD pattern.
 * @returns An object representing the harmonic ratios and the XABCD pattern points.
 */
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

/**
 * Identifies harmonic patterns from an array of zigzag points.
 *
 * @param zigzags An array of zigzag points to analyse.
 * @returns An array of identified harmonic patterns.
 */
export function findHarmonicPatterns(zigzags: IZigZag[]): IHarmonic[] {
  const combinations = findXABCDCombinations(zigzags)
  const harmonics: IHarmonic[] = []

  for (const combination of combinations) {
    const [x, a, b, c, d] = combination.map((index) => zigzags[index])
    const xabcdPattern = calcHarmonicRatios(x, a, b, c, d)

    for (const patternType of Object.values(HARMONIC_PATTERNS)) {
      const harmonic = checkHarmonicPattern(patternType, xabcdPattern, harmonicRatios[patternType])
      if (harmonic) {
        harmonics.push(harmonic)
      }
    }
  }

  return harmonics
}

/**
 * Checks if a given XABCD pattern matches a specific harmonic pattern type based on predefined ratios.
 *
 * @param type The type of harmonic pattern to check against.
 * @param xabcdPattern The XABCD pattern to evaluate.
 * @param ratios The expected ratios for the specified harmonic pattern type.
 * @returns The harmonic pattern if a match is found, otherwise null.
 */
export function checkHarmonicPattern(type: HARMONIC_PATTERNS, xabcdPattern: IXABCDPattern, ratios: IXABCDRatio): IHarmonic | null {
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

/**
 * Generates all possible combinations of five points from an array of zigzag points to form potential XABCD patterns.
 *
 * @param zigzags An array of zigzag points to generate combinations from.
 * @returns An array of combinations, where each combination is an array of indices representing a potential XABCD pattern.
 */
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

/**
 * Determines if a combination of zigzag points can form a valid XABCD pattern.
 *
 * @param points An array of zigzag points to evaluate.
 * @returns True if the combination is valid for an XABCD pattern, false otherwise.
 */
function isValidCombination(points: IZigZag[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].direction === points[i + 1].direction) {
      return false
    }
  }
  return true
}

/**
 * Calculates the percentage error between a calculated value and its expected range.
 *
 * @param calculated The calculated value to evaluate.
 * @param expected_range An array representing the expected minimum and maximum range for the value.
 * @returns The percentage error of the calculated value relative to the expected range.
 */
function calculateError(calculated, expected_range) {
  if (calculated < expected_range[0]) {
    return Math.abs((calculated - expected_range[0]) / calculated) * 100
  } else if (calculated > expected_range[1]) {
    return Math.abs((calculated - expected_range[1]) / calculated) * 100
  } else {
    return 0
  }
}
