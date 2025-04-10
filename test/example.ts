import {
  MarketProfile,
  VolumeProfile,
  RangeBuilder,
  PeakDetector,
  ZigZags,
  CandlestickPatterns,
  VWAP
} from '../src/lib';
import { ICandle } from '../src/types';
import { MARKET_PROFILE_PERIODS, FIBONACCI_NUMBERS, SIGNAL_DIRECTION } from '../src/constants';
import * as fs from 'fs';
import * as path from 'path';
import { ZigZagConfig } from '../src/types/zigzags.types';

const loadCandles = (filename: string): ICandle[] => {
  const rawData = fs.readFileSync(path.join(__dirname, filename), 'utf8');
  const data = JSON.parse(rawData);

  return data.map((candle: any) => ({
    symbol: candle.symbol,
    interval: candle.interval,
    openTime: new Date(candle.openTime),
    closeTime: new Date(candle.closeTime),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume
  }));
};

const printTitle = (title: string): void => {
  console.log("\n" + "=".repeat(80));
  console.log(`${title}`);
  console.log("=".repeat(80));
};

const printSubtitle = (subtitle: string): void => {
  console.log("\n" + "-".repeat(50));
  console.log(`${subtitle}`);
  console.log("-".repeat(50));
};

const main = async () => {
  // Load both timeframe data
  printTitle("1. Loading Historical Data");
  console.log('Loading historical candle data...');
  const dailyCandles = loadCandles('./klines_1d.json');
  const thirtyMinCandles = loadCandles('./klines_30m.json');

  console.log(`Loaded ${dailyCandles.length} daily candles from ${new Date(dailyCandles[0].openTime).toDateString()} to ${new Date(dailyCandles[dailyCandles.length - 1].closeTime).toDateString()}`);
  console.log(`Loaded ${thirtyMinCandles.length} 30-minute candles from ${new Date(thirtyMinCandles[0].openTime).toDateString()} to ${new Date(thirtyMinCandles[thirtyMinCandles.length - 1].closeTime).toDateString()}`);

  // Market Profile test
  printTitle("2. Market Profile Analysis");
  console.log('Building market profiles with 30-minute candles grouped by day...');
  const marketProfiles = MarketProfile.build({
    candles: thirtyMinCandles,
    candleGroupingPeriod: MARKET_PROFILE_PERIODS.DAILY,
    tickSize: 0.1,
    pricePrecision: 2,
    tickMultiplier: 100,
    timezone: 'Europe/London'
  });

  console.log(`Generated ${marketProfiles.length} market profiles`);

  printSubtitle("Sample Market Profile");
  const sampleProfile = marketProfiles[0];
  console.log(`Date: ${new Date(sampleProfile.startTime).toDateString()}`);
  console.log(`Point of Control (POC): ${sampleProfile.valueArea.POC}`);
  console.log(`Value Area: ${sampleProfile.valueArea.VAL} - ${sampleProfile.valueArea.VAH}`);
  console.log(`Initial Balance: ${sampleProfile.initialBalance.low} - ${sampleProfile.initialBalance.high}`);
  console.log(`TPO Count: ${sampleProfile.tpoCount}`);

  // Volume Profile test
  printTitle("3. Volume Profile Analysis");
  console.log('Building volume profiles with 30-minute candles grouped by day...');
  const volumeProfiles = VolumeProfile.build({
    candles: thirtyMinCandles,
    tickSize: 100,
    period: MARKET_PROFILE_PERIODS.DAILY,
    timezone: 'Europe/London'
  });

  console.log(`Generated ${volumeProfiles.length} volume profiles`);

  printSubtitle("Sample Volume Profile");
  const sampleVolumeProfile = volumeProfiles[0];
  console.log(`Date: ${new Date(sampleVolumeProfile.startTime).toDateString()}`);
  console.log(`Point of Control (POC): ${sampleVolumeProfile.valueArea.POC}`);
  console.log(`Value Area: ${sampleVolumeProfile.valueArea.VAL} - ${sampleVolumeProfile.valueArea.VAH}`);
  console.log(`Initial Balance: ${sampleVolumeProfile.IB.low} - ${sampleVolumeProfile.IB.high}`);

  // Z-Score Peak Detection
  printTitle("4. Z-Score Peak Detection");
  // Define Z-Score configuration
  const zScoreConfig = {
    lag: 5,          // Increased from 2 to 5 for better smoothing
    threshold: 0.5,   // Increased sensitivity from 0.1
    influence: 0.2    // Slightly increased from 0.1
  };

  console.log(`Running peak detection with config: lag=${zScoreConfig.lag}, threshold=${zScoreConfig.threshold}, influence=${zScoreConfig.influence}`);
  const peaks = PeakDetector.findSignals({
    values: dailyCandles.map(c => c.close),
    config: zScoreConfig
  });

  console.log(`Detected ${peaks.length} peaks`);

  // Count bullish and bearish peaks
  const bullishPeaks = peaks.filter(p => p.direction === SIGNAL_DIRECTION.BULLISH).length;
  const bearishPeaks = peaks.filter(p => p.direction === SIGNAL_DIRECTION.BEARISH).length;

  console.log(`Bullish signals: ${bullishPeaks}, Bearish signals: ${bearishPeaks}`);

  printSubtitle("Sample Peaks (first 10)");
  peaks.slice(0, 10).forEach((peak, i) => {
    const candle = dailyCandles[peak.position];
    console.log(`Peak ${i + 1}: Position ${peak.position}, Direction: ${peak.direction === SIGNAL_DIRECTION.BULLISH ? 'BULLISH' : 'BEARISH'}, Date: ${new Date(candle.openTime).toDateString()}, Price: ${candle.close}`);
  });

  // ZigZag Analysis
  printTitle("5. ZigZag Analysis");
  const zigzagConfig: ZigZagConfig = {
    ...zScoreConfig,
    priceMethod: 'extremes'  // Use high/low for extremes
  };

  console.log('Creating ZigZags from peaks with price method: extremes');
  const zigzags = ZigZags.create(dailyCandles, zigzagConfig);

  console.log(`Created ${zigzags.length} zigzag points`);

  printSubtitle("Sample ZigZag Points (first 5)");
  zigzags.slice(0, 5).forEach((zz, i) => {
    console.log(`ZigZag ${i + 1}: Direction: ${zz.direction === SIGNAL_DIRECTION.BULLISH ? 'BULLISH' : 'BEARISH'}, Price: ${zz.price}, Date: ${new Date(zz.timestamp * 1000).toDateString()}`);
  });

  // Range Analysis with Fibonacci levels
  printTitle("6. Price Range Analysis with Fibonacci Levels");
  console.log('Finding price ranges in daily candles...');
  const ranges = RangeBuilder.findRanges(dailyCandles, zScoreConfig);
  console.log(`Found ${ranges.length} distinct price ranges`);

  // Print first 2 ranges for sample with detailed fib analysis
  printSubtitle("Sample Range with Fibonacci Analysis");
  if (ranges.length > 0) {
    const sampleRange = ranges[0];
    const formattedStartDate = new Date((sampleRange.start as number) * 1000).toDateString();
    const formattedEndDate = new Date((sampleRange.end as number) * 1000).toDateString();


    console.log(`Range from ${formattedStartDate} to ${formattedEndDate}`);
    console.log(`Support: ${sampleRange.support}, Resistance: ${sampleRange.resistance}`);
    console.log(`Direction: ${sampleRange.direction === SIGNAL_DIRECTION.BULLISH ? 'BULLISH' : 'BEARISH'}`);
    console.log(`Range Size: ${Math.abs(sampleRange.resistance - sampleRange.support).toFixed(2)}`);

    if (sampleRange.fibs) {
      console.log('\nFibonacci Retracement Levels:');

      console.log('Low to High Levels:');
      Object.entries(sampleRange.fibs.lowToHigh || {})
        .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
        .forEach(([key, value]) => {
          console.log(`${key} (${FIBONACCI_NUMBERS[key]}): ${value}`);
        });
    }
  }

  // Candlestick Pattern Detection
  printTitle("7. Candlestick Pattern Detection");
  console.log('Analyzing candlestick patterns in daily data...');

  // Sample counts for different patterns
  let dojiCount = 0;
  let engulfingCount = 0;
  let haramiCount = 0;
  let marubozu = 0;

  // Detect patterns
  dailyCandles.forEach((candle, i) => {
    if (CandlestickPatterns.detectDoji(candle, 0.05) !== SIGNAL_DIRECTION.NONE) {
      dojiCount++;
    }

    if (i > 0) {
      const engulfingSignal = CandlestickPatterns.detectEngulfing(dailyCandles, { index: i });
      if (engulfingSignal !== SIGNAL_DIRECTION.NONE) {
        engulfingCount++;
      }

      const haramiSignal = CandlestickPatterns.detectHarami(dailyCandles, i);
      if (haramiSignal !== SIGNAL_DIRECTION.NONE) {
        haramiCount++;
      }
    }

    if (CandlestickPatterns.detectMarubozu(candle, 0.03) !== SIGNAL_DIRECTION.NONE) {
      marubozu++;
    }
  });

  console.log(`Found ${dojiCount} Doji patterns`);
  console.log(`Found ${engulfingCount} Engulfing patterns`);
  console.log(`Found ${haramiCount} Harami patterns`);
  console.log(`Found ${marubozu} Marubozu patterns`);

  // VWAP Analysis
  printTitle("8. VWAP Analysis");
  console.log('Calculating VWAP with standard deviation bands...');

  const vwapSession = VWAP.createSession(2, 2, 20); // 2 decimal precision, 2 std dev bands, 20 candles max

  // Process last 20 daily candles for VWAP
  const last20Candles = dailyCandles.slice(-20);

  last20Candles.forEach(candle => {
    vwapSession.processCandle(candle);
  });

  const vwapResult = vwapSession.getVWAP();

  console.log(`VWAP: ${vwapResult.vwap}`);
  console.log(`Upper Band (+2σ): ${vwapResult.upperBand}`);
  console.log(`Lower Band (-2σ): ${vwapResult.lowerBand}`);

  // Statistics on all analysis
  printTitle("9. Overall Statistics");

  // Average range size
  const avgRangeSize = ranges.reduce((acc, range) => {
    if (range.support && range.resistance) {
      return acc + (range.resistance - range.support);
    }
    return acc;
  }, 0) / ranges.length;

  console.log(`Average range size: ${avgRangeSize.toFixed(2)}`);
  console.log(`Average zigzag swing: ${zigzags.length > 1 ?
    zigzags.slice(1).reduce((acc, zz, i) => acc + Math.abs(zz.price - zigzags[i].price), 0) / (zigzags.length - 1) : 'N/A'}`);
  console.log(`Most recent close price: ${dailyCandles[dailyCandles.length - 1].close}`);

  // Check if current price is in a range
  const currentPrice = dailyCandles[dailyCandles.length - 1].close;
  const currentRange = ranges.find(range =>
    range.support <= currentPrice && currentPrice <= range.resistance
  );

  if (currentRange) {
    console.log(`Current price is within a range: ${currentRange.support} - ${currentRange.resistance}`);

    // Calculate position within range as percentage
    const rangeSize = currentRange.resistance - currentRange.support;
    const positionInRange = ((currentPrice - currentRange.support) / rangeSize * 100).toFixed(2);
    console.log(`Position within range: ${positionInRange}%`);
  } else {
    console.log('Current price is not within any identified range');
  }
};

main().catch(console.error);
