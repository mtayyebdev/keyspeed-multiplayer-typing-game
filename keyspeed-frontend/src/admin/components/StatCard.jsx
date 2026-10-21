import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`p-5 rounded-2xl bg-surface border border-border shadow-card flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-medium text-fg/60 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight font-mono">
          {value !== undefined && value !== null ? value : '—'}
        </div>
        {trend && (
          <span className="text-xs font-semibold text-accent bg-accent-soft px-2 py-0.5 rounded-full border border-accent/20">
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-fg/50 mt-2">{subtitle}</p>}
    </motion.div>
  );
}

