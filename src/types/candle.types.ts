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

export interface ITrade {
  price: number;
  volume: number;
  isBuyer: boolean;
  time: Date | string | number;
}
