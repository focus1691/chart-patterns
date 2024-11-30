export interface IHighVolumeNode {
  nodePrice: number;
  totalVolume: number;
  sellVolume: number;
  buyVolume: number;
  nodeVolumePercent: number;
}

export interface IFindHighVolumeNodeConfig {
  threshold: number;
}
