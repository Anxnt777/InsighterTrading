import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Top metrics skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="h-4 bg-slate-800 rounded w-1/2 mb-3"></div>
            <div className="h-7 bg-slate-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Main chart skeleton */}
      <div className="h-96 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-slate-800 rounded w-1/4"></div>
          <div className="h-8 bg-slate-800 rounded w-36"></div>
        </div>
        <div className="flex items-center justify-center text-slate-500 font-medium text-sm">
          Fetching market data & computing technical indicators...
        </div>
        <div className="h-4 bg-slate-800 rounded w-full"></div>
      </div>
    </div>
  );
};
