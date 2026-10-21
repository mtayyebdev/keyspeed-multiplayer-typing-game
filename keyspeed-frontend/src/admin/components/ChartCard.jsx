import React from 'react';

export default function ChartCard({ title, subtitle, actions, children, className = '' }) {
  return (
    <div
      className={`p-5 rounded-2xl bg-surface border border-border shadow-card flex flex-col ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-fg tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-fg/60 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>

      <div className="flex-1 w-full min-h-[260px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

