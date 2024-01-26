import { ITradeWindow } from '../types/levels.types'

export const isDST = (date: Date): boolean => {
  // DST in the UK starts on the last Sunday in March and ends on the last Sunday in October
  const march = new Date(date.getFullYear(), 2, 31)
  const october = new Date(date.getFullYear(), 9, 31)

  // Find last Sunday of March
  const startDST = new Date(march.setDate(31 - march.getDay()))
  // Find last Sunday of October
  const endDST = new Date(october.setDate(31 - october.getDay()))

  return date > startDST && date < endDST
}

export const isWithinTimeWindow = (window: ITradeWindow, timestamp: number): boolean => {
  // Create a date object using the timestamp
  const dateFromTimestamp = new Date(timestamp)

  // Convert it to GMT time
  const utcHour = dateFromTimestamp.getUTCHours()

  // Compare with the window hours
  return utcHour >= window.start && utcHour < window.end
}
