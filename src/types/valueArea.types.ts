export interface IVolumeRow {
  volume: number;
  low: number;
  high: number;
  mid: number;
}

export interface IValueArea {
  high: number;
  VAH: number;
  POC: number;
  EQ: number;
  VAL: number;
  low: number;
}

export interface INakedPointOfControl {
  resistance?: number;
  support?: number;
}
