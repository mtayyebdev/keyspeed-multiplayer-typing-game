import React from 'react';
import { Volume2, VolumeX, Timer, Gauge, Award, AlertCircle, Zap } from 'lucide-react';

/**
 * CarRaceHud - Compact High-Performance Telemetry Dashboard.
 * Streamlined single-row layout that fits 100% within the screen without scrolling.
 */
export default function CarRaceHud({
  speed = 0,
  wpm = 0,
  accuracy = 100,
  position = 1,
  errors = 0,
  stalls = 0,
  timeRemaining = 60,
  isAudioMuted = true,
  onToggleAudio,
  state = 'idle',
}) {
  const clampedSpeed = Math.min(360, Math.max(0, speed));
  const speedPercent = Math.min(100, Math.round((clampedSpeed / 320) * 100));

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getPositionSuffix = (pos) => {
    if (pos === 1) return '1st';
    if (pos === 2) return '2nd';
    if (pos === 3) return '3rd';
    return `${pos}th`;
  };

  return (
    <div className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm select-none">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* 1. Speedometer Telemetry */}
        <div className="flex items-center gap-2 bg-bg px-2.5 py-1 rounded-lg border border-border">
          <Zap className={`w-3.5 h-3.5 ${speed > 180 ? 'text-danger animate-pulse' : 'text-accent'}`} />
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black font-mono text-fg leading-none">
              {Math.round(speed)}
            </span>
            <span className="text-[9px] font-mono font-bold text-accent">KM/H</span>
          </div>
          {/* Mini Speed Bar */}
          <div className="w-12 h-1.5 bg-surface rounded-full overflow-hidden border border-border hidden sm:block">
            <div
              className="h-full bg-accent transition-all duration-150"
              style={{ width: `${speedPercent}%` }}
            />
          </div>
        </div>

        {/* 2. Position Ranking */}
        <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-lg border border-border">
          <Award className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] font-mono text-fg/60 uppercase hidden sm:inline">Rank</span>
          <span
            className={`text-sm sm:text-base font-black font-mono ${
              position === 1 ? 'text-accent' : 'text-fg'
            }`}
          >
            {getPositionSuffix(position)}
          </span>
        </div>

        {/* 3. Live WPM & Accuracy */}
        <div className="flex items-center gap-2 bg-bg px-2.5 py-1 rounded-lg border border-border">
          <Gauge className="w-3.5 h-3.5 text-accent" />
          <span className="text-sm sm:text-base font-black font-mono text-accent">
            {Math.round(wpm)} <span className="text-[10px] font-normal text-fg/60">WPM</span>
          </span>
          <span className="text-[10px] font-mono text-fg/60 hidden sm:inline">
            ({Math.round(accuracy)}%)
          </span>
        </div>

        {/* 4. Stalls & Errors */}
        <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-lg border border-border">
          <AlertCircle className={`w-3.5 h-3.5 ${stalls > 0 ? 'text-danger' : 'text-fg/50'}`} />
          <span className="text-[10px] font-mono text-fg/60 uppercase hidden sm:inline">Stalls</span>
          <span className={`text-xs sm:text-sm font-mono font-bold ${stalls > 0 ? 'text-danger' : 'text-fg'}`}>
            {stalls}
          </span>
          <span className="text-fg/30 text-xs">/</span>
          <span className="text-fg/60 text-xs font-mono">{errors}</span>
        </div>

        {/* 5. Countdown Clock & Audio Mute Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-bg px-2.5 py-1 rounded-lg border border-border font-mono font-bold text-xs sm:text-sm text-fg">
            <Timer className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>{formatTimer(timeRemaining)}</span>
          </div>

          <button
            onClick={onToggleAudio}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-bg hover:bg-surface-hover text-xs font-mono text-fg transition-colors cursor-pointer active:scale-95 shadow-sm"
            title={isAudioMuted ? 'Unmute engine audio' : 'Mute engine audio'}
          >
            {isAudioMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-fg/50" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-accent" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
