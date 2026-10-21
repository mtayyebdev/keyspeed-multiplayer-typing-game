import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AccuracyPieChart({
  data = [],
  title = 'Accuracy & Keystrokes',
  centerLabel = 'Accuracy',
  centerValue = '100%',
  size = 200,
  donutWidth = 24,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = data.reduce((acc, item) => acc + (item.value || 0), 0);
  const radius = (size - donutWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;
  const displayLabel = activeItem ? activeItem.label : centerLabel;
  const displayValue = activeItem
    ? `${activeItem.value} (${total > 0 ? Math.round((activeItem.value / total) * 100) : 0}%)`
    : centerValue;

  return (
    <div className="w-full rounded-2xl p-4 sm:p-5 border border-border bg-surface shadow-card flex flex-col justify-between">
      {title && (
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
          <span className="text-xs font-bold uppercase tracking-wider text-fg">
            {title}
          </span>
          <span className="text-[11px] font-mono text-fg/60">
            {total} Total
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-around gap-4 my-auto">
        {/* SVG Donut / Pie */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90 select-none"
          >
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="rgb(var(--fg-rgb) / 0.1)"
              strokeWidth={donutWidth}
            />

            {total > 0 &&
              data.map((item, index) => {
                const percent = (item.value || 0) / total;
                const strokeDasharray = `${percent * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedPercent * circumference;
                accumulatedPercent += percent;

                const isHovered = hoveredIndex === index;
                const segmentColor = item.type === 'error'
                  ? 'rgb(var(--danger-rgb))'
                  : 'rgb(var(--accent-rgb))';

                return (
                  <motion.circle
                    key={item.label || index}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={segmentColor}
                    strokeWidth={isHovered ? donutWidth + 3 : donutWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-200 cursor-pointer"
                    initial={{ strokeDasharray: `0 ${circumference}` }}
                    animate={{ strokeDasharray }}
                    transition={{ duration: 0.8, delay: index * 0.15 }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-fg/60">
              {displayLabel}
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-fg tracking-tight mt-0.5">
              {displayValue}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 w-full max-w-[180px]">
          {data.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const pct = total > 0 ? Math.round(((item.value || 0) / total) * 100) : 0;
            const dotColor = item.type === 'error'
              ? 'rgb(var(--danger-rgb))'
              : 'rgb(var(--accent-rgb))';

            return (
              <div
                key={item.label || idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between text-xs p-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                  isHovered
                    ? 'bg-surface-hover border-border-strong shadow-sm'
                    : 'bg-bg border-border hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span className={`truncate ${isHovered ? 'text-fg font-semibold' : 'text-fg/80'}`}>
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0 ml-2">
                  <span className="font-bold text-fg">{item.value}</span>
                  <span className="text-fg/60">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
