import { ImbalanceType } from '../../../constants'
import { IStackedImbalanceConfig, IStackedImbalancesResult, Imbalance, OrderFlowRow } from '../../../types/orderflow'

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
 * Adds the current stack range to the stacked imbalances if it meets the minimum stack count.
 * 
 * @param currentStack - The current stack of imbalances.
 * @param stackCount - The minimum number of consecutive imbalances required to form a stack.
 * @param stackedImbalances - The array of stacked imbalance ranges to add to.
 */
function addStackRangeIfValid(currentStack: Imbalance[], stackCount: number, stackedImbalances: IStackedImbalancesResult[]): void {
  if (currentStack.length >= stackCount) {
    stackedImbalances.push({
      startPrice: currentStack[0].price,
      endPrice: currentStack[currentStack.length - 1].price,
      count: currentStack.length,
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
export function detectStackedImbalances(
  data: { [price: number]: OrderFlowRow },
  config: IStackedImbalanceConfig = {}
): IStackedImbalancesResult[] {
  const threshold = config.threshold ?? DEFAULT_THRESHOLD;
  const stackCount = config.stackCount ?? DEFAULT_STACK_COUNT;
  const tickSize = config.tickSize
  const imbalances = detectImbalances(data, threshold);
  const stackedImbalances: IStackedImbalancesResult[] = [];
  let currentStack: Imbalance[] = [];
  let lastPrice: number | null = null;
  let lastImbalanceType: ImbalanceType | null = null;

  for (const imbalance of imbalances) {
    const isImbalanceSameSide = lastImbalanceType === null || imbalance.imbalanceType === lastImbalanceType;
    const isConsecutivePrice = lastPrice === null || Math.abs(imbalance.price - lastPrice - tickSize) < 1e-9;

    if (isImbalanceSameSide && isConsecutivePrice) {
      currentStack.push(imbalance);
    } else {
      addStackRangeIfValid(currentStack, stackCount, stackedImbalances);
      currentStack = [imbalance];
    }

    lastImbalanceType = imbalance.imbalanceType;
    lastPrice = imbalance.price;
  }

  addStackRangeIfValid(currentStack, stackCount, stackedImbalances);

  return stackedImbalances;
}