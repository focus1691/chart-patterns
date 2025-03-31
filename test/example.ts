import { MarketProfile, VolumeProfile, RangeBuilder } from '../src/lib';
import { ICandle } from '../src/types';
import { MARKET_PROFILE_PERIODS, FIBONACCI_NUMBERS } from '../src/constants';
import * as fs from 'fs';
import * as path from 'path';

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

const main = async () => {
  // Load both timeframe data
  console.log('Loading historical data...');
  const dailyCandles = loadCandles('./klines_1d.json');
  const thirtyMinCandles = loadCandles('./klines_30m.json');

  console.log(`Loaded ${dailyCandles.length} daily candles`);
  console.log(`Loaded ${thirtyMinCandles.length} 30-minute candles`);

  // Test with 30m candles
  console.log('\nTesting Market Profile with daily data...');
  const marketProfiles = MarketProfile.build({
    candles: thirtyMinCandles,
    candleGroupingPeriod: MARKET_PROFILE_PERIODS.DAILY,
    tickSize: 0.1,
    pricePrecision: 2,
    tickMultiplier: 100,
    timezone: 'Europe/London'
  });
  console.log('Market Profiles generated:', marketProfiles.length);
  console.log('First Market Profile:', JSON.stringify(marketProfiles[0], null, 2));

  console.log('\nTesting Volume Profile with daily data...');
  const volumeProfiles = VolumeProfile.build({
    candles: thirtyMinCandles,
    tickSize: 100,
    period: MARKET_PROFILE_PERIODS.DAILY,
    timezone: 'Europe/London'
  });
  console.log('Volume Profiles generated:', volumeProfiles.length);
  console.log('First Volume Profile:', JSON.stringify(volumeProfiles[0], null, 2));

  // Test Range Builder with 30m data for more granular analysis
  console.log('\nTesting Range Builder with daily data...');
  // Define Z-Score configuration
  const zScoreConfig = {
    lag: 2,
    threshold: 0.1,
    influence: 0.1
  };
  const ranges = RangeBuilder.findRanges(dailyCandles, zScoreConfig);
  console.log('Ranges found:', ranges.length);

  // Print first 3 ranges for sample with detailed fib analysis
  console.log('\nSample Ranges with Fibonacci Analysis:');
  ranges.slice(0, 3).forEach((range, index) => {
    console.log(`\nRange ${index + 1}:`);
    console.log('Basic Range Info:', {
      start: range.start,
      end: range.end,
      support: range.support,
      resistance: range.resistance,
      direction: range.direction,
    });

    if (range.fibs) {
      console.log('\nFibonacci Analysis:');
      console.log('Low to High Levels:');
      Object.entries(range.fibs.lowToHigh || {}).sort().forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
      
      console.log('\nHigh to Low Levels:');
      Object.entries(range.fibs.highToLow || {}).sort().forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });

      // Print FIBONACCI_NUMBERS enum for comparison
      console.log('\nFIBONACCI_NUMBERS enum values:');
      Object.entries(FIBONACCI_NUMBERS).sort().forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }
  });

  // Print some statistics
  const avgRangeSize =
    ranges.reduce((acc, range) => {
      if (range.support && range.resistance) {
        return acc + (range.resistance - range.support);
      }
      return acc;
    }, 0) / ranges.length;

  console.log('\nStatistics:');
  console.log('Average range size:', avgRangeSize.toFixed(2));
};

main().catch(console.error);
