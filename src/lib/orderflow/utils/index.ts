import { OrderFlowRow } from '../../../types'

export function adjustOrderFlowResolution(
  data: { [price: number]: OrderFlowRow },
  tickSize: number,
  tickMultiplier: number
): { [normalisedPrice: number]: OrderFlowRow } {
  const orderflowTrades: { [normalisedPrice: number]: OrderFlowRow } = Object.create(null)
  const tickSizeMultiplied = tickSize * tickMultiplier
  const prices = Object.keys(data)
  const len = prices.length

  for (let i = 0; i < len; i++) {
    const price = prices[i]
    const row = data[price]
    const normalisedPrice = Math.floor(+price / tickSizeMultiplied) * tickSizeMultiplied

    if (orderflowTrades[normalisedPrice]) {
      orderflowTrades[normalisedPrice].volSumAsk += row.volSumAsk
      orderflowTrades[normalisedPrice].volSumBid += row.volSumBid
    } else {
      orderflowTrades[normalisedPrice] = {
        volSumAsk: row.volSumAsk,
        volSumBid: row.volSumBid
      }
    }
  }

  return orderflowTrades
}
