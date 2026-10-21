import React from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  data = [],
  isLoading,
  emptyTitle,
  emptyDescription,
  sortField,
  sortOrder,
  onSort,
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  rowKey = '_id',
  onRowClick,
}) {
  if (isLoading) {
    return <TableSkeleton rows={6} cols={columns.length + (onSelectRow ? 1 : 0)} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="sticky top-0 z-10 bg-surface/90 backdrop-blur-sm border-b border-border text-xs uppercase tracking-wider text-fg/60">
          <tr>
            {onSelectRow && (
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent cursor-pointer"
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => {
              const isSorted = sortField === col.key;
              const canSort = col.sortable && onSort;

              return (
                <th
                  key={col.key}
                  className={`py-3 px-4 font-semibold ${col.className || ''} ${
                    canSort ? 'cursor-pointer select-none hover:text-fg' : ''
                  }`}
                  onClick={() => canSort && onSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {canSort && (
                      <span className="text-fg/40">
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-accent" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-accent" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {data.map((row, index) => {
            const id = row[rowKey] || index;
            const isSelected = selectedIds.includes(id);

            return (
              <tr
                key={id}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 hover:bg-surface-hover ${
                  isSelected ? 'bg-accent-soft/40' : ''
                } ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {onSelectRow && (
                  <td
                    className="py-3 px-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onSelectRow(id, e.target.checked)}
                      className="rounded border-border text-accent focus:ring-accent cursor-pointer"
                      aria-label={`Select row ${id}`}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={`py-3 px-4 ${col.className || ''}`}>
                    {col.render ? col.render(row[col.key], row, index) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

