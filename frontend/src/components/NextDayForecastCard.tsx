import React from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Brain } from 'lucide-react';
import { NextDayForecast } from '../types/stock';

interface NextDayForecastCardProps {
  forecast: NextDayForecast | null;
  isLoading: boolean;
  error: string | null;
  symbol: string;
}

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

export const NextDayForecastCard: React.FC<NextDayForecastCardProps> = ({ forecast, isLoading, error, symbol }) => (
  <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
      <div className="flex items-center space-x-2">
        <Brain className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="font-bold text-sm text-white">{symbol} Next Session Direction</h3>
          <p className="text-[11px] text-slate-400">Experimental estimate · Logistic Regression</p>
        </div>
      </div>
      <span className="text-[10px] text-amber-300 border border-amber-500/30 bg-amber-500/10 rounded px-2 py-1">Research only</span>
    </div>

    {isLoading ? (
      <p className="text-xs text-slate-400 animate-pulse">Evaluating historical price direction…</p>
    ) : error || forecast?.status !== 'available' ? (
      <div className="flex items-start gap-2 text-xs text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{error || forecast?.statusMessage || 'Forecast unavailable.'}</span>
      </div>
    ) : (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={`flex items-center gap-2 font-semibold ${forecast.predictedDirection === 'higher' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {forecast.predictedDirection === 'higher' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
            <span>Estimated {forecast.predictedDirection}</span>
          </div>
          <div className="text-xs text-slate-300">
            P(higher) <strong className="font-mono text-white">{percent(forecast.probabilityHigher ?? 0)}</strong>
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          Cutoff: {forecast.asOf} close ${forecast.currentClose?.toFixed(2)} · horizon: next trading session
          {forecast.targetDate ? ` (${forecast.targetDate})` : ''} · {forecast.trainingObservations} labeled sessions
        </p>
        {forecast.evaluation && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
            <Metric label="Test accuracy" value={percent(forecast.evaluation.accuracy)} />
            <Metric label="Precision" value={percent(forecast.evaluation.precision)} />
            <Metric label="Recall" value={percent(forecast.evaluation.recall)} />
            <Metric label="Majority baseline" value={percent(forecast.evaluation.majorityBaseline.accuracy)} />
            <Metric label="Test samples" value={String(forecast.evaluation.testSampleCount)} />
          </div>
        )}
        <p className="text-[10px] text-slate-500">{forecast.disclaimer}</p>
      </>
    )}
  </section>
);

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2">
    <div className="text-slate-500">{label}</div>
    <div className="font-mono text-slate-200 mt-1">{value}</div>
  </div>
);
