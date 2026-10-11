import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Database } from 'lucide-react';
import { StockHistoryResponse } from '../types/stock';

interface StockMetricsCardProps {
  data: StockHistoryResponse;
}

export const StockMetricsCard: React.FC<StockMetricsCardProps> = ({ data }) => {
  const { symbol, companyName, metadata, isDemo, dataSource, statusMessage } = data;
  const isPositive = metadata.change >= 0;

  return (
    <div className="space-y-4">
      {/* Alert banner if demo fallback is active */}
      {isDemo && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start space-x-3 text-amber-300 text-xs">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold">Notice: Demo Data Fallback Active. </span>
            <span>
              {statusMessage ||
                'External market data feed could not be reached. Displaying labeled offline test data.'}
            </span>
          </div>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1: Current Price */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Price ({data.currency})</span>
            <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
              {symbol}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              ${metadata.currentPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-slate-400 truncate mt-1">{companyName}</div>
        </div>

        {/* Metric 2: Price Change */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-xs">Daily Change</span>
          <div className="mt-2 flex items-center space-x-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-400" />
            )}
            <span
              className={`text-2xl font-bold tracking-tight ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {metadata.change.toFixed(2)}
            </span>
          </div>
          <div
            className={`text-xs font-medium mt-1 ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {metadata.changePercent.toFixed(2)}%
          </div>
        </div>

        {/* Metric 3: 52-Week Range */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-slate-400 text-xs">52-Week Range</span>
          <div className="mt-2 flex items-baseline justify-between text-sm font-semibold">
            <span className="text-slate-300">
              ${metadata.fiftyTwoWeekLow?.toFixed(2) ?? 'N/A'}
            </span>
            <span className="text-slate-500 text-xs px-1">—</span>
            <span className="text-slate-300">
              ${metadata.fiftyTwoWeekHigh?.toFixed(2) ?? 'N/A'}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Prev: ${metadata.previousClose.toFixed(2)}</div>
        </div>

        {/* Metric 4: Volume & Data Source */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Volume</span>
            <div className="flex items-center space-x-1 text-[10px] text-slate-400">
              <Database className="w-3 h-3 text-blue-400" />
              <span>{dataSource}</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {metadata.volume ? (metadata.volume / 1_000_000).toFixed(2) + 'M' : 'N/A'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Bars: <span className="font-semibold text-slate-300">{data.dataCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
