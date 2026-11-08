import React, { useEffect, useState } from 'react';
import { Trophy, Award, Zap, Gauge, AlertCircle, RotateCcw, LayoutGrid, Home } from 'lucide-react';

/**
 * CarRaceResultsModal - Motorsport podium finish screen.
 * Animated count-up numbers, podium list, top speed, avg speed, stalls,
 * and "Race Again" / "Change Game" navigation.
 */
export default function CarRaceResultsModal({
  isOpen = false,
  result = {},
  standings = [],
  onRaceAgain,
  onChangeGame,
  onHome,
  isPersonalBest = false,
}) {
  const [animatedWpm, setAnimatedWpm] = useState(0);
  const [animatedTopSpeed, setAnimatedTopSpeed] = useState(0);

  const targetWpm = result.wpm || 0;
  const targetTopSpeed = result.topSpeed || Math.round(targetWpm * 2.67);

  // Animated Count-up effect
  useEffect(() => {
    if (!isOpen) return;

    let frame = 0;
    const totalFrames = 30;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      setAnimatedWpm(Math.round(targetWpm * progress));
      setAnimatedTopSpeed(Math.round(targetTopSpeed * progress));

      if (frame >= totalFrames) {
        clearInterval(interval);
        setAnimatedWpm(targetWpm);
        setAnimatedTopSpeed(targetTopSpeed);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isOpen, targetWpm, targetTopSpeed]);

  if (!isOpen) return null;

  const position = result.position || 1;
  const isWinner = position === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/85 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-surface border-2 border-border-strong rounded-3xl p-6 sm:p-8 shadow-card flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header with Trophy / Position Banner */}
        <div className="flex flex-col items-center text-center gap-2">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm ${
              isWinner
                ? 'bg-accent-soft border-accent/40 text-accent ring-4 ring-accent/20'
                : 'bg-surface-hover border-border text-fg'
            }`}
          >
            {isWinner ? (
              <Trophy className="w-8 h-8 text-accent animate-bounce" />
            ) : (
              <Award className="w-8 h-8 text-fg/80" />
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-fg">
            {isWinner ? 'Victory Lap! 🏆' : `Finished #${position}`}
          </h2>

          <p className="text-xs text-fg/60 font-mono">
            Car Race GP Completed • Position {position} of {Math.max(standings.length, 2)}
          </p>

          {isPersonalBest && (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-accent-soft text-accent border border-accent/40 animate-pulse">
              ★ NEW PERSONAL BEST SPEED ★
            </span>
          )}
        </div>

        {/* Primary Racing Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-bg border border-border">
            <span className="text-[10px] font-mono text-fg/60 uppercase">Final WPM</span>
            <span className="text-2xl font-black font-mono text-accent mt-0.5">
              {animatedWpm}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-bg border border-border">
            <span className="text-[10px] font-mono text-fg/60 uppercase">Top Speed</span>
            <span className="text-2xl font-black font-mono text-fg mt-0.5">
              {animatedTopSpeed}
              <span className="text-[10px] font-normal text-accent ml-0.5">km/h</span>
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-bg border border-border">
            <span className="text-[10px] font-mono text-fg/60 uppercase">Accuracy</span>
            <span className="text-2xl font-black font-mono text-fg mt-0.5">
              {Math.round(result.accuracy || 100)}%
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-bg border border-border">
            <span className="text-[10px] font-mono text-fg/60 uppercase">Stalls / Errors</span>
            <span className="text-2xl font-black font-mono text-danger mt-0.5">
              {result.stalls || 0}
              <span className="text-xs text-fg/50 font-normal"> / {result.errors || 0}</span>
            </span>
          </div>
        </div>

        {/* Full Race Standings Table */}
        {standings.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-fg/70">
              Podium Standings
            </h4>
            <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border bg-bg">
              {standings.map((standing, idx) => {
                const isMe = standing.userId === result.userId || standing.username === result.username;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3.5 py-2 text-xs font-mono ${
                      isMe ? 'bg-accent-soft/40 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold ${
                          standing.position === 1
                            ? 'bg-accent text-bg'
                            : 'bg-surface text-fg border border-border'
                        }`}
                      >
                        {standing.position}
                      </span>
                      <span className="truncate max-w-[130px] sm:max-w-[180px]">
                        {standing.username}
                        {standing.isBot ? ' 🤖' : ''}
                        {isMe ? ' (You)' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-fg/80">{Math.round(standing.wpm || 0)} WPM</span>
                      {standing.topSpeed ? (
                        <span className="text-accent text-[11px] font-bold">
                          {standing.topSpeed} km/h
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-border">
          <button
            onClick={onRaceAgain}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-accent text-bg font-mono font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Race Again</span>
          </button>

          <button
            onClick={onChangeGame}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-surface border border-border hover:bg-surface-hover text-fg font-mono font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-accent" />
            <span>Change Game</span>
          </button>

          <button
            onClick={onHome}
            className="w-full sm:w-auto p-3 rounded-xl bg-surface border border-border hover:bg-surface-hover text-fg/70 hover:text-fg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="Return Home"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
