import { round } from '../../../utils';
import { OrderFlowRow, IHighVolumeNode, IFindHighVolumeNodeConfig } from '../../../types';

/**
 * Identifies high volume nodes in orderflow trades based on a specified threshold.
 *
 * @param {Object.<number, OrderFlowRow>} orderflowTrades - An object representing orderflow trades,
 *        where keys are prices and values are OrderFlowRow objects.
 * @param {number} totalVolume - The total volume across all price levels in the orderflow trades.
 * @param {IFindHighVolumeNodeConfig} config - Configuration object containing the threshold.
 * @param {number} config.threshold - A fraction between 0 and 1 representing the minimum
 *        proportion of total volume required for a node to be considered high volume.
 *
 * @returns {IHighVolumeNode[]} An array of high volume nodes, each containing price, total volume,
 *          ask volume, and bid volume.
 *
 * @example
 * const trades = {
 *   "100.5": { volSumAsk: 500, volSumBid: 600 },
 *   "101.0": { volSumAsk: 300, volSumBid: 400 }
 * };
 * const totalVol = 1800;
 * const config = { threshold: 0.5 };
 * const highVolNodes = findHighVolumeNodes(trades, totalVol, config);
 * // Returns: [{ price: 100.5, totalVolume: 1100, askVolume: 500, bidVolume: 600 }]
 */
export function findHighVolumeNodes(orderflowTrades: { [price: number]: OrderFlowRow }, config: IFindHighVolumeNodeConfig): IHighVolumeNode[] {
  const { threshold } = config;

  const nodes: IHighVolumeNode[] = [];

  let totalVolume = 0;
  for (const row of Object.values(orderflowTrades)) {
    totalVolume += row.volSumAsk + row.volSumBid;
  }

  const effectiveThreshold = totalVolume * threshold;

  for (const [price, row] of Object.entries(orderflowTrades)) {
    const rowVolume = row.volSumAsk + row.volSumBid;

    if (rowVolume >= effectiveThreshold) {
      nodes.push({
        nodePrice: parseFloat(price),
        totalVolume,
        sellVolume: row.volSumAsk,
        buyVolume: row.volSumBid,
        nodeVolumePercent: round((row.volSumAsk + row.volSumBid) / totalVolume)
      });
    }
  }

  return nodes;
}
