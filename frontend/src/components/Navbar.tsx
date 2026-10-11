import React from 'react';
import { TrendingUp, ShieldCheck, Activity } from 'lucide-react';

interface NavbarProps {
  backendConnected: boolean;
  isDemoMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ backendConnected, isDemoMode }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">InsighterTrading</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">AI Market Intelligence & Decision Support</p>
          </div>
        </div>

        {/* Center: Academic Research Disclaimer Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Academic Research Platform — Not Financial Advice</span>
        </div>

        {/* Right Status */}
        <div className="flex items-center space-x-3">
          {/* Data Mode Badge */}
          {isDemoMode ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Demo Data Fallback
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Market Data
            </span>
          )}

          {/* Backend Connection Indicator */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{backendConnected ? 'Gateway Online' : 'Gateway Offline'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
