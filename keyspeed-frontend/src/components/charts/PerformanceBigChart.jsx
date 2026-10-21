import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function PerformanceBigChart({
  timeline = [], // [{ second: 1, wpm: 55, rawWpm: 60, accuracy: 98, errors: 0 }]
  title = 'Complete Race Performance Analysis',
  height = 260,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [visibleSeries, setVisibleSeries] = useState({
    wpm: true,
    rawWpm: true,
    accuracy: true,
    errors: true,
  });
  const containerRef = useRef(null);

  // Fallback if no timeline provided or short run
  const data =
    timeline.length > 0
      ? timeline
      : [
          { second: 1, wpm: 40, rawWpm: 45, accuracy: 100, errors: 0 },
          { second: 2, wpm: 55, rawWpm: 58, accuracy: 98, errors: 1 },
          { second: 3, wpm: 68, rawWpm: 72, accuracy: 96, errors: 0 },
          { second: 4, wpm: 74, rawWpm: 77, accuracy: 98, errors: 0 },
          { second: 5, wpm: 82, rawWpm: 85, accuracy: 99, errors: 0 },
        ];

  const wpmValues = data.map((d) => d.wpm || 0);
  const rawValues = data.map((d) => d.rawWpm || d.wpm || 0);
  const errorValues = data.map((d) => d.errors || 0);

  const maxSpeed = Math.max(...wpmValues, ...rawValues, 40);
  const peakWpm = Math.max(...wpmValues);
  const avgWpm = Math.round(wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length);
  const totalErrors = errorValues.reduce((a, b) => a + b, 0);

  // SVG configuration
  const svgWidth = 640;
  const svgHeight = height;
  const paddingLeft = 45;
  const paddingRight = 45;
  const paddingTop = 25;
  const paddingBottom = 35;
  const graphWidth = svgWidth - paddingLeft - paddingRight;
  const graphHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (idx) => {
    if (data.length <= 1) return paddingLeft + graphWidth / 2;
    return paddingLeft + (idx / (data.length - 1)) * graphWidth;
  };

  const getY_Wpm = (val) => {
    return paddingTop + graphHeight - ((val / maxSpeed) * graphHeight);
  };

  const getY_Accuracy = (val) => {
    // Range 50% to 100%
    const norm = Math.max(0, Math.min(100, val) - 50) / 50;
    return paddingTop + graphHeight - norm * graphHeight;
  };

  // Build Bézier path for a given metric
  const buildSmoothPath = (getValueFn) => {
    if (data.length === 0) return '';
    const points = data.map((d, i) => ({ x: getX(i), y: getValueFn(d) }));
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const wpmPath = buildSmoothPath((d) => getY_Wpm(d.wpm || 0));
  const rawWpmPath = buildSmoothPath((d) => getY_Wpm(d.rawWpm || d.wpm || 0));
  const accuracyPath = buildSmoothPath((d) => getY_Accuracy(d.accuracy ?? 100));

  const wpmAreaPath = `${wpmPath} L ${getX(data.length - 1)} ${paddingTop + graphHeight} L ${getX(0)} ${paddingTop + graphHeight} Z`;

  const handleMouseMove = (e) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = (clientX - (paddingLeft / svgWidth) * rect.width) / ((graphWidth / svgWidth) * rect.width);
    const targetIdx = Math.min(
      data.length - 1,
      Math.max(0, Math.round(ratio * (data.length - 1)))
    );
    setHoveredIndex(targetIdx);
  };

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="w-full rounded-2xl p-5 sm:p-6 border border-border bg-surface shadow-card relative">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-border">
        <div>
          <h3 className="text-sm font-extrabold text-fg tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <span>{title}</span>
          </h3>
          <p className="text-[11px] text-fg/60 mt-0.5">
            Second-by-second velocity, error occurrences, and accuracy trends
          </p>
        </div>

        {/* Series Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => toggleSeries('wpm')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm ${
              visibleSeries.wpm
                ? 'bg-accent-soft border-accent/40 text-accent'
                : 'bg-surface border-border text-fg/40 line-through opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>Net WPM</span>
          </button>

          <button
            onClick={() => toggleSeries('rawWpm')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm ${
              visibleSeries.rawWpm
                ? 'bg-surface-hover border-border-strong text-fg'
                : 'bg-surface border-border text-fg/40 line-through opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-fg/70" />
            <span>Raw WPM</span>
          </button>

          <button
            onClick={() => toggleSeries('accuracy')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm ${
              visibleSeries.accuracy
                ? 'bg-surface-hover border-border-strong text-fg'
                : 'bg-surface border-border text-fg/40 line-through opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-fg" />
            <span>Accuracy</span>
          </button>

          <button
            onClick={() => toggleSeries('errors')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm ${
              visibleSeries.errors
                ? 'bg-danger-soft border-danger/40 text-danger'
                : 'bg-surface border-border text-fg/40 line-through opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-danger" />
            <span>Errors</span>
          </button>
        </div>
      </div>

      {/* SVG Multi-Metric Graph */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        className="w-full relative cursor-crosshair select-none"
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full overflow-visible"
          style={{ height: 'auto', maxHeight: height }}
        >
          {/* Grid Lines */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={svgWidth - paddingRight}
            y2={paddingTop}
            stroke="rgb(var(--fg-rgb) / 0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + graphHeight * 0.33}
            x2={svgWidth - paddingRight}
            y2={paddingTop + graphHeight * 0.33}
            stroke="rgb(var(--fg-rgb) / 0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + graphHeight * 0.66}
            x2={svgWidth - paddingRight}
            y2={paddingTop + graphHeight * 0.66}
            stroke="rgb(var(--fg-rgb) / 0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + graphHeight}
            x2={svgWidth - paddingRight}
            y2={paddingTop + graphHeight}
            stroke="rgb(var(--fg-rgb) / 0.15)"
          />

          {/* Left Y-Axis Labels (WPM Speed) */}
          <text
            x={paddingLeft - 8}
            y={paddingTop + 4}
            textAnchor="end"
            className="text-[9px] fill-accent font-mono font-bold"
          >
            {maxSpeed}
          </text>
          <text
            x={paddingLeft - 8}
            y={paddingTop + graphHeight * 0.5 + 3}
            textAnchor="end"
            className="text-[9px] fill-fg/60 font-mono"
          >
            {Math.round(maxSpeed / 2)}
          </text>
          <text
            x={paddingLeft - 8}
            y={paddingTop + graphHeight}
            textAnchor="end"
            className="text-[9px] fill-fg/40 font-mono"
          >
            0
          </text>

          {/* Right Y-Axis Labels (Accuracy %) */}
          {visibleSeries.accuracy && (
            <>
              <text
                x={svgWidth - paddingRight + 8}
                y={paddingTop + 4}
                textAnchor="start"
                className="text-[9px] fill-fg font-mono font-bold"
              >
                100%
              </text>
              <text
                x={svgWidth - paddingRight + 8}
                y={paddingTop + graphHeight * 0.5 + 3}
                textAnchor="start"
                className="text-[9px] fill-fg/60 font-mono"
              >
                75%
              </text>
              <text
                x={svgWidth - paddingRight + 8}
                y={paddingTop + graphHeight}
                textAnchor="start"
                className="text-[9px] fill-fg/40 font-mono"
              >
                50%
              </text>
            </>
          )}

          {/* Average WPM reference line */}
          <line
            x1={paddingLeft}
            y1={getY_Wpm(avgWpm)}
            x2={svgWidth - paddingRight}
            y2={getY_Wpm(avgWpm)}
            stroke="rgb(var(--accent-rgb) / 0.4)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Error Spike Bars at Bottom */}
          {visibleSeries.errors &&
            data.map((d, i) => {
              if (!d.errors) return null;
              const barHeight = Math.min(graphHeight * 0.35, d.errors * 14);
              const barX = getX(i) - 3;
              const barY = paddingTop + graphHeight - barHeight;
              return (
                <rect
                  key={`err_${i}`}
                  x={barX}
                  y={barY}
                  width="6"
                  height={barHeight}
                  fill="rgb(var(--danger-rgb) / 0.65)"
                  rx="1"
                />
              );
            })}

          {/* Raw WPM Line */}
          {visibleSeries.rawWpm && (
            <motion.path
              d={rawWpmPath}
              fill="transparent"
              stroke="rgb(var(--fg-rgb) / 0.5)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}

          {/* Accuracy Line */}
          {visibleSeries.accuracy && (
            <motion.path
              d={accuracyPath}
              fill="transparent"
              stroke="rgb(var(--fg-rgb) / 0.85)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}

          {/* Net WPM Area Fill */}
          {visibleSeries.wpm && (
            <path
              d={wpmAreaPath}
              fill="rgb(var(--accent-rgb) / 0.12)"
            />
          )}

          {/* Net WPM Line */}
          {visibleSeries.wpm && (
            <motion.path
              d={wpmPath}
              fill="transparent"
              stroke="rgb(var(--accent-rgb))"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}

          {/* Peak Speed Highlight Dot */}
          {visibleSeries.wpm && wpmValues.length > 0 && (
            <circle
              cx={getX(wpmValues.indexOf(peakWpm))}
              cy={getY_Wpm(peakWpm)}
              r="4.5"
              fill="rgb(var(--accent-rgb))"
              stroke="rgb(var(--bg-rgb))"
              strokeWidth="2"
            />
          )}

          {/* Hover Scrubbing Crosshair & Points */}
          {hoveredIndex !== null && (
            <g>
              {/* Vertical Guide Line */}
              <line
                x1={getX(hoveredIndex)}
                y1={paddingTop}
                x2={getX(hoveredIndex)}
                y2={paddingTop + graphHeight}
                stroke="rgb(var(--accent-rgb) / 0.7)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Point on WPM */}
              {visibleSeries.wpm && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY_Wpm(data[hoveredIndex].wpm || 0)}
                  r="5"
                  fill="rgb(var(--accent-rgb))"
                  stroke="rgb(var(--bg-rgb))"
                  strokeWidth="2"
                />
              )}

              {/* Point on Accuracy */}
              {visibleSeries.accuracy && (
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY_Accuracy(data[hoveredIndex].accuracy ?? 100)}
                  r="4"
                  fill="rgb(var(--fg-rgb))"
                  stroke="rgb(var(--bg-rgb))"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}

          {/* X-Axis Time Labels */}
          {data.map((d, i) => {
            const step = Math.max(1, Math.floor(data.length / 6));
            if (i % step === 0 || i === data.length - 1) {
              return (
                <text
                  key={`lbl_${i}`}
                  x={getX(i)}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className="text-[9px] fill-fg/60 font-mono"
                >
                  {d.second || i + 1}s
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Floating Crosshair Data Card - clamped inside bounds so it is never clipped */}
        {activePoint && (
          <div
            className="absolute top-2 pointer-events-none px-3 py-2 rounded-xl bg-surface border border-strong z-30 min-w-[135px] shadow-lg"
            style={{
              left: `clamp(8px, calc(${(getX(hoveredIndex) / svgWidth) * 100}% - 67px), calc(100% - 145px))`,
            }}
          >
            <div className="flex items-center justify-between text-[10px] text-fg/60 pb-1 mb-1 border-b border-border font-mono">
              <span>Time</span>
              <span className="font-bold text-fg">{activePoint.second}s</span>
            </div>
            <div className="space-y-0.5 text-xs font-mono">
              <div className="flex items-center justify-between gap-3 text-accent font-bold">
                <span className="text-[10px] font-normal text-fg/60">Net WPM</span>
                <span>{activePoint.wpm || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-fg">
                <span className="text-[10px] font-normal text-fg/60">Raw WPM</span>
                <span>{activePoint.rawWpm || activePoint.wpm || 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-fg">
                <span className="text-[10px] font-normal text-fg/60">Accuracy</span>
                <span>{activePoint.accuracy ?? 100}%</span>
              </div>
              {activePoint.errors > 0 && (
                <div className="flex items-center justify-between gap-3 text-danger font-semibold">
                  <span className="text-[10px] font-normal text-fg/60">Errors</span>
                  <span>{activePoint.errors}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-border text-center font-mono">
        <div className="p-2 rounded-xl bg-bg border border-border shadow-sm">
          <span className="text-[10px] uppercase text-fg/60 block">Peak Speed</span>
          <span className="text-base font-black text-accent">{peakWpm} WPM</span>
        </div>
        <div className="p-2 rounded-xl bg-bg border border-border shadow-sm">
          <span className="text-[10px] uppercase text-fg/60 block">Average Speed</span>
          <span className="text-base font-black text-fg">{avgWpm} WPM</span>
        </div>
        <div className="p-2 rounded-xl bg-bg border border-border shadow-sm">
          <span className="text-[10px] uppercase text-fg/60 block">Total Errors</span>
          <span className="text-base font-black text-danger">{totalErrors}</span>
        </div>
        <div className="p-2 rounded-xl bg-bg border border-border shadow-sm">
          <span className="text-[10px] uppercase text-fg/60 block">Total Duration</span>
          <span className="text-base font-black text-fg">
            {data[data.length - 1]?.second || data.length}s
          </span>
        </div>
      </div>
    </div>
  );
}
