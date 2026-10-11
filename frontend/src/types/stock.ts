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

export interface SentimentScores {
  positive: number;
  neutral: number;
  negative: number;
}

export interface NewsArticle {
  headline: string;
  source: string;
  publishedAt: string;
  url: string;
  ticker: string;
  sentimentLabel: 'positive' | 'negative' | 'neutral' | string;
  sentimentScores: SentimentScores;
  isDemo: boolean;
  dataSource: string;
}

export interface SentimentSummary {
  totalArticles: number;
  netSentimentScore: number;
  overallSentiment: 'Bullish' | 'Bearish' | 'Neutral' | string;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  averageScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
  aggregationMethod: string;
  modelUsed: string;
}

export interface StockNewsResponse {
  symbol: string;
  count: number;
  summary: SentimentSummary;
  articles: NewsArticle[];
  statusMessage?: string | null;
}

export interface ForecastEvaluation {
  split: string;
  testSampleCount: number;
  accuracy: number;
  precision: number;
  recall: number;
  confusionMatrix: number[][];
  confusionMatrixOrder: string;
  majorityBaseline: {
    majorityClass: 'higher' | 'lower';
    accuracy: number;
  };
}

export interface NextDayForecast {
  status: 'available' | 'unavailable';
  symbol: string;
  asOf: string | null;
  targetDate: string | null;
  currentClose: number | null;
  predictedDirection: 'higher' | 'lower' | null;
  probabilityHigher: number | null;
  model: string;
  trainingObservations: number | null;
  evaluation: ForecastEvaluation | null;
  dataSource: string | null;
  statusMessage: string | null;
  disclaimer: string;
}
