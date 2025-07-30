import { ITrade, IValueArea, IVolumeRow, IVolumeProfileSessionConfig, IRawTradeVolumeDistribution } from '../../types';
import Decimal from 'decimal.js';

/**
 * A volume profile session that processes raw trade data for maximum accuracy.
 *
 * This class builds volume profiles directly from individual trades rather than
 * aggregated candlestick data. This approach provides a more accurate representation
 * of exactly where trading activity occurred, particularly useful for high-frequency
 * trading analysis, market microstructure studies, and real-time monitoring.
 */
export class TickVolumeProfileSession {
  private valueAreaRowSize: number;
  private valueAreaVolume: number;
  private histogram: IVolumeRow[] = [];
  private totalVolume: Decimal = new Decimal(0);
  private buyVolume: Decimal = new Decimal(0);
  private sellVolume: Decimal = new Decimal(0);
  private highestPrice: Decimal = new Decimal(-Infinity);
  private lowestPrice: Decimal = new Decimal(Infinity);
  private pricePrecision: number;
  private volumePrecision: number;
  private priceGroups: Map<
    string,
    {
      price: Decimal;
      volume: Decimal;
      buyVolume: Decimal;
      sellVolume: Decimal;
    }
  > = new Map();
  private histogramNeedsRebuild: boolean = true;
  private tradesCount: number = 0;

  /**
   * Creates a new tick-based Volume Profile session.
   *
   * @param config - Configuration options
   * @param config.valueAreaRowSize - Number of price rows in the histogram (default: 24)
   * @param config.valueAreaVolume - Percentage of volume that defines the value area (default: 0.7 or 70%)
   * @param config.pricePrecision - Decimal precision for price values (default: 2)
   * @param config.volumePrecision - Decimal precision for volume values (default: 2)
   */
  constructor(config: IVolumeProfileSessionConfig = {}) {
    this.valueAreaRowSize = config.valueAreaRowSize || 24;
    this.valueAreaVolume = config.valueAreaVolume || 0.7;
    this.pricePrecision = config.pricePrecision || 2;
    this.volumePrecision = config.volumePrecision || 2;
  }

  /**
   * Process a single trade and update the volume profile.
   *
   * This method takes an individual trade, extracts its price and volume information,
   * and updates the profile. Unlike the candle-based approach, this provides exact
   * precision about where volume occurred by using actual trade prices.
   *
   * The method is optimized for high-frequency processing, as it only marks the histogram
   * for rebuilding when necessary and doesn't perform expensive calculations until results
   * are requested.
   *
   * @param trade - The individual trade to process
   *
   * @example
   * ```typescript
   * session.processTrade({
   *   price: 36512.75,
   *   volume: 0.25,
   *   isBuyer: true,
   *   time: new Date()
   * });
   * ```
   */
  processTrade(trade: ITrade): void {
    const price = new Decimal(trade.price);
    const volume = new Decimal(trade.volume);
    const isBuyTrade = trade.isBuyer === true;

    // Update price extremes
    if (price.greaterThan(this.highestPrice)) {
      this.highestPrice = price;
      this.histogramNeedsRebuild = true;
    }
    if (price.lessThan(this.lowestPrice)) {
      this.lowestPrice = price;
      this.histogramNeedsRebuild = true;
    }

    // For the first trade, set both lowest and highest to the same value
    if (this.tradesCount === 0) {
      this.lowestPrice = price;
      this.highestPrice = price;
    }

    this.totalVolume = this.totalVolume.plus(volume);

    // Track buy/sell volume
    if (isBuyTrade) {
      this.buyVolume = this.buyVolume.plus(volume);
    } else {
      this.sellVolume = this.sellVolume.plus(volume);
    }

    // Group trades by exact price level
    const priceKey = price.toFixed(this.pricePrecision);
    if (this.priceGroups.has(priceKey)) {
      const group = this.priceGroups.get(priceKey);
      group.volume = group.volume.plus(volume);
      if (isBuyTrade) {
        group.buyVolume = group.buyVolume.plus(volume);
      } else {
        group.sellVolume = group.sellVolume.plus(volume);
      }
    } else {
      this.priceGroups.set(priceKey, {
        price,
        volume,
        buyVolume: isBuyTrade ? volume : new Decimal(0),
        sellVolume: isBuyTrade ? new Decimal(0) : volume
      });
      this.histogramNeedsRebuild = true; // New price point added
    }

    // Increment trade count instead of storing the trade
    this.tradesCount++;
  }

