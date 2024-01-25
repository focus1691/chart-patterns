import { ICandle } from '../types/candle.types'
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

export const isInitialBalanceFormed = (candle: ICandle): boolean => {
  // Check if DST is in effect for openTime and closeTime
  const dstAdjustment = isDST(candle.openTime) ? 60 * 60 * 1000 : 0

  // Adjust openTime and closeTime for UTC+1 if DST is in effect
  const adjustedOpenTime = new Date(candle.openTime.getTime() + dstAdjustment)
  const adjustedCloseTime = new Date(candle.closeTime.getTime() + dstAdjustment)

  // Extract hours and minutes from adjusted times
  const openHour = adjustedOpenTime.getUTCHours()
  const openMinutes = adjustedOpenTime.getUTCMinutes()
  const closeHour = adjustedCloseTime.getUTCHours()
  const closeMinutes = adjustedCloseTime.getUTCMinutes()

  // Check if the candle is within the 00:30 - 01:00 UTC+1 interval
  if (openHour === 0 && openMinutes >= 30 && closeHour === 0 && closeMinutes <= 59) {
    return true
  }

  return false
}

export const isWithinTimeWindow = (window: ITradeWindow, timestamp: number): boolean => {
  // Create a date object using the timestamp
  const dateFromTimestamp = new Date(timestamp)

  // Convert it to GMT time
  const utcHour = dateFromTimestamp.getUTCHours()

  // Compare with the window hours
  return utcHour >= window.start && utcHour < window.end
}
