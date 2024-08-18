export interface IHighVolumeNode {
  price: number
  totalVolume: number
  askVolume: number
  bidVolume: number
}

export interface IFindHighVolumeNodeConfig {
  threshold: number
}