  /**
   * Process multiple trades in batch.
   *
   * Efficiently processes an array of trades without rebuilding the histogram
   * after each trade. This is optimized for bulk loading historical trade data.
   *
   * @param trades - An array of trades to process
   *
   * @example
   * ```typescript
   * // Process a batch of historical trades
   * session.processTrades(historicalTrades);
   *
   * // Histogram will only be rebuilt when results are requested
   * const valueArea = session.getValueArea();
   * ```
   */
  processTrades(trades: ITrade[]): void {
    for (const trade of trades) {
      this.processTrade(trade);
    }
  }

  /**
   * Manually trigger a histogram rebuild.
   *
   * Under normal circumstances, the histogram is automatically rebuilt only when
   * needed (when results are requested). This method allows forcing a rebuild,
   * which might be useful in specific scenarios like preparing for multiple
   * rapid read operations.
   *
   * @example
   * ```typescript
   * // Force histogram rebuild before multiple reads
   * session.rebuildHistogram();
   *
   * // Now perform multiple reads without rebuilding histogram each time
   * const valueArea = session.getValueArea();
   * const distribution = session.getVolumeDistribution();
   * ```
   */
  rebuildHistogram(): void {
    // If there's no price range (e.g., only one price point)
    const range = this.highestPrice.minus(this.lowestPrice);
    if (range.lessThanOrEqualTo(0) || this.tradesCount === 0) {
      // Create a single row with the accumulated volume
      const singlePrice = this.lowestPrice;
      const totalVol = this.totalVolume.toNumber();
      const buyVol = this.buyVolume.toNumber();
      const sellVol = this.sellVolume.toNumber();

      this.histogram = [
        {
          volume: totalVol,
          buyVolume: buyVol,
          sellVolume: sellVol,
          low: Number(singlePrice.toFixed(this.pricePrecision)),
          mid: Number(singlePrice.toFixed(this.pricePrecision)),
          high: Number(singlePrice.toFixed(this.pricePrecision))
        }
      ];

      this.histogramNeedsRebuild = false;
      return;
    }

    const stepSize = range.dividedBy(this.valueAreaRowSize);

    // Initialize new histogram
    this.histogram = Array.from({ length: this.valueAreaRowSize }, (_, row) => {
      const rowDecimal = new Decimal(row);
      const lowPrice = Decimal.max(this.lowestPrice, this.lowestPrice.plus(stepSize.times(rowDecimal)));
      const highPrice = Decimal.min(this.highestPrice, this.lowestPrice.plus(stepSize.times(rowDecimal).plus(stepSize)));
      const midPrice = lowPrice.plus(highPrice).dividedBy(2);

      return {
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
        low: Number(lowPrice.toFixed(this.pricePrecision)),
        mid: Number(midPrice.toFixed(this.pricePrecision)),
        high: Number(highPrice.toFixed(this.pricePrecision))
      };
    });

    // Populate histogram by allocating exact trade volume to the appropriate rows
    for (const [_, priceGroup] of this.priceGroups) {
      const price = priceGroup.price;
      const rowDecimal = price.minus(this.lowestPrice).dividedBy(stepSize).floor();
      const row = Math.max(0, Math.min(this.valueAreaRowSize - 1, rowDecimal.toNumber()));

      this.histogram[row].volume += priceGroup.volume.toNumber();
      this.histogram[row].buyVolume += priceGroup.buyVolume.toNumber();
      this.histogram[row].sellVolume += priceGroup.sellVolume.toNumber();
    }

    this.histogramNeedsRebuild = false;
  }

