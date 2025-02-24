import { ImbalanceSide } from '../../../constants';
import { IStackedImbalanceConfig, IStackedImbalancesResult, Imbalance, OrderFlowRow } from '../../../types/orderflow';
import Decimal from 'decimal.js';

const DEFAULT_THRESHOLD = 300.0;
const DEFAULT_STACK_COUNT = 3;

/**
 * Detects imbalances in the order flow data based on the provided threshold.
 *
 * @param data - The order flow data with price as key and OrderFlowRow as value.
 * @param threshold - The threshold percentage to determine an imbalance.
 * @returns An array of Imbalance objects.
 */
export function detectImbalances(data: { [price: number]: OrderFlowRow }, threshold: number = DEFAULT_THRESHOLD): Imbalance[] {
  const imbalances: Imbalance[] = [];
  const sortedPrices = Object.keys(data).sort((a, b) => Number(a) - Number(b));

  for (const price of sortedPrices) {
    const orderFlowRow = data[price.toString()];

    if (!orderFlowRow) {
      continue;
    }

    const thresholdFactor = 1 + threshold / 100;

    if (orderFlowRow.volSumBid > thresholdFactor * orderFlowRow.volSumAsk) {
      imbalances.push({
        price,
        imbalanceSide: ImbalanceSide.SELLING_IMBALANCE,
        volSumAsk: orderFlowRow.volSumAsk,
        volSumBid: orderFlowRow.volSumBid
      });
    } else if (orderFlowRow.volSumAsk > thresholdFactor * orderFlowRow.volSumBid) {
      imbalances.push({
        price,
        imbalanceSide: ImbalanceSide.BUYING_IMBALANCE,
        volSumAsk: orderFlowRow.volSumAsk,
        volSumBid: orderFlowRow.volSumBid
      });
    }
  }

  return imbalances;
}

/**
 * Adds the current stack range to the stacked imbalances if it meets the minimum stack count.
 *
 * @param currentStack - The current stack of imbalances.
 * @param stackCount - The minimum number of consecutive imbalances required to form a stack.
 * @param stackedImbalances - The array of stacked imbalance ranges to add to.
 */
function addStackRangeIfValid(
  currentStack: Imbalance[],
  stackCount: number,
  stackedImbalances: IStackedImbalancesResult[],
  imbalanceSide: ImbalanceSide
): void {
  if (currentStack.length >= stackCount) {
    stackedImbalances.push({
      imbalanceStartAt: currentStack[0].price,
      imbalanceEndAt: currentStack[currentStack.length - 1].price,
      stackedCount: currentStack.length,
      imbalanceSide
    });
  }
}

/**
 * Detects stacked imbalances in the order flow data based on the provided configuration.
 *
 * @param data - The order flow data with price as key and OrderFlowRow as value.
 * @param config - The configuration for detecting stacked imbalances.
 * @returns An array of IStackedImbalancesResult, where each element represents the range of a stacked imbalance.
 */
export function detectStackedImbalances(data: { [price: number]: OrderFlowRow }, config: IStackedImbalanceConfig): IStackedImbalancesResult[] {
  const threshold = config.threshold || DEFAULT_THRESHOLD;
  const stackCount = config.stackCount || DEFAULT_STACK_COUNT;
  const tickSize = config.tickSize;

  const imbalances = detectImbalances(data, threshold);
  const stackedImbalances: IStackedImbalancesResult[] = [];

  if (imbalances.length === 0) return stackedImbalances;

  imbalances.sort((a, b) => Number(a.price) - Number(b.price));

  let currentStack: Imbalance[] = [imbalances[0]];

  for (let i = 1; i < imbalances.length; i++) {
    const prev = imbalances[i - 1];
    const curr = imbalances[i];

    const priceDiff = new Decimal(curr.price).minus(new Decimal(prev.price));
    const isNextTick = priceDiff.equals(new Decimal(tickSize));

    if (isNextTick && curr.imbalanceSide === prev.imbalanceSide) {
      currentStack.push(curr);
    } else {
      addStackRangeIfValid(currentStack, stackCount, stackedImbalances, currentStack[0].imbalanceSide);
      currentStack = [curr];
    }
  }

  addStackRangeIfValid(currentStack, stackCount, stackedImbalances, currentStack[0].imbalanceSide);

  return stackedImbalances;
}
