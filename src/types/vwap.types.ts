/**
 * Interface representing VWAP calculation result with standard deviation bands.
 * 
 * @interface VWAPResult
 */
export interface VWAPResult {
  /** 
   * The main VWAP (Volume-Weighted Average Price) value.
   * Null if no data has been processed.
   */
  vwap: number | null;
  
  /** 
   * Upper band calculated as VWAP + (standardDeviation * deviationMultiplier).
   * Null if insufficient data for standard deviation calculation.
   */
  upperBand: number | null;
  
  /** 
   * Lower band calculated as VWAP - (standardDeviation * deviationMultiplier).
   * Null if insufficient data for standard deviation calculation.
   */
  lowerBand: number | null;
} 