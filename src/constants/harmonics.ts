import { IXABCDRatio } from '../types/harmonics.types';

export enum HARMONIC_PATTERNS {
  BAT = 'bat',
  GARTLEY = 'gartley',
  BUTTERFLY = 'butterfly',
  CRAB = 'crab',
  DEEP_CRAB = 'deep_crab',
  CYPHER = 'cypher',
  SHARK = 'shark'
}

export const BAT_RATIOS: IXABCDRatio = Object.freeze({
  XAB: [0.382, 0.5] as [number, number],
  ABC: [0.382, 0.886] as [number, number],
  BCD: [1.618, 2.618] as [number, number],
  XAD: [0.886, 0.886] as [number, number]
});

export const GARTLEY_RATIOS: IXABCDRatio = Object.freeze({
  XAB: [0.618, 0.618] as [number, number],
  ABC: [0.382, 0.886] as [number, number],
  BCD: [1.13, 1.618] as [number, number],
  XAD: [0.786, 0.786] as [number, number]
});

export const BUTTERFLY_RATIOS: IXABCDRatio = Object.freeze({
  XAB: [0.786, 0.786] as [number, number],
  ABC: [0.5, 0.886] as [number, number],
  BCD: [1.618, 2.24] as [number, number],
  XAD: [1.27, 1.27] as [number, number]
});

export const CRAB_RATIOS: IXABCDRatio = Object.freeze({
  XAB: [0.382, 0.886] as [number, number],
  ABC: [0.382, 0.886] as [number, number],
  BCD: [2.618, 3.618] as [number, number],
  XAD: [1.618, 1.618] as [number, number]
});

export const DEEP_CRAB_RATIOS: IXABCDRatio = Object.freeze({
  XAB: [0.886, 0.886] as [number, number],
  ABC: [0.382, 0.886] as [number, number],
  BCD: [2.0, 3.618] as [number, number],
  XAD: [1.618, 1.618] as [number, number]
});

export const CYPHER_RATIOS: IXABCDRatio = Object.freeze({
  XAB: [0.382, 0.618] as [number, number],
  ABC: [1.13, 1.41] as [number, number],
  BCD: [1.272, 2.0] as [number, number],
  XAD: [1.13, 1.414] as [number, number]
});

export const SHARK_RATIOS: IXABCDRatio = Object.freeze({
  XAB: [1.13, 1.618] as [number, number],
  ABC: [1.13, 1.13] as [number, number],
  BCD: [0.5, 0.5] as [number, number],
  XAD: [0.886, 1.13] as [number, number]
});

export const harmonicRatios = Object.freeze({
  [HARMONIC_PATTERNS.BAT]: BAT_RATIOS,
  [HARMONIC_PATTERNS.GARTLEY]: GARTLEY_RATIOS,
  [HARMONIC_PATTERNS.BUTTERFLY]: BUTTERFLY_RATIOS,
  [HARMONIC_PATTERNS.CRAB]: CRAB_RATIOS,
  [HARMONIC_PATTERNS.DEEP_CRAB]: DEEP_CRAB_RATIOS,
  [HARMONIC_PATTERNS.CYPHER]: CYPHER_RATIOS,
  [HARMONIC_PATTERNS.SHARK]: SHARK_RATIOS
});
