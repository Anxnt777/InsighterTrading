import React from 'react';
import { SentimentSummary } from '../../types/stock';
import { Sparkles, TrendingUp, TrendingDown, Minus, Info, ShieldAlert } from 'lucide-react';

interface SentimentSummaryCardProps {
  summary: SentimentSummary;
  symbol: string;
}

export const SentimentSummaryCard: React.FC<SentimentSummaryCardProps> = ({ summary, symbol }) => {
  const isBullish = summary.overallSentiment === 'Bullish';
  const isBearish = summary.overallSentiment === 'Bearish';

  // Normalize Net Sentiment score [-1, +1] to progress percentage [0, 100] for visual slider
  const sliderPercentage = Math.min(100, Math.max(0, ((summary.netSentimentScore + 1) / 2) * 100));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-bold text-sm text-white">{symbol} Financial News Sentiment</h3>
            <span className="text-[11px] text-slate-400">
              Aggregated across {summary.totalArticles} analyzed articles
            </span>
          </div>
        </div>

        {/* Model Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          <span>{summary.modelUsed.includes('finbert') ? 'ProsusAI/FinBERT' : 'Lexicon Engine'}</span>
        </div>
      </div>

      {/* Main Verdict & Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left: Overall Sentiment State */}
        <div className="flex items-center space-x-3.5 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isBullish
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isBearish
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isBullish ? (
              <TrendingUp className="w-6 h-6" />
            ) : isBearish ? (
              <TrendingDown className="w-6 h-6" />
            ) : (
              <Minus className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Market Narrative Tone
            </div>
            <div
              className={`text-xl font-bold tracking-tight ${
                isBullish
                  ? 'text-emerald-400'
                  : isBearish
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {summary.overallSentiment} Sentiment
            </div>
          </div>
        </div>

        {/* Right: Net Sentiment Score Meter */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Net Sentiment Index</span>
            <span
              className={`font-mono font-bold text-sm ${
                summary.netSentimentScore > 0
                  ? 'text-emerald-400'
                  : summary.netSentimentScore < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {summary.netSentimentScore > 0 ? '+' : ''}
              {summary.netSentimentScore.toFixed(3)}
            </span>
          </div>

          {/* Slider track (-1.0 to +1.0) with position needle */}
          <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 opacity-60"></div>
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-900 z-10"></div>
            {/* Value Needle */}
            <div
              style={{ left: `${sliderPercentage}%` }}
              className="absolute top-0 bottom-0 w-1.5 -ml-0.5 bg-white shadow-sm z-20"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>-1.00 Bearish</span>
            <span>0.00 Neutral</span>
            <span>+1.00 Bullish</span>
          </div>
        </div>
      </div>

      {/* Distribution Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Sentiment Distribution</span>
          <span>{summary.totalArticles} Headlines</span>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          <div
            style={{ width: `${summary.positivePercent}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Positive: ${summary.positivePercent}%`}
          />
          <div
            style={{ width: `${summary.neutralPercent}%` }}
            className="bg-amber-400/80 transition-all duration-500"
            title={`Neutral: ${summary.neutralPercent}%`}
          />
          <div
            style={{ width: `${summary.negativePercent}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Negative: ${summary.negativePercent}%`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400">Positive:</span>
            <span className="font-semibold text-emerald-400">{summary.positivePercent}%</span>
          </div>
          <div className="flex items-center space-x-1.5 justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-400">Neutral:</span>
            <span className="font-semibold text-amber-300">{summary.neutralPercent}%</span>
          </div>
          <div className="flex items-center space-x-1.5 justify-end">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-400">Negative:</span>
            <span className="font-semibold text-rose-400">{summary.negativePercent}%</span>
          </div>
        </div>
      </div>

      {/* Academic Methodology & Research Disclaimer */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>Aggregation: (Σ P(Pos) - Σ P(Neg)) / N over window headlines</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>Research metric only; not predictive of asset returns</span>
        </div>
      </div>
    </div>
  );
};
