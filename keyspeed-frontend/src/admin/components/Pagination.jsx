import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  page,
  totalPages,
  limit,
  total,
  onPageChange,
  onLimitChange,
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-border bg-surface/50 text-xs text-fg/70">
      {/* Information & Page size */}
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-semibold text-fg">{from}</span>–
          <span className="font-semibold text-fg">{to}</span> of{' '}
          <span className="font-semibold text-fg">{total}</span>
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-border bg-surface text-fg hover:bg-surface-hover hover:border-strong disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all active:scale-95"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 font-medium text-fg">
          Page {page} of {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-border bg-surface text-fg hover:bg-surface-hover hover:border-strong disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all active:scale-95"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

