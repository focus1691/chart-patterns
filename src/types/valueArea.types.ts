export enum VALUE_AREA {
  HIGH = 'high',
  VAH = 'vah',
  POC = 'poc',
  EQ = 'eq',
  VAL = 'val',
  LOW = 'low'
}

export interface IVolumeRow {
  volume: number
  low: number
  high: number
  mid: number
}

export interface IValueArea {
  high: number
  VAH: number
  POC: number
  EQ: number
  VAL: number
  low: number
}

export enum VALUE_AREA_PERIODS {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum VALUE_AREA_TENSE {
  PREVIOUS = 'previous',
  CURRENT = 'current'
}

export interface INakedPointOfControl {
  resistance?: number
  support?: number
}
