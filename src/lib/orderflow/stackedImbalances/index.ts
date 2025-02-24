import { ImbalanceSide } from '../../../constants';
import { IStackedImbalanceConfig, IStackedImbalancesResult, Imbalance, OrderFlowRow } from '../../../types/orderflow';

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
  const sortedPrices = Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b);

  for (const price of sortedPrices) {
    const orderFlowRow = data[price.toString()];

    if (!orderFlowRow) {
      continue;
    }

    const EPSILON = 0.01;
    // When volSumBid dominates (more limit sells) = SELLING pressure
    if (orderFlowRow.volSumAsk <= EPSILON && orderFlowRow.volSumBid > EPSILON) {
      imbalances.push({
        price,
        imbalanceSide: ImbalanceSide.SELLING_IMBALANCE,
        volSumAsk: orderFlowRow.volSumAsk,
        volSumBid: orderFlowRow.volSumBid
      });
    } 
    // When volSumAsk dominates (more limit buys) = BUYING pressure
    else if (orderFlowRow.volSumBid <= EPSILON && orderFlowRow.volSumAsk > EPSILON) {
      imbalances.push({
        price,
        imbalanceSide: ImbalanceSide.BUYING_IMBALANCE,
        volSumAsk: orderFlowRow.volSumAsk,
        volSumBid: orderFlowRow.volSumBid
      });
    } else {
      const ratio = threshold / 100;

      // When volSumBid dominates = SELLING pressure
      if (orderFlowRow.volSumBid > orderFlowRow.volSumAsk * ratio) {
        imbalances.push({
          price,
          imbalanceSide: ImbalanceSide.SELLING_IMBALANCE,
          volSumAsk: orderFlowRow.volSumAsk,
          volSumBid: orderFlowRow.volSumBid
        });
      } 
      // When volSumAsk dominates = BUYING pressure
      else if (orderFlowRow.volSumAsk > orderFlowRow.volSumBid * ratio) {
        imbalances.push({
          price,
          imbalanceSide: ImbalanceSide.BUYING_IMBALANCE,
          volSumAsk: orderFlowRow.volSumAsk,
          volSumBid: orderFlowRow.volSumBid
        });
      }
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
export function detectStackedImbalances(data: { [price: number]: OrderFlowRow }, config: IStackedImbalanceConfig = {}): IStackedImbalancesResult[] {
  const threshold = config.threshold ?? DEFAULT_THRESHOLD;
  const stackCount = config.stackCount ?? DEFAULT_STACK_COUNT;
  const tickSize = config.tickSize ?? 1;

  const imbalances = detectImbalances(data, threshold);
  const stackedImbalances: IStackedImbalancesResult[] = [];
  let currentStack: Imbalance[] = [];
  let lastImbalance: Imbalance | null = null;

  for (const imbalance of imbalances) {
    const { price: imbalancePrice, imbalanceSide } = imbalance;

    if (lastImbalance) {
      const priceDiff = Math.abs(imbalancePrice - lastImbalance.price);
    }

    const isDiagonallyConsecutive =
      lastImbalance === null || (Math.abs(imbalancePrice - lastImbalance.price) <= tickSize * 3 && imbalance.imbalanceSide === lastImbalance.imbalanceSide);

    if (isDiagonallyConsecutive) {
      currentStack.push(imbalance);
    } else {
      if (currentStack.length > 0) {
        addStackRangeIfValid(currentStack, stackCount, stackedImbalances, lastImbalance!.imbalanceSide);
      }
      currentStack = [imbalance];
    }

    lastImbalance = imbalance;
  }

  if (currentStack.length > 0) {
    addStackRangeIfValid(currentStack, stackCount, stackedImbalances, currentStack[0].imbalanceSide);
  }

  return stackedImbalances;
}
