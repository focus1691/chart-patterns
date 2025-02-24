import { detectImbalances, detectStackedImbalances } from './';
import { ImbalanceSide } from '../../../constants';

describe('Order Flow Imbalance Detection', () => {
  describe('detectImbalances', () => {
    it('should detect buying imbalance when volSumAsk > volSumBid', () => {
      const data = {
        '100.00': { volSumAsk: 2.0, volSumBid: 0.1 } // Strong limit buys
      };
      const imbalances = detectImbalances(data, 100);
      expect(imbalances).toHaveLength(1);
      expect(imbalances[0].imbalanceSide).toBe(ImbalanceSide.BUYING_IMBALANCE);
    });

    it('should detect selling imbalance when volSumBid > volSumAsk', () => {
      const data = {
        '100.00': { volSumAsk: 0.1, volSumBid: 2.0 } // Strong limit sells
      };
      const imbalances = detectImbalances(data, 100);
      expect(imbalances).toHaveLength(1);
      expect(imbalances[0].imbalanceSide).toBe(ImbalanceSide.SELLING_IMBALANCE);
    });

    it('should handle zero values correctly', () => {
      const data = {
        '100.00': { volSumAsk: 0, volSumBid: 1.0 }, // Pure limit sells
        '101.00': { volSumAsk: 1.0, volSumBid: 0 }  // Pure limit buys
      };
      const imbalances = detectImbalances(data, 100);
      expect(imbalances).toHaveLength(2);
      expect(imbalances[0].imbalanceSide).toBe(ImbalanceSide.SELLING_IMBALANCE);
      expect(imbalances[1].imbalanceSide).toBe(ImbalanceSide.BUYING_IMBALANCE);
    });
  });

  describe('detectStackedImbalances', () => {
    it('should detect consecutive buying imbalances', () => {
      const data = {
        '36.80': { volSumAsk: 1.22, volSumBid: 0.1 },  // Buying
        '36.81': { volSumAsk: 15.0, volSumBid: 0.34 }, // Strong buying
        '36.82': { volSumAsk: 1.2, volSumBid: 0 }      // Buying
      };
      
      const stacks = detectStackedImbalances(data, {
        threshold: 100,
        stackCount: 2,
        tickSize: 0.01
      });

      expect(stacks).toHaveLength(1);
      expect(stacks[0]).toEqual({
        imbalanceStartAt: 36.80,
        imbalanceEndAt: 36.82,
        stackedCount: 3,
        imbalanceSide: ImbalanceSide.BUYING_IMBALANCE
      });
    });

    it('should detect consecutive selling imbalances', () => {
      const data = {
        '36.80': { volSumAsk: 0.1, volSumBid: 1.22 },  // Selling
        '36.81': { volSumAsk: 0.34, volSumBid: 15.0 }, // Strong selling
        '36.82': { volSumAsk: 0, volSumBid: 1.2 }      // Selling
      };
      
      const stacks = detectStackedImbalances(data, {
        threshold: 100,
        stackCount: 2,
        tickSize: 0.01
      });

      expect(stacks).toHaveLength(1);
      expect(stacks[0]).toEqual({
        imbalanceStartAt: 36.80,
        imbalanceEndAt: 36.82,
        stackedCount: 3,
        imbalanceSide: ImbalanceSide.SELLING_IMBALANCE
      });
    });

    it('should handle your specific case correctly', () => {
      const data = {
        '36.75': { volSumAsk: 0, volSumBid: 0.28 },
        '36.77': { volSumAsk: 1.46, volSumBid: 0 },
        '36.79': { volSumAsk: 0, volSumBid: 0.34 },
        '36.80': { volSumAsk: 1.22, volSumBid: 0.1 },
        '36.81': { volSumAsk: 15, volSumBid: 0.34 },
        '36.82': { volSumAsk: 1.2, volSumBid: 0 }
      };
      
      const stacks = detectStackedImbalances(data, {
        threshold: 100,
        stackCount: 2,
        tickSize: 0.01
      });

      expect(stacks).toHaveLength(1);
      expect(stacks[0]).toEqual({
        imbalanceStartAt: 36.80,
        imbalanceEndAt: 36.82,
        stackedCount: 3,
        imbalanceSide: ImbalanceSide.BUYING_IMBALANCE
      });
    });
  });
}); 