import { ICandle, IValueArea, IVolumeRow, IVolumeProfileSessionConfig, IVolumeDistribution } from '../../types';
import Decimal from 'decimal.js';

/**
 * A Volume Profile session that processes candlestick (OHLC) data.
 *
 * This class builds volume profiles by analysing candlestick data, distributing volume
 * across price levels based on each candle's price range. It identifies high-volume
 * price areas and calculates the value area and point of control.
 */
export class BarVolumeProfileSession {
  private candles: ICandle[] = [];
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

  /**
   * Creates a new bar-based Volume Profile session.
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
   * Process a new candle and update the volume profile.
   *
   * This method takes a single candlestick, extracts its price and volume information,
   * and updates the volume profile accordingly. It distributes the candle's volume across
   * all price levels that the candle spans.
   *
   * @param candle - The candlestick to process
   *
   * @example
   * ```typescript
   * session.processCandle({
   *   open: 36500,
   *   high: 36750,
   *   low: 36400,
   *   close: 36600,
   *   volume: 125.5,
   *   openTime: new Date()
   * });
   * ```
   */
  processCandle(candle: ICandle): void {
    // Convert to Decimal for precision
    const high = new Decimal(candle.high);
    const low = new Decimal(candle.low);
    const open = new Decimal(candle.open);
    const close = new Decimal(candle.close);
    const volume = new Decimal(candle.volume);

    // Update price extremes
    this.highestPrice = Decimal.max(this.highestPrice, high);
    this.lowestPrice = Decimal.min(this.lowestPrice, low);
    this.totalVolume = this.totalVolume.plus(volume);

    // Track buy/sell volume based on candle direction
    if (close.greaterThanOrEqualTo(open)) {
      this.buyVolume = this.buyVolume.plus(volume);
    } else {
      this.sellVolume = this.sellVolume.plus(volume);
    }

    // Add candle to our collection
    this.candles.push(candle);

    // Rebuild histogram with new price range
    this.rebuildHistogram();
  }

  /**
   * Rebuild the histogram based on current price range and candles.
   *
   * This private method regenerates the volume histogram by:
   * 1. Dividing the price range into specified number of rows
   * 2. Redistributing each candle's volume across the price rows it spans
   * 3. Separating volume into buy and sell components based on candle direction
   *
   * @private
   */
  private rebuildHistogram(): void {
    const range = this.highestPrice.minus(this.lowestPrice);
    if (range.lessThanOrEqualTo(0)) return;

    const stepSize = range.dividedBy(this.valueAreaRowSize);

    // Initialize new histogram
    this.histogram = Array.from({ length: this.valueAreaRowSize }, (_, row) => {
      const rowDecimal = new Decimal(row);
      const lowPrice = Decimal.max(this.lowestPrice, this.lowestPrice.plus(stepSize.times(rowDecimal)));
      const highPrice = Decimal.min(this.highestPrice, this.lowestPrice.plus(stepSize.times(rowDecimal).plus(stepSize)));
      const midPrice = lowPrice.plus(highPrice).dividedBy(2);

      // Apply precision consistently
      return {
        volume: 0,
        buyVolume: 0,
        sellVolume: 0,
        low: Number(lowPrice.toFixed(this.pricePrecision)),
        mid: Number(midPrice.toFixed(this.pricePrecision)),
        high: Number(highPrice.toFixed(this.pricePrecision))
      };
    });

    // Populate histogram with candle data
    for (const candle of this.candles) {
      const candleLow = new Decimal(candle.low);
      const candleHigh = new Decimal(candle.high);
      const candleVolume = new Decimal(candle.volume);
      const isBuyVolume = candle.close >= candle.open;

      // Find which rows this candle spans
      const lowRowDecimal = candleLow.minus(this.lowestPrice).dividedBy(stepSize).floor();
      const highRowDecimal = candleHigh.minus(this.lowestPrice).dividedBy(stepSize).floor();

      const lowRow = Math.max(0, Math.min(this.valueAreaRowSize - 1, lowRowDecimal.toNumber()));
      const highRow = Math.max(0, Math.min(this.valueAreaRowSize - 1, highRowDecimal.toNumber()));

      if (lowRow === highRow) {
        // Candle fits in a single row
        this.histogram[lowRow].volume += candleVolume.toNumber();
        if (isBuyVolume) {
          this.histogram[lowRow].buyVolume += candleVolume.toNumber();
        } else {
          this.histogram[lowRow].sellVolume += candleVolume.toNumber();
        }
      } else {
        // Candle spans multiple rows - distribute volume proportionally
        const rowCount = highRow - lowRow + 1;
        const volumePerRow = candleVolume.dividedBy(rowCount).toNumber();

        for (let row = lowRow; row <= highRow; row++) {
          this.histogram[row].volume += volumePerRow;
          if (isBuyVolume) {
            this.histogram[row].buyVolume += volumePerRow;
          } else {
            this.histogram[row].sellVolume += volumePerRow;
          }
        }
      }
    }
  }

