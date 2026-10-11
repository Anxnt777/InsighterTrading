import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  ColorType,
} from 'lightweight-charts';
import { HistoricalBar } from '../types/stock';
import { Eye, EyeOff } from 'lucide-react';

interface StockChartProps {
  symbol: string;
  bars: HistoricalBar[];
}

export const StockChart: React.FC<StockChartProps> = ({ symbol, bars }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  // Series references
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const sma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Indicator & View Toggles
  const [chartType, setChartType] = useState<'candles' | 'area'>('candles');
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current || bars.length === 0) return;

    // Clean up any existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0F19' },
        textColor: '#94A3B8',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#1E293B', style: 1 },
        horzLines: { color: '#1E293B', style: 1 },
      },
      crosshair: {
        vertLine: { color: '#475569', width: 1, style: 3 },
        horzLine: { color: '#475569', width: 1, style: 3 },
      },
      timeScale: {
        borderColor: '#1E293B',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1E293B',
      },
      height: 420,
    });

    chartInstanceRef.current = chart;

    // 1. Volume Series (Histogram at bottom)
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    const volumeData: HistogramData[] = bars.map((b) => ({
      time: b.time as any,
      value: b.volume,
      color: b.close >= b.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
    }));
    volumeSeries.setData(volumeData);

    // 2. Candlestick Series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });
    candleSeriesRef.current = candleSeries;

    const candleData: CandlestickData[] = bars.map((b) => ({
      time: b.time as any,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));
    candleSeries.setData(candleData);

    // 3. Area Series (Alternate view)
    const areaSeries = chart.addAreaSeries({
      topColor: 'rgba(59, 130, 246, 0.4)',
      bottomColor: 'rgba(59, 130, 246, 0.0)',
      lineColor: '#3B82F6',
      lineWidth: 2,
    });
    areaSeriesRef.current = areaSeries;
    const areaData = bars.map((b) => ({
      time: b.time as any,
      value: b.close,
    }));
    areaSeries.setData(areaData);
    areaSeries.applyOptions({ visible: chartType === 'area' });
    candleSeries.applyOptions({ visible: chartType === 'candles' });

    // 4. SMA-20 Overlay (Gold)
    const sma20Series = chart.addLineSeries({
      color: '#F59E0B',
      lineWidth: 2,
      title: 'SMA 20',
    });
    sma20SeriesRef.current = sma20Series;
    const sma20Data: LineData[] = bars
      .filter((b) => b.sma20 !== null && b.sma20 !== undefined)
      .map((b) => ({
        time: b.time as any,
        value: b.sma20 as number,
      }));
    sma20Series.setData(sma20Data);
    sma20Series.applyOptions({ visible: showSma20 });

    // 5. SMA-50 Overlay (Sky Blue)
    const sma50Series = chart.addLineSeries({
      color: '#38BDF8',
      lineWidth: 2,
      title: 'SMA 50',
    });
    sma50SeriesRef.current = sma50Series;
    const sma50Data: LineData[] = bars
      .filter((b) => b.sma50 !== null && b.sma50 !== undefined)
      .map((b) => ({
        time: b.time as any,
        value: b.sma50 as number,
      }));
    sma50Series.setData(sma50Data);
    sma50Series.applyOptions({ visible: showSma50 });

    chart.timeScale().fitContent();

    // Responsive resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [bars]);

  // Sync toggles without rebuilding chart
  useEffect(() => {
    if (candleSeriesRef.current && areaSeriesRef.current) {
      candleSeriesRef.current.applyOptions({ visible: chartType === 'candles' });
      areaSeriesRef.current.applyOptions({ visible: chartType === 'area' });
    }
  }, [chartType]);

  useEffect(() => {
    if (sma20SeriesRef.current) {
      sma20SeriesRef.current.applyOptions({ visible: showSma20 });
    }
  }, [showSma20]);

  useEffect(() => {
    if (sma50SeriesRef.current) {
      sma50SeriesRef.current.applyOptions({ visible: showSma50 });
    }
  }, [showSma50]);

  useEffect(() => {
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({ visible: showVolume });
    }
  }, [showVolume]);

  const latestBar = bars[bars.length - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-base text-white">{symbol} Price Action</h3>
            <span className="text-xs text-slate-400 font-mono">
              Last Close: ${latestBar?.close.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
            {latestBar?.rsi14 && (
              <span>
                RSI(14):{' '}
                <strong
                  className={
                    latestBar.rsi14 >= 70
                      ? 'text-rose-400'
                      : latestBar.rsi14 <= 30
                      ? 'text-emerald-400'
                      : 'text-slate-200'
                  }
                >
                  {latestBar.rsi14.toFixed(1)}
                </strong>
              </span>
            )}
            {latestBar?.volatility20d != null && (
              <span>
                20d Vol: <strong className="text-slate-200">{(latestBar.volatility20d * 100).toFixed(1)}%</strong>
              </span>
            )}
          </div>
        </div>

        {/* Chart View & Indicator Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Toggle */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setChartType('candles')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                chartType === 'candles' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                chartType === 'area' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Area
            </button>
          </div>

          {/* SMA 20 Toggle */}
          <button
            onClick={() => setShowSma20(!showSma20)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              showSma20
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {showSma20 ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>SMA 20</span>
          </button>

          {/* SMA 50 Toggle */}
          <button
            onClick={() => setShowSma50(!showSma50)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              showSma50
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {showSma50 ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>SMA 50</span>
          </button>

          {/* Volume Toggle */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              showVolume
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {showVolume ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Volume</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div ref={chartContainerRef} className="w-full relative min-h-[420px]" />
    </div>
  );
};
