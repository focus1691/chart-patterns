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

  // Get UTC hour, minutes, and seconds
  const utcHour = dateFromTimestamp.getUTCHours()
  const utcMinutes = dateFromTimestamp.getUTCMinutes()
  const utcSeconds = dateFromTimestamp.getUTCSeconds()

  // Check if the time is exactly at the start of the hour for single hour windows
  if (window.start === window.end) {
    return utcHour === window.start && utcMinutes === 0 && utcSeconds === 0
  } else {
    // Check if the hour is within the specified range for multi-hour windows
    return utcHour >= window.start && utcHour <= window.end
  }
}