  /**
   * Ensures the histogram is up to date.
   *
   * @private
   */
  private ensureHistogramIsBuilt(): void {
    if (this.histogramNeedsRebuild) {
      this.rebuildHistogram();
    }
  }

  /**
   * Get the current value area calculation.
   *
   * Calculates key volume profile metrics based on the current state:
   * - Point of Control (POC): The price level with the highest volume
   * - Value Area High (VAH): Upper boundary of the value area
   * - Value Area Low (VAL): Lower boundary of the value area
   * - Equilibrium (EQ): Midpoint between the highest and lowest prices
   *
   * The histogram is automatically rebuilt if necessary.
   *
   * @returns The value area object, or null if no trades have been processed
   *
   * @example
   * ```typescript
   * const valueArea = session.getValueArea();
   * console.log('POC:', valueArea.POC);
   * console.log('Value Area Range:', valueArea.VAL, 'to', valueArea.VAH);
   * ```
   */
  getValueArea(): IValueArea {
    if (this.tradesCount === 0) {
      return null;
    }

    this.ensureHistogramIsBuilt();

    // Find POC (Point of Control)
    let pocRow = 0;
    let pocVolume = 0;
    let poc = 0;

    for (let i = 0; i < this.histogram.length; i++) {
      if (this.histogram[i].volume > pocVolume) {
        pocVolume = this.histogram[i].volume;
        poc = this.histogram[i].mid;
        pocRow = i;
      }
    }

    // Calculate Value Area
    const valueAreaVolumeTarget = this.totalVolume.times(this.valueAreaVolume).toNumber();
    let currentVolume = this.histogram[pocRow].volume;
    let lowerIndex = pocRow;
    let upperIndex = pocRow;

    while (currentVolume < valueAreaVolumeTarget) {
      const lowerVolume = lowerIndex > 0 ? this.histogram[lowerIndex - 1].volume : 0;
      const upperVolume = upperIndex < this.histogram.length - 1 ? this.histogram[upperIndex + 1].volume : 0;

      if (lowerVolume > upperVolume && lowerIndex > 0) {
        lowerIndex--;
        currentVolume += this.histogram[lowerIndex].volume;
      } else if (upperIndex < this.histogram.length - 1) {
        upperIndex++;
        currentVolume += this.histogram[upperIndex].volume;
      } else {
        break;
      }
    }

    const VAL = this.histogram[lowerIndex].low;
    const VAH = this.histogram[upperIndex].high;
    const EQ = Number(this.lowestPrice.plus(this.highestPrice).dividedBy(2).toFixed(this.pricePrecision));
    const low = Number(this.lowestPrice.toFixed(this.pricePrecision));
    const high = Number(this.highestPrice.toFixed(this.pricePrecision));

    return {
      VAH: Number(new Decimal(VAH).toFixed(this.pricePrecision)),
      VAL: Number(new Decimal(VAL).toFixed(this.pricePrecision)),
      POC: Number(new Decimal(poc).toFixed(this.pricePrecision)),
      EQ,
      low,
      high
    };
  }

  /**
   * Get the detailed price levels and their volumes.
   *
   * Returns an array of exact price points where trading occurred, along with
   * the volume at each price. This provides a more granular view than the histogram,
   * showing the actual traded prices rather than price ranges.
   *
   * @returns Array of price levels with their associated volumes
   *
   * @example
   * ```typescript
   * const priceLevels = session.getPriceLevels();
   *
   * // Find prices with the highest buy volume
   * const topBuyPrices = priceLevels
   *   .sort((a, b) => b.buyVolume - a.buyVolume)
   *   .slice(0, 5);
   *
   * console.log('Top 5 prices with highest buy volume:', topBuyPrices);
   * ```
   */
  getPriceLevels(): { price: number; volume: number; buyVolume: number; sellVolume: number }[] {
    const levels = [];
    for (const [_, group] of this.priceGroups) {
      levels.push({
        price: Number(group.price.toFixed(this.pricePrecision)),
        volume: Number(group.volume.toFixed(this.volumePrecision)),
        buyVolume: Number(group.buyVolume.toFixed(this.volumePrecision)),
        sellVolume: Number(group.sellVolume.toFixed(this.volumePrecision))
      });
    }

    // Sort by price
    return levels.sort((a, b) => a.price - b.price);
  }

