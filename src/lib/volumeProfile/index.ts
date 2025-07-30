import { IVolumeProfileSessionConfig } from '../../types';
import { BarVolumeProfileSession } from './candle';
import { TickVolumeProfileSession } from './rawTrades';

/**
 * Creates a new Volume Profile calculation session based on OHLC candles.
 *
 * A bar-based volume profile analyses price and volume data from candlesticks to identify
 * areas of significant trading activity. It helps visualize where the majority of trading
 * occurred within a given time period.
 *
 * @param config - Configuration options for the Volume Profile session
 * @param config.valueAreaRowSize - Number of price rows in the histogram (default: 24)
 * @param config.valueAreaVolume - Percentage of volume that defines the value area (default: 0.7 or 70%)
 * @param config.pricePrecision - Decimal precision for price values (default: 2)
 * @param config.volumePrecision - Decimal precision for volume values (default: 2)
 * @returns A new Bar-based Volume Profile session
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * // Create a volume profile session with default settings
 * const session = ta.VolumeProfile.createBarSession();
 *
 * // Create a session with custom settings
 * const customSession = ta.VolumeProfile.createBarSession({
 *   valueAreaRowSize: 24,
 *   valueAreaVolume: 0.7,
 *   pricePrecision: 2
 * });
 *
 * // Process candles
 * for (const candle of candles) {
 *   session.processCandle(candle);
 * }
 *
 * // Get value area
 * const valueArea = session.getValueArea();
 * // Result: { VAH: 36488.2, VAL: 35613.1, POC: 36439.58, EQ: 35613.1, low: 34446.3, high: 36779.9 }
 *
 * // Get full volume distribution including buy/sell volume per level
 * const distribution = session.getVolumeDistribution();
 *
 * // Reset the session
 * session.reset();
 * ```
 */
export function createBarSession(config?: IVolumeProfileSessionConfig): BarVolumeProfileSession {
  return new BarVolumeProfileSession(config);
}

/**
 * Creates a new Tick-based Volume Profile session for processing individual trades.
 *
 * A tick-based volume profile provides the most accurate analysis by processing individual trades
 * rather than aggregated candlestick data. This approach allows for precise identification of key
 * price levels where actual transactions occurred.
 *
 * @param config - Configuration options for the Volume Profile session
 * @param config.valueAreaRowSize - Number of price rows in the histogram (default: 24)
 * @param config.valueAreaVolume - Percentage of volume that defines the value area (default: 0.7 or 70%)
 * @param config.pricePrecision - Decimal precision for price values (default: 2)
 * @param config.volumePrecision - Decimal precision for volume values (default: 2)
 * @returns A new Tick-based Volume Profile session
 *
 * @example
 * ```typescript
 * import * as ta from 'chart-patterns';
 *
 * // Create a tick volume profile session
 * const session = ta.VolumeProfile.createTickSession();
 *
 * // Process individual trades
 * session.processTrade({
 *   price: 36500.25,
 *   volume: 1.5,
 *   isBuyer: true,
 *   time: new Date()
 * });
 *
 * // Or process multiple trades at once
 * session.processTrades(tradesArray);
 *
 * // Get value area (builds histogram only when needed)
 * const valueArea = session.getValueArea();
 *
 * // Get distribution with both histogram and exact price levels
 * const distribution = session.getVolumeDistribution();
 * // distribution.priceLevels contains exact price points with their volumes
 *
 * // Real-time processing example
 * socket.on('trade', trade => {
 *   session.processTrade(trade);
 * });
 *
 * // Get current value area without rebuilding histogram unnecessarily
 * setInterval(() => {
 *   const valueArea = session.getValueArea(); // auto-rebuilds only when needed
 *   console.log('Current Value Area:', valueArea);
 * }, 5000);
 *
 * // Reset the session
 * session.reset();
 * ```
 */
export function createTickSession(config?: IVolumeProfileSessionConfig): TickVolumeProfileSession {
  return new TickVolumeProfileSession(config);
}
