/**
 * Calculate the fraction of the portfolio to allocate to a bet using the Kelly Criterion,
 * considering stop loss and take profit percentages.
 *
 * @param winProbability - The probability of winning (in decimal, e.g., 0.6 for 60% probability).
 * @param stopLossPercentage - The percentage of the bet lost if the bet is lost (in decimal, e.g., 0.05 for 5% stop loss).
 * @param takeProfitPercentage - The percentage of the bet gained if the bet is won (in decimal, e.g., 0.1 for 10% take profit).
 * @returns The decimal ratio of the portfolio to allocate to this bet.
 * 
  * @example
 * ```typescript
 * const winProbability = 0.6; // 60% probability of winning the trade
 * const stopLossPercentage = 0.05; // 5% stop loss
 * const takeProfitPercentage = 0.1; // 10% take profit
 *
 * const fractionToBet = kellyCriterion(winProbability, stopLossPercentage, takeProfitPercentage);
 * console.log(`Fraction of portfolio to bet: ${fractionToBet}`);
 * ```
 */
export function kellyCriterion(winProbability: number, stopLossPercentage: number, takeProfitPercentage: number): number {
  if (winProbability <= 0 || winProbability >= 1) {
    throw new Error('Win probability must be between 0 and 1 exclusive.')
  }

  // Adjusted win and loss probabilities considering stop loss and take profit
  const adjustedWinProbability = winProbability * (1 - takeProfitPercentage)
  const adjustedLossProbability = (1 - winProbability) * stopLossPercentage

  // Calculate edge considering adjusted probabilities
  const edge = adjustedWinProbability - adjustedLossProbability

  return edge
}
