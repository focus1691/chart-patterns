import { ImbalanceType } from '../../../constants'
import { IStackedImbalanceConfig, Imbalance, OrderFlowRow } from '../../../types/orderflow'

const DEFAULT_THRESHOLD = 300.0
const DEFAULT_STACK_COUNT = 3

/**
 * Detects imbalances in the order flow data based on the provided threshold.
 * 
 * @param data - The order flow data with price as key and OrderFlowRow as value.
 * @param threshold - The threshold percentage to determine an imbalance.
 * @returns An array of Imbalance objects.
 */
export function detectImbalances(data: { [price: number]: OrderFlowRow }, threshold: number = DEFAULT_THRESHOLD): Imbalance[] {
  const imbalances: Imbalance[] = [];
  const sortedPrices = Object.keys(data).map(parseFloat).sort((a, b) => a - b);

  sortedPrices.forEach(priceNumber => {
    const orderFlowRow = data[priceNumber];
    if (orderFlowRow.volSumBid >= (threshold / 100) * orderFlowRow.volSumAsk) {
      imbalances.push({ price: priceNumber, imbalanceType: ImbalanceType.SELLING_IMBALANCE, volSumAsk: orderFlowRow.volSumAsk, volSumBid: orderFlowRow.volSumBid });
    } else if (orderFlowRow.volSumAsk >= (threshold / 100) * orderFlowRow.volSumBid) {
      imbalances.push({ price: priceNumber, imbalanceType: ImbalanceType.BUYING_IMBALANCE, volSumAsk: orderFlowRow.volSumAsk, volSumBid: orderFlowRow.volSumBid });
    }
  });

  return imbalances;
}

/**
 * Adds the current stack of imbalances to the stacked imbalances if it meets the minimum stack count.
 * 
 * @param currentStack - The current stack of imbalances.
 * @param stackCount - The minimum number of consecutive imbalances required to form a stack.
 * @param stackedImbalances - The array of stacked imbalances to add to.
 */
function addStackIfValid(currentStack: Imbalance[], stackCount: number, stackedImbalances: Imbalance[][]): void {
  if (currentStack.length >= stackCount) {
    stackedImbalances.push([...currentStack]);
  }
}

/**
 * Detects stacked imbalances in the order flow data based on the provided configuration.
 * 
 * @param data - The order flow data with price as key and OrderFlowRow as value.
 * @param config - The configuration for detecting stacked imbalances.
 * @returns An array of arrays of Imbalance, where each inner array represents a group of stacked imbalances.
 */
export function detectStackedImbalances(
  data: { [price: number]: OrderFlowRow },
  config: IStackedImbalanceConfig = {}
): Imbalance[][] {
  const threshold = config.threshold ?? DEFAULT_THRESHOLD;
  const stackCount = config.stackCount ?? DEFAULT_STACK_COUNT;
  const imbalances = detectImbalances(data, threshold);
  const stackedImbalances: Imbalance[][] = [];
  let currentStack: Imbalance[] = [];
  let lastPrice: number | null = null;
  let lastImbalanceType: ImbalanceType | null = null;

  for (const imbalance of imbalances) {
    const isSameType = lastImbalanceType === null || imbalance.imbalanceType === lastImbalanceType;
    const isConsecutivePrice = lastPrice === null || Math.abs(imbalance.price - lastPrice - 0.1) < 1e-9;

    if (isSameType && isConsecutivePrice) {
      currentStack.push(imbalance);
    } else {
      addStackIfValid(currentStack, stackCount, stackedImbalances);
      currentStack = [imbalance];
    }

    lastImbalanceType = imbalance.imbalanceType;
    lastPrice = imbalance.price;
  }

  addStackIfValid(currentStack, stackCount, stackedImbalances);

  return stackedImbalances;
}