import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function PerformanceLineChart({
  data = [], // [{ label: '1s', value: 65, secondary?: 70 }]
  title = 'Typing Speed (WPM)',
  height = 180,
  showAverage = true,
  unit = 'WPM',
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const containerRef = useRef(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full rounded-2xl p-4 border border-border bg-surface shadow-card text-center text-xs text-fg/60 py-10">
        No speed data available
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 30);
  const minVal = Math.min(0, Math.min(...values));
  const avgVal = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  // SVG dimensions
  const svgWidth = 500;
  const svgHeight = height;
  const paddingX = 35;
  const paddingTop = 20;
  const paddingBottom = 25;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index) => {
    if (data.length <= 1) return paddingX + graphWidth / 2;
    return paddingX + (index / (data.length - 1)) * graphWidth;
  };

  const getY = (val) => {
    const range = maxVal - minVal || 1;
    return paddingTop + graphHeight - ((val - minVal) / range) * graphHeight;
  };

  // Build smooth cubic bezier curve
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;

  const handleMouseMove = (e) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = clientX / rect.width;
    const targetIndex = Math.min(
      data.length - 1,
      Math.max(0, Math.round(relativeX * (data.length - 1)))
    );
    setHoveredPoint({
      index: targetIndex,
      data: data[targetIndex],
      x: getX(targetIndex),
      y: getY(data[targetIndex].value),
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="w-full rounded-2xl p-4 sm:p-5 border border-border bg-surface shadow-card relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <span className="text-xs font-bold uppercase tracking-wider text-fg">
          {title}
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-fg/60">
            Peak: <span className="font-bold text-accent">{maxVal}</span> {unit}
          </span>
          {showAverage && (
            <span className="text-fg/60">
              Avg: <span className="font-bold text-fg">{avgVal}</span> {unit}
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full relative cursor-crosshair select-none"
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full overflow-visible"
          style={{ height: 'auto', maxHeight: height }}
        >
          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingTop}
            x2={svgWidth - paddingX}
            y2={paddingTop}
            stroke="rgb(var(--fg-rgb) / 0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingTop + graphHeight / 2}
            x2={svgWidth - paddingX}
            y2={paddingTop + graphHeight / 2}
            stroke="rgb(var(--fg-rgb) / 0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingTop + graphHeight}
            x2={svgWidth - paddingX}
            y2={paddingTop + graphHeight}
            stroke="rgb(var(--fg-rgb) / 0.15)"
          />

          {/* Y Axis Labels */}
          <text
            x={paddingX - 6}
            y={paddingTop + 4}
            textAnchor="end"
            className="text-[9px] fill-fg/60 font-mono"
          >
            {maxVal}
          </text>
          <text
            x={paddingX - 6}
            y={paddingTop + graphHeight / 2 + 3}
            textAnchor="end"
            className="text-[9px] fill-fg/60 font-mono"
          >
            {Math.round((maxVal + minVal) / 2)}
          </text>
          <text
            x={paddingX - 6}
            y={paddingTop + graphHeight}
            textAnchor="end"
            className="text-[9px] fill-fg/40 font-mono"
          >
            {minVal}
          </text>

          {/* Average Reference Line */}
          {showAverage && (
            <line
              x1={paddingX}
              y1={getY(avgVal)}
              x2={svgWidth - paddingX}
              y2={getY(avgVal)}
              stroke="rgb(var(--fg-rgb) / 0.35)"
              strokeDasharray="3 3"
              strokeWidth="1.2"
            />
          )}

          {/* Area Fill */}
          <path
            d={areaD}
            fill="rgb(var(--accent-rgb) / 0.12)"
          />

          {/* Line Stroke */}
          <motion.path
            d={pathD}
            fill="transparent"
            stroke="rgb(var(--accent-rgb))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* Data Points */}
          {data.length <= 30 &&
            points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="rgb(var(--bg-rgb))"
                stroke="rgb(var(--accent-rgb))"
                strokeWidth="2"
              />
            ))}

          {/* Interactive Scrubbing Cursor */}
          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={paddingTop + graphHeight}
                stroke="rgb(var(--accent-rgb) / 0.7)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="5"
                fill="rgb(var(--accent-rgb))"
                stroke="rgb(var(--bg-rgb))"
                strokeWidth="2"
              />
            </>
          )}

          {/* X Axis Labels */}
          {data.map((d, i) => {
            if (i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) {
              return (
                <text
                  key={i}
                  x={getX(i)}
                  y={svgHeight - 4}
                  textAnchor="middle"
                  className="text-[9px] fill-fg/60 font-mono"
                >
                  {d.label}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute top-1 pointer-events-none px-2.5 py-1.5 rounded-xl bg-surface border border-strong shadow-lg text-center z-20 min-w-[80px]"
            style={{
              left: `clamp(6px, calc(${(hoveredPoint.x / svgWidth) * 100}% - 40px), calc(100% - 90px))`,
            }}
          >
            <div className="text-[10px] text-fg/60 uppercase font-mono">
              {hoveredPoint.data.label}
            </div>
            <div className="text-xs font-bold font-mono text-accent">
              {hoveredPoint.data.value} {unit}
            </div>
            {hoveredPoint.data.secondary !== undefined && (
              <div className="text-[10px] font-mono text-fg/70">
                Raw: {hoveredPoint.data.secondary} {unit}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
