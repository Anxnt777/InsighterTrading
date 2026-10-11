import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { StockSearch } from './components/StockSearch';
import { StockMetricsCard } from './components/StockMetricsCard';
import { StockChart } from './components/StockChart';
import { WatchlistPanel } from './components/WatchlistPanel';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { stockApi } from './api/stockApi';
import { StockHistoryResponse } from './types/stock';
import { AlertCircle, RefreshCw, Cpu, Brain, LineChart, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [period, setPeriod] = useState('1y');
  const [data, setData] = useState<StockHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const fetchStock = async (tickerToFetch: string, periodToFetch: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await stockApi.getStockHistory(tickerToFetch, periodToFetch);
      setData(response);
      setBackendConnected(true);
    } catch (err: any) {
      console.error('Failed to load stock data:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to communicate with the Spring Boot backend gateway at http://localhost:8080.'
      );
      setBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Health check check once
    stockApi.getHealth()
      .then(() => setBackendConnected(true))
      .catch(() => setBackendConnected(false));

    fetchStock(symbol, period);
  }, [symbol, period]);

  const handleSearch = (newSymbol: string) => {
    setSymbol(newSymbol);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar backendConnected={backendConnected} isDemoMode={data?.isDemo ?? false} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search & Period Selector */}
        <StockSearch
          currentSymbol={symbol}
          currentPeriod={period}
          onSearch={handleSearch}
          onPeriodChange={handlePeriodChange}
          isLoading={isLoading}
        />

        {/* Error State */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start space-x-3 text-rose-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Connection or Request Error</h4>
              <p className="text-xs text-rose-300/90 mt-1">{error}</p>
              <div className="mt-3 flex items-center space-x-2">
                <button
                  onClick={() => fetchStock(symbol, period)}
                  className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 rounded text-xs font-medium flex items-center space-x-1 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Request</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && <LoadingSkeleton />}

        {/* Main Content Dashboard */}
        {!isLoading && data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Columns: Chart & Metrics */}
            <div className="lg:col-span-8 space-y-6">
              <StockMetricsCard data={data} />
              <StockChart symbol={data.symbol} bars={data.bars} />
            </div>

            {/* Right 4 Columns: Watchlist & Multi-Tier AI Roadmap */}
            <div className="lg:col-span-4 space-y-6">
              <WatchlistPanel
                currentSymbol={symbol}
                onSelectStock={handleSearch}
                currentPrice={data.metadata.currentPrice}
                currentChange={data.metadata.changePercent}
              />

              {/* Multi-Tier Platform Architecture & Milestone Tracker */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-semibold text-xs text-white uppercase tracking-wider">
                    Platform Milestones & Architecture
                  </h4>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <LineChart className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-emerald-300">Milestone 1: Market MVP (Active)</div>
                      <div className="text-[11px] text-slate-400">
                        Historical OHLCV, SMA-20, SMA-50, RSI-14, Volatility via Spring Boot & FastAPI.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 opacity-75">
                    <Brain className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-200">Milestone 2: FinBERT Sentiment</div>
                      <div className="text-[11px] text-slate-400">
                        News feed ingestion + HuggingFace FinBERT sentiment polarity scoring.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80 opacity-75">
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-200">Milestone 3 & 4: Trend Classification & XAI</div>
                      <div className="text-[11px] text-slate-400">
                        Bullish/Bearish prediction with TimeSeriesSplit validation and SHAP explainability.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>InsighterTrading Major Project © 2026. For academic demonstration and decision support only.</p>
      </footer>
    </div>
  );
};

export default App;
