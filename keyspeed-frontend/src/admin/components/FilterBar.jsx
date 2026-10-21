import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function FilterBar({ children, onReset, className = '' }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-surface border border-border shadow-card ${className}`}
    >
      <div className="flex-1 flex flex-wrap items-center gap-2 min-w-[200px]">
        {children}
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className="p-2 rounded-xl border border-border bg-surface text-fg/60 hover:text-fg hover:bg-surface-hover hover:border-strong text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all duration-150 active:scale-95"
          title="Reset filters"
          aria-label="Reset all filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      )}
    </div>
  );
}

