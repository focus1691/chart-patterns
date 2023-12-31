/**
 * Represents a row in a volume profile histogram.
 */
export interface IVolumeRow {
  volume: number
  low: number
  high: number
  mid: number
}

/**
 * Describes the value area of a market profile.
 */
export interface IValueArea {
  high: number
  VAH: number
  POC: number
  EQ: number
  VAL: number
  low: number
}

/**
 * Represents the naked points of control with resistance and support levels.
 */
export interface INakedPointOfControl {
  resistance?: number
  support?: number
}
