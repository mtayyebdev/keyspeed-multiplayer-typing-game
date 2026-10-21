import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Target } from 'lucide-react';

export default function LeaderboardBarChart({
  leaders = [],
  title = 'Top Racers Speed Comparison',
  height = 240,
  maxItems = 10,
}) {
  const [hoveredRacer, setHoveredRacer] = useState(null);

  const displayList = leaders.slice(0, maxItems);
  const maxWpm = Math.max(...displayList.map((l) => l.wpm || 0), 60);

  return (
    <div className="w-full rounded-2xl p-4 sm:p-5 border border-border bg-surface shadow-card flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-fg">
            {title}
          </span>
        </div>
        <span className="text-[11px] font-mono text-fg/60">
          Top {displayList.length} Typists
        </span>
      </div>

      <div className="space-y-2.5 my-auto" style={{ minHeight: height }}>
        {displayList.map((racer, idx) => {
          const rank = racer.rank || idx + 1;
          const isTop = rank === 1;
          const isPodium = rank <= 3;
          const percent = Math.min(100, Math.max(15, Math.round(((racer.wpm || 0) / maxWpm) * 100)));
          const isHovered = hoveredRacer === racer.username;

          return (
            <div
              key={racer._id || racer.username || idx}
              onMouseEnter={() => setHoveredRacer(racer.username)}
              onMouseLeave={() => setHoveredRacer(null)}
              className={`p-2.5 rounded-xl transition-all duration-150 border cursor-pointer ${
                isHovered
                  ? 'bg-surface-hover border-border-strong shadow-sm'
                  : 'bg-bg border-border hover:bg-surface-hover'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                      isTop
                        ? 'bg-accent text-bg font-black shadow-sm'
                        : isPodium
                        ? 'bg-accent-soft text-accent border border-accent/40 font-bold shadow-sm'
                        : 'bg-surface border border-border text-fg/70'
                    }`}
                  >
                    #{rank}
                  </span>
                  <span className={`font-semibold truncate ${isHovered ? 'text-fg' : 'text-fg/80'}`}>
                    {racer.username}
                  </span>
                  {racer.accuracy !== undefined && (
                    <span className="text-[10px] text-fg/60 flex items-center gap-0.5 ml-1">
                      <Target className="w-2.5 h-2.5 text-accent" />
                      {racer.accuracy}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 font-bold">
                  <Zap className="w-3 h-3 text-accent" />
                  <span className="text-accent text-sm font-black font-mono">
                    {racer.wpm}
                  </span>
                  <span className="text-[10px] text-fg/60 font-normal">WPM</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-surface overflow-hidden relative border border-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.7, delay: idx * 0.05, ease: 'easeOut' }}
                  className={`h-full rounded-full ${isTop ? 'bg-accent' : isPodium ? 'bg-accent/70' : 'bg-fg/50'}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
