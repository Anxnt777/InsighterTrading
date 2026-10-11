import React, { useState } from 'react';
import { NewsArticle } from '../../types/stock';
import { ExternalLink, Clock, Newspaper, AlertTriangle, RefreshCw } from 'lucide-react';

interface NewsFeedProps {
  articles: NewsArticle[];
  statusMessage?: string | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  symbol: string;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({
  articles,
  statusMessage,
  isLoading,
  error,
  onRetry,
  symbol,
}) => {
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

  const filteredArticles = articles.filter((art) => {
    if (filter === 'all') return true;
    return art.sentimentLabel.toLowerCase() === filter;
  });

  const formatDate = (isoString: string) => {
    try {
      const dt = new Date(isoString);
      return dt.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col space-y-4">
      {/* Header and Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-sm text-white">{symbol} Financial News Stream</h3>
          <span className="text-xs text-slate-500 font-mono">({articles.length})</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
          {(['all', 'positive', 'neutral', 'negative'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded capitalize font-medium transition ${
                filter === tab
                  ? tab === 'positive'
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : tab === 'negative'
                    ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                    : tab === 'neutral'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {!isLoading && statusMessage && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          {statusMessage}
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="flex space-x-2">
                <div className="h-3 bg-slate-800 rounded w-20"></div>
                <div className="h-3 bg-slate-800 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 rounded text-xs flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredArticles.length === 0 && (
        <div className="py-10 text-center text-slate-500 space-y-2">
          <Newspaper className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-sm">No articles found matching filter '{filter}' for {symbol}.</p>
        </div>
      )}

      {/* Articles Stream */}
      {!isLoading && !error && filteredArticles.length > 0 && (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {filteredArticles.map((article, idx) => {
            const label = article.sentimentLabel.toLowerCase();
            const scores = article.sentimentScores;
            const primaryConfidence =
              label === 'positive'
                ? scores.positive
                : label === 'negative'
                ? scores.negative
                : scores.neutral;

            return (
              <div
                key={idx}
                className="group p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/40 border border-slate-800/80 transition flex flex-col space-y-2.5"
              >
                {/* Headline with external link */}
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sm text-slate-200 group-hover:text-blue-400 transition leading-snug line-clamp-2"
                  >
                    {article.headline}
                  </a>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 group-hover:text-blue-400 p-1 flex-shrink-0 transition"
                    title="Read Original Article"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Metadata Row & Sentiment Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Left: Source and Time */}
                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="font-semibold text-slate-300">{article.source}</span>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>

                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                      article.isDemo
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {article.isDemo ? 'Demo article' : `RSS · ${article.dataSource}`}
                    </span>
                  </div>

                  {/* Right: FinBERT Sentiment Badge with probability breakdown */}
                  <div className="flex items-center space-x-2">
                    <div
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] uppercase tracking-wider border flex items-center space-x-1.5 ${
                        label === 'positive'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : label === 'negative'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <span>{label}</span>
                      <span className="font-mono text-[10px] opacity-80">
                        {(primaryConfidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Mini Probabilities Bar */}
                    <div
                      className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800"
                      title={`Pos: ${(scores.positive * 100).toFixed(0)}% | Neu: ${(scores.neutral * 100).toFixed(0)}% | Neg: ${(scores.negative * 100).toFixed(0)}%`}
                    >
                      <div style={{ width: `${scores.positive * 100}%` }} className="bg-emerald-500" />
                      <div style={{ width: `${scores.neutral * 100}%` }} className="bg-amber-400" />
                      <div style={{ width: `${scores.negative * 100}%` }} className="bg-rose-500" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
