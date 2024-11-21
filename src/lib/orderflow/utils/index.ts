import { OrderFlowRow } from '../../../types';

/**
 * Adjusts the resolution of orderflow data by rebinning price levels based on a specified tick size and multiplier.
 *
 * @param {Object.<number, OrderFlowRow>} data - The original orderflow data, where keys are prices
 *        and values are OrderFlowRow objects containing volume information.
 * @param {number} tickSize - The smallest price increment for the instrument.
 * @param {number} tickMultiplier - A multiplier to adjust the tick size, effectively determining
 *        the new bin size for price levels.
 *
 * @returns {Object.<number, OrderFlowRow>} A new object with adjusted price levels (normalised prices)
 *          as keys and aggregated OrderFlowRow objects as values.
 *
 * @example
 * const originalData = {
 *   "100.1": { volSumAsk: 100, volSumBid: 150 },
 *   "100.2": { volSumAsk: 200, volSumBid: 180 },
 *   "100.3": { volSumAsk: 150, volSumBid: 120 }
 * };
 * const adjustedData = adjustOrderFlowResolution(originalData, 0.1, 5);
 * // Returns: {
 * //   "100": { volSumAsk: 450, volSumBid: 450 }
 * // }
 *
 * @remarks
 * This function is optimised for performance, using a traditional for loop and avoiding
 * unnecessary object creation. It's particularly useful for adjusting the granularity
 * of orderflow data, which can be helpful for analysis at different price resolutions.
 */
export function adjustOrderFlowResolution(
  orderflowTrades: { [price: number]: OrderFlowRow },
  tickSize: number,
  tickMultiplier: number
): { [normalisedPrice: number]: OrderFlowRow } {
  const adjustedOrderflowTrades: { [normalisedPrice: number]: OrderFlowRow } = Object.create(null);
  const tickSizeMultiplied = tickSize * tickMultiplier;
  const prices = Object.keys(orderflowTrades);
  const len = prices.length;

  for (let i = 0; i < len; i++) {
    const price = prices[i];
    const row = orderflowTrades[price];
    const normalisedPrice = Math.floor(+price / tickSizeMultiplied) * tickSizeMultiplied;

    if (adjustedOrderflowTrades[normalisedPrice]) {
      adjustedOrderflowTrades[normalisedPrice].volSumAsk += row.volSumAsk;
      adjustedOrderflowTrades[normalisedPrice].volSumBid += row.volSumBid;
    } else {
      adjustedOrderflowTrades[normalisedPrice] = {
        volSumAsk: row.volSumAsk,
        volSumBid: row.volSumBid
      };
    }
  }

  return adjustedOrderflowTrades;
}
