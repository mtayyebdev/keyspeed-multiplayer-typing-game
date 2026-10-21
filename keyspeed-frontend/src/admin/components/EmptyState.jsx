import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items matching your criteria.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-fg/50 mb-3 shadow-card">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-fg mb-1">{title}</h3>
      <p className="text-sm text-fg/60 max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

