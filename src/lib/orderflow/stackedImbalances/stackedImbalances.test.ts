import { detectImbalances } from './';
import { ImbalanceSide } from '../../../constants';

describe('Order Flow Imbalance Detection', () => {
  describe('detectImbalances', () => {
    it('should detect buying imbalance when volSumAsk > volSumBid', () => {
      const data = {
        '100.00': { volSumAsk: 2.0, volSumBid: 0.1 }
      };
      const imbalances = detectImbalances(data, 100);
      expect(imbalances).toHaveLength(1);
      expect(imbalances[0].imbalanceSide).toBe(ImbalanceSide.BUYING_IMBALANCE);
    });
  });
});
