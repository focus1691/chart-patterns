export interface OrderFlowRow {
  volSumAsk: number;
  volSumBid: number;
}

export interface IFootPrintCandle {
  symbol: string;
  interval: string;
  openTime: Date;
  openTimeMs: number;
  closeTimeMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: Date;
  trades: Record<string, OrderFlowRow>;
}
