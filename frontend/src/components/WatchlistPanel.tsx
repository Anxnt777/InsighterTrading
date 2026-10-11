import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { WatchlistStock } from '../types/stock';

interface WatchlistPanelProps {
  currentSymbol: string;
  onSelectStock: (symbol: string) => void;
  currentPrice?: number;
  currentChange?: number;
}

const DEFAULT_WATCHLIST: WatchlistStock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
];

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  currentSymbol,
  onSelectStock,
  currentPrice,
  currentChange,
}) => {
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>(() => {
    try {
      const saved = localStorage.getItem('insighter_watchlist');
      return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    } catch {
      return DEFAULT_WATCHLIST;
    }
  });

  const [newTicker, setNewTicker] = useState('');

  const saveList = (updated: WatchlistStock[]) => {
    setWatchlist(updated);
    try {
      localStorage.setItem('insighter_watchlist', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage', e);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTicker.trim().toUpperCase();
    if (!clean) return;

    if (!watchlist.some((item) => item.symbol === clean)) {
      const updated = [...watchlist, { symbol: clean, name: clean }];
      saveList(updated);
    }
    setNewTicker('');
  };

  const handleRemove = (symbolToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = watchlist.filter((item) => item.symbol !== symbolToRemove);
    saveList(updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-sm text-white">Watchlist</h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">{watchlist.length} items</span>
      </div>

      {/* Add Ticker Input */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value)}
          placeholder="+ Add Symbol..."
          className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs uppercase font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition"
          title="Add to Watchlist"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Watchlist Items */}
      <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
        {watchlist.map((item) => {
          const isSelected = item.symbol === currentSymbol;
          const displayPrice = isSelected && currentPrice ? currentPrice : item.price;
          const displayChange = isSelected && currentChange !== undefined ? currentChange : item.change;

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectStock(item.symbol)}
              className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition border ${
                isSelected
                  ? 'bg-blue-600/10 border-blue-500/40 text-white'
                  : 'bg-slate-950/60 border-slate-800/60 hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <div>
                <div className="font-mono font-bold text-xs">{item.symbol}</div>
                <div className="text-[11px] text-slate-500 truncate max-w-[110px]">{item.name}</div>
              </div>

              <div className="flex items-center space-x-2">
                {displayPrice !== undefined && (
                  <div className="text-right">
                    <div className="text-xs font-semibold">${displayPrice.toFixed(2)}</div>
                    {displayChange !== undefined && (
                      <div
                        className={`text-[10px] flex items-center justify-end font-medium ${
                          displayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {displayChange >= 0 ? (
                          <ArrowUpRight className="w-3 h-3 mr-0.5" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 mr-0.5" />
                        )}
                        {displayChange.toFixed(2)}%
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={(e) => handleRemove(item.symbol, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition"
                  title="Remove from Watchlist"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
