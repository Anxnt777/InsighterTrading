export interface HistoricalBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20?: number | null;
  sma50?: number | null;
  rsi14?: number | null;
  volatility20d?: number | null;
}

export interface StockMetadata {
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number;
}

export interface StockHistoryResponse {
  symbol: string;
  companyName: string;
  currency: string;
  exchange: string;
  period: string;
  dataCount: number;
  isDemo: boolean;
  dataSource: string;
  statusMessage?: string | null;
  metadata: StockMetadata;
  bars: HistoricalBar[];
}

export interface WatchlistStock {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
}
