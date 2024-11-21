export interface ICandle {
  symbol: string;
  interval: string;
  openTime: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: Date;
}
