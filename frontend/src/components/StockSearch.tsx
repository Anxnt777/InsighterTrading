import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface StockSearchProps {
  currentSymbol: string;
  currentPeriod: string;
  onSearch: (symbol: string) => void;
  onPeriodChange: (period: string) => void;
  isLoading: boolean;
}

const POPULAR_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA', 'AMZN'];
const PERIOD_OPTIONS = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
  { label: '5Y', value: '5y' },
];

export const StockSearch: React.FC<StockSearchProps> = ({
  currentSymbol,
  currentPeriod,
  onSearch,
  onPeriodChange,
  isLoading,
}) => {
  const [inputVal, setInputVal] = useState(currentSymbol);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim().toUpperCase());
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Search Input & Quick Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        <form onSubmit={handleSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search stock ticker (e.g. AAPL, NVDA)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase font-mono tracking-wider"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Analyze'}
          </button>
        </form>

        {/* Quick Tickers */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-xs text-slate-500 hidden xl:inline">Popular:</span>
          {POPULAR_TICKERS.map((ticker) => (
            <button
              key={ticker}
              onClick={() => {
                setInputVal(ticker);
                onSearch(ticker);
              }}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition ${
                currentSymbol === ticker
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {ticker}
            </button>
          ))}
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPeriodChange(opt.value)}
            className={`px-3 py-1 text-xs font-semibold rounded transition ${
              currentPeriod === opt.value
                ? 'bg-slate-800 text-blue-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
