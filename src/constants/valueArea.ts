/**
 * Enumerates different components of a market's value area.
 */
export enum VALUE_AREA {
  HIGH = 'high',
  VAH = 'vah',
  POC = 'poc',
  EQ = 'eq',
  VAL = 'val',
  LOW = 'low'
}

/**
 * Enumerates the time periods for analyzing the value area in market profile theory.
 */
export enum VALUE_AREA_PERIODS {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * Enumerates the temporal context (current or previous) for analyzing the value area.
 */
export enum VALUE_AREA_TENSE {
  PREVIOUS = 'previous',
  CURRENT = 'current'
}