  /**
   * Get the current value area calculation.
   *
   * Calculates the following values based on the current histogram:
   * - Point of Control (POC): The price level with the highest volume
   * - Value Area High (VAH): Upper boundary of the value area
   * - Value Area Low (VAL): Lower boundary of the value area
   * - Equilibrium (EQ): Midpoint between the highest and lowest prices
   *
   * @returns The value area object, or null if no candles have been processed
   *
   * @example
   * ```typescript
   * const valueArea = session.getValueArea();
   * console.log('Point of Control:', valueArea.POC);
   * console.log('Value Area High:', valueArea.VAH);
   * console.log('Value Area Low:', valueArea.VAL);
   * ```
   */
  getValueArea(): IValueArea {
    if (this.candles.length === 0) {
      return null;
    }

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
   * Get the volume distribution across price levels.
   *
   * Returns a comprehensive view of the volume profile, including:
   * - Histogram: Array of volume rows with price levels and volumes
   * - Value Area: POC, VAH, VAL, and other key metrics
   * - Volume Summary: Total, buy, and sell volumes
   *
   * @returns The volume distribution, or a default empty distribution if no candles have been processed
   *
   * @example
   * ```typescript
   * const distribution = session.getVolumeDistribution();
   *
   * // Access the histogram data
   * const histogram = distribution.histogram;
   * console.log('Price levels:', histogram.length);
   *
   * // Find the row with maximum volume
   * const maxVolumeRow = histogram.reduce((max, row) =>
   *   row.volume > max.volume ? row : max, histogram[0]);
   * console.log('Highest volume at price:', maxVolumeRow.mid);
   *
   * // Check buy/sell ratio
   * const buyRatio = distribution.buyVolume / distribution.totalVolume;
   * console.log('Buy pressure:', (buyRatio * 100).toFixed(2) + '%');
   * ```
   */
  getVolumeDistribution(): IVolumeDistribution {
    if (this.candles.length === 0) {
      return {
        histogram: [],
        valueArea: null,
        totalVolume: 0,
        buyVolume: 0,
        sellVolume: 0
      };
    }

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

    // Get value area with proper rounding
    const valueArea = this.getValueArea();

    // Ensure POC is properly rounded in the value area
    if (valueArea) {
      valueArea.POC = Number(new Decimal(valueArea.POC).toFixed(this.pricePrecision));
    }

    return {
      histogram: formattedHistogram,
      valueArea,
      totalVolume: Number(this.totalVolume.toFixed(this.volumePrecision)),
      buyVolume: Number(this.buyVolume.toFixed(this.volumePrecision)),
      sellVolume: Number(this.sellVolume.toFixed(this.volumePrecision))
    };
  }

  /**
   * Reset the session to its initial state.
   *
   * Clears all processed candles, volumes, price ranges, and histograms,
   * returning the session to its initial empty state. Use this when starting
   * a new analysis period.
   *
   * @example
   * ```typescript
   * // Reset the session at the start of a new trading day
   * session.reset();
   *
   * // Begin processing new candles
   * for (const candle of newDayCandles) {
   *   session.processCandle(candle);
   * }
   * ```
   */
  reset(): void {
    this.candles = [];
    this.histogram = [];
    this.totalVolume = new Decimal(0);
    this.buyVolume = new Decimal(0);
    this.sellVolume = new Decimal(0);
    this.highestPrice = new Decimal(-Infinity);
    this.lowestPrice = new Decimal(Infinity);
  }
}
