import React, { useMemo } from 'react';
import CarSprite from './CarSprite';
import { AlertTriangle, Flag } from 'lucide-react';

/**
 * CarTrackView - Stacked side-view racing track with road texture, curbs,
 * finish line, parallax road scrolling, speed lines, and mini progress bar.
 * Built strictly with theme tokens (no hardcoded colors, gradients or glow).
 */
export default function CarTrackView({
  players = [],
  currentUserId,
  currentSocketId,
  currentUsername,
  ownSpeed = 0,
  ownState = 'idle',
}) {
  const isStalled = ownState === 'stalled';
  const isHighSpeed = ownSpeed >= 200;

  // Determine own player
  const myPlayer = useMemo(() => {
    return (
      players.find(
        (p) =>
          (currentSocketId && p.id === currentSocketId) ||
          (currentUserId && p.userId === currentUserId) ||
          (currentUsername && p.username === currentUsername)
      ) || players[0]
    );
  }, [players, currentSocketId, currentUserId, currentUsername]);

  return (
    <div className="w-full flex flex-col gap-2 select-none my-2">
      {/* Mini Progress Bar Overview */}
      <div className="w-full bg-surface border border-border rounded-xl p-2.5 shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-mono text-fg/70 mb-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <Flag className="w-3.5 h-3.5 text-accent" />
            <span>START</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider opacity-60">Track Progress</span>
          <div className="flex items-center gap-1.5 font-bold text-accent">
            <span>FINISH</span>
            <span className="font-sans">🏁</span>
          </div>
        </div>

        {/* Mini progress line */}
        <div className="relative w-full h-3 bg-bg rounded-full overflow-visible border border-border">
          {players.map((p, idx) => {
            const isMe =
              (currentSocketId && p.id === currentSocketId) ||
              (currentUserId && p.userId === currentUserId) ||
              (currentUsername && p.username === currentUsername);
            const progress = Math.min(100, Math.max(0, p.progress || 0));

            return (
              <div
                key={p.id || idx}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-200 z-10"
                style={{ left: `${Math.min(98, Math.max(2, progress))}%` }}
                title={`${p.username}: ${progress}%`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-black border shadow-sm ${
                    isMe
                      ? 'bg-accent text-bg border-accent scale-110 ring-2 ring-accent/30'
                      : 'bg-surface text-fg border-border-strong'
                  }`}
                >
                  {idx + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Track Enclosure */}
      <div
        className={`relative w-full border-2 border-border-strong rounded-2xl overflow-hidden bg-bg shadow-card transition-all duration-150 ${
          isStalled ? 'ring-2 ring-danger' : ''
        } ${isHighSpeed ? 'motion-safe:animate-pulse' : ''}`}
      >
        {/* Stall Warning Banner Flash */}
        {isStalled && (
          <div className="absolute inset-0 bg-danger/10 z-30 pointer-events-none flex items-center justify-center">
            <div className="px-4 py-2 rounded-xl bg-surface border-2 border-danger text-danger flex items-center gap-2 font-mono font-extrabold text-xs sm:text-sm uppercase tracking-wider shadow-card animate-bounce">
              <AlertTriangle className="w-5 h-5 text-danger" />
              <span>ENGINE STALLED • PRESS BACKSPACE TO RECOVER</span>
            </div>
          </div>
        )}

        {/* High Speed Lines Effect */}
        {isHighSpeed && (
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden opacity-30">
            <div className="w-full h-full flex flex-col justify-around">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-24 h-0.5 bg-fg/60 rounded-full animate-[ping_0.4s_linear_infinite]"
                  style={{
                    marginLeft: `${(i * 23) % 80}%`,
                    animationDelay: `${i * 0.08}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Top Rumble Strip (SVG Curb) */}
        <div className="w-full h-2 overflow-hidden bg-surface">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 10">
            <defs>
              <pattern id="curb-top" width="6" height="10" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="3" height="10" fill="var(--danger)" />
                <rect x="3" y="0" width="3" height="10" fill="var(--surface)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#curb-top)" />
          </svg>
        </div>

        {/* Race Lanes Stacked Vertically */}
        <div className="flex flex-col divide-y divide-border/60">
          {players.map((player, index) => {
            const isMe =
              (currentSocketId && player.id === currentSocketId) ||
              (currentUserId && player.userId === currentUserId) ||
              (currentUsername && player.username === currentUsername);

            const playerProgress = Math.min(100, Math.max(0, player.progress || 0));
            const playerSpeed = isMe ? ownSpeed : player.speed || 0;
            const playerState = isMe ? ownState : player.state || 'idle';

            return (
              <div
                key={player.id || index}
                className={`relative w-full h-20 sm:h-24 flex items-center px-4 overflow-hidden transition-colors ${
                  isMe ? 'bg-surface/30' : 'bg-transparent'
                }`}
              >
                {/* Lane number watermark */}
                <div className="absolute left-2 text-fg/10 font-mono font-black text-4xl pointer-events-none">
                  {index + 1}
                </div>

                {/* Road center dashes */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b-2 border-dashed border-border/40 pointer-events-none" />

                {/* Start Line */}
                <div className="absolute left-10 top-0 bottom-0 w-1 bg-border-strong pointer-events-none z-10" />

                {/* Checkered Finish Line */}
                <div className="absolute right-4 top-0 bottom-0 w-6 z-10 pointer-events-none overflow-hidden">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 20 100">
                    <defs>
                      <pattern id={`finish-checker-${index}`} width="10" height="10" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="5" height="5" fill="var(--fg)" opacity="0.8" />
                        <rect x="5" y="0" width="5" height="5" fill="var(--bg)" />
                        <rect x="0" y="5" width="5" height="5" fill="var(--bg)" />
                        <rect x="5" y="5" width="5" height="5" fill="var(--fg)" opacity="0.8" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#finish-checker-${index})`} />
                  </svg>
                </div>

                {/* The Animated Race Car along the lane */}
                <div
                  className="absolute transition-all duration-150 ease-out z-10"
                  style={{
                    // Car moves from left: 2% to left: calc(100% - 150px)
                    left: `calc(10px + ${playerProgress * 0.85}%)`,
                  }}
                >
                  <div className="w-32 sm:w-40">
                    <CarSprite
                      isCurrentPlayer={isMe}
                      playerNumber={index + 1}
                      username={player.username}
                      speed={playerSpeed}
                      state={playerState}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Rumble Strip (SVG Curb) */}
        <div className="w-full h-2 overflow-hidden bg-surface">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 10">
            <defs>
              <pattern id="curb-bottom" width="6" height="10" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="3" height="10" fill="var(--danger)" />
                <rect x="3" y="0" width="3" height="10" fill="var(--surface)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#curb-bottom)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