  /**
   * Get the volume distribution across price levels.
   *
   * Returns a comprehensive view of the volume profile, including:
   * - Histogram: Array of volume rows with price ranges and aggregated volumes
   * - Price Levels: Array of exact prices with their individual volumes
   * - Value Area: POC, VAH, VAL, and other key metrics
   * - Volume Summary: Total, buy, and sell volumes, plus trade count
   *
   * The histogram is automatically rebuilt if necessary.
   *
   * @returns The volume distribution, or a default empty distribution if no trades have been processed
   *
   * @example
   * ```typescript
   * const distribution = session.getVolumeDistribution();
   *
   * // Access both histogram and exact price data
   * console.log('Binned price levels:', distribution.histogram.length);
   * console.log('Exact price points:', distribution.priceLevels.length);
   *
   * // Analyse trading activity
   * console.log('Total trades processed:', distribution.tradesCount);
   * console.log('Total volume:', distribution.totalVolume);
   * console.log('Buy/Sell ratio:', distribution.buyVolume / distribution.sellVolume);
   * ```
   */
  getVolumeDistribution(): IRawTradeVolumeDistribution {
    if (this.tradesCount === 0) {
      return {
        histogram: [],
        priceLevels: [],
        valueArea: null,
        totalVolume: 0,
        buyVolume: 0,
        sellVolume: 0,
        tradesCount: 0
      };
    }

    this.ensureHistogramIsBuilt();

    // Create a deep copy with properly rounded values
    const formattedHistogram = this.histogram.map((row) => {
      return {
        volume: Number(new Decimal(row.volume).toFixed(this.volumePrecision)),
        buyVolume: Number(new Decimal(row.buyVolume).toFixed(this.volumePrecision)),
        sellVolume: Number(new Decimal(row.sellVolume).toFixed(this.volumePrecision)),
        low: Number(new Decimal(row.low).toFixed(this.pricePrecision)),
        mid: Number(new Decimal(row.mid).toFixed(this.pricePrecision)),
        high: Number(new Decimal(row.high).toFixed(this.pricePrecision))
      };
    });

    return {
      histogram: formattedHistogram,
      priceLevels: this.getPriceLevels(),
      valueArea: this.getValueArea(),
      totalVolume: Number(this.totalVolume.toFixed(this.volumePrecision)),
      buyVolume: Number(this.buyVolume.toFixed(this.volumePrecision)),
      sellVolume: Number(this.sellVolume.toFixed(this.volumePrecision)),
      tradesCount: this.tradesCount
    };
  }

  /**
   * Reset the session to its initial state.
   *
   * Clears all processed trades, volumes, price groups, and histograms,
   * returning the session to its initial empty state. Use this when starting
   * a new analysis period.
   *
   * @example
   * ```typescript
   * // Reset the session at the start of a new trading day
   * session.reset();
   *
   * // Begin processing new trades
   * socket.on('trade', trade => {
   *   session.processTrade(trade);
   * });
   * ```
   */
  reset(): void {
    this.histogram = [];
    this.priceGroups.clear();
    this.totalVolume = new Decimal(0);
    this.buyVolume = new Decimal(0);
    this.sellVolume = new Decimal(0);
    this.highestPrice = new Decimal(-Infinity);
    this.lowestPrice = new Decimal(Infinity);
    this.histogramNeedsRebuild = true;
    this.tradesCount = 0;
  }
}
