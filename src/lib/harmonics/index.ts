import { HARMONIC_PATTERNS } from '../../constants/harmonics'
import { IHarmonic, IXABCDPattern, IXABCDRatio } from '../../types/harmonics.types'
import { IZigZag } from '../../types/zigzags.types'
import { round } from '../../utils/math'

export function calcHarmonicRatios(X: IZigZag, A: IZigZag, B: IZigZag, C: IZigZag, D: IZigZag): IXABCDPattern {
  const XA: number = Math.abs(X.price - A.price)
  const AB: number = Math.abs(A.price - B.price)
  const BC: number = Math.abs(B.price - C.price)
  const CD: number = Math.abs(C.price - D.price)
  const XD: number = Math.abs(X.price - D.price)

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

  let XAB_ERROR = 0
  if (XAB < minXAB || XAB > maxXAB) {
    XAB_ERROR = Math.abs((XAB - minXAB) / XAB) * 100 + Math.abs((XAB - maxXAB) / XAB) * 100
  }

  let ABC_ERROR = 0
  if (ABC === minABC || ABC === maxABC) {
    ABC_ERROR = 0
  } else if (ABC < minABC || ABC > maxABC) {
    ABC_ERROR = Math.abs((ABC - minABC) / ABC) * 100 + Math.abs((ABC - maxABC) / ABC) * 100
  }

  let BCD_ERROR = 0
  if (BCD < minBCD || BCD > maxBCD) {
    BCD_ERROR = Math.abs((BCD - minBCD) / BCD) * 100 + Math.abs((BCD - maxBCD) / BCD) * 100
  }

  let XAD_ERROR = 0
  if (XAD < minXAD || XAD > maxXAD) {
    XAD_ERROR = Math.abs((XAD - minXAD) / XAD) * 100 + Math.abs((XAD - maxXAD) / XAD) * 100
  }

  const totalError = XAB_ERROR + ABC_ERROR + BCD_ERROR + XAD_ERROR
  if (totalError === 0) {
    return {
      ...xabcdPattern,
      error: totalError,
      type
    }
  }
  return null
}

export function findXABCDCombinations(zigzags: IZigZag[]): number[][] {
  const combinations: number[][] = []

  for (let i = 0; i < zigzags.length - 4; i++) {
    for (let j = i + 1; j < zigzags.length - 3; j++) {
      for (let k = j + 1; k < zigzags.length - 2; k++) {
        for (let l = k + 1; l < zigzags.length - 1; l++) {
          for (let m = l + 1; m < zigzags.length; m++) {
            if (isValidCombination([zigzags[i], zigzags[j], zigzags[k], zigzags[l], zigzags[m]])) {
              combinations.push([i, j, k, l, m])
            }
          }
        }
      }
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
