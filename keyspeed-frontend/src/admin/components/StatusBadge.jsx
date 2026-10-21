import React from 'react';

export default function StatusBadge({ status, label }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();
  const displayLabel = label || status;

  let styleClass = 'bg-surface text-fg/70 border-border';

  if (['active', 'approved', 'admin', 'live'].includes(normalized)) {
    styleClass = 'bg-accent-soft text-accent border-accent/30';
  } else if (['banned', 'rejected', 'error', 'danger'].includes(normalized)) {
    styleClass = 'bg-danger-soft text-danger border-danger/30';
  } else if (['pending', 'warning'].includes(normalized)) {
    styleClass = 'bg-fg/10 text-fg border-border-strong';
  } else if (['user', 'solo', 'none', 'info'].includes(normalized)) {
    styleClass = 'bg-surface text-fg/80 border-border';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {displayLabel}
    </span>
  );
}

