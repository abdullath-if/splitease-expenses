import React from 'react';

export const SkeletonCard = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
        >
          <div className="flex justify-between items-center">
            <div className="h-5 bg-slate-200 rounded-md w-1/2" />
            <div className="h-6 w-16 bg-slate-200 rounded-full" />
          </div>
          <div className="h-4 bg-slate-100 rounded-md w-3/4" />
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-6 bg-slate-200 rounded-lg w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonList = ({ count = 4 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200"
        >
          <div className="flex items-center space-x-3 w-1/2">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex-shrink-0" />
            <div className="space-y-1.5 w-full">
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          </div>
          <div className="h-5 bg-slate-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
};