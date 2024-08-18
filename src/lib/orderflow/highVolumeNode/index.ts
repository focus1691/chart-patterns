import { OrderFlowRow, IHighVolumeNode, IFindHighVolumeNodeConfig } from '../../../types'

export function findHighVolumeNodes(orderflowTrades: { [price: number]: OrderFlowRow }, totalVolume: number, config: IFindHighVolumeNodeConfig): IHighVolumeNode[] {
  const { threshold } = config

  const nodes: IHighVolumeNode[] = []

  const effectiveThreshold = totalVolume * threshold

  for (const [price, row] of Object.entries(orderflowTrades)) {
    const totalVolume = row.volSumAsk + row.volSumBid

    if (totalVolume >= effectiveThreshold) {
      nodes.push({
        price: parseFloat(price),
        totalVolume,
        askVolume: row.volSumAsk,
        bidVolume: row.volSumBid
      })
    }
  }

  return nodes
}
