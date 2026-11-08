import React from 'react';

/**
 * F1StartLights - Authentic 5-gantry F1 start light sequence.
 * Lights turn red sequentially (1 to 5) as countdown ticks down,
 * and simultaneously extinguish to "GO" when the race starts.
 */
export default function F1StartLights({ secondsLeft, isRacing = false }) {
  // If countdown is not active and not just started, hide
  if (secondsLeft === null && !isRacing) return null;

  // Derive how many red lights are illuminated (1 to 5)
  // Assuming a 3, 4, or 5 second countdown
  let litCount = 0;
  if (secondsLeft !== null && secondsLeft > 0) {
    // If 3s countdown: 3s left = 2 lights, 2s left = 3 lights, 1s left = 5 lights
    if (secondsLeft >= 5) litCount = 1;
    else if (secondsLeft === 4) litCount = 2;
    else if (secondsLeft === 3) litCount = 3;
    else if (secondsLeft === 2) litCount = 4;
    else if (secondsLeft === 1) litCount = 5;
  }

  const isLightsOut = secondsLeft === 0 || isRacing;

  return (
    <div className="flex flex-col items-center justify-center py-2 px-4 select-none">
      {/* Light Gantry Housing */}
      <div className="bg-surface border-2 border-border-strong rounded-2xl p-2.5 shadow-card flex items-center gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map((index) => {
          const isRed = !isLightsOut && index <= litCount;

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-1.5 bg-bg/80 p-1.5 rounded-xl border border-border"
            >
              {/* Top lamp (Red) */}
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                  isRed
                    ? 'bg-danger border-border-strong ring-2 ring-danger'
                    : 'bg-surface border-border/50 opacity-40'
                }`}
              >
                {isRed && (
                  <div className="w-2.5 h-2.5 rounded-full bg-surface-hover" />
                )}
              </div>

              {/* Bottom lamp (Red secondary) */}
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-150 ${
                  isRed
                    ? 'bg-danger border-border-strong ring-2 ring-danger'
                    : 'bg-surface border-border/50 opacity-40'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Status banner under lights */}
      <div className="mt-2 text-center">
        {isLightsOut ? (
          <span className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-accent font-mono animate-bounce">
            ⚡ LIGHTS OUT - GO GO GO!
          </span>
        ) : (
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-fg/70">
            PREPARE ENGINES • {secondsLeft}s
          </span>
        )}
      </div>
    </div>
  );
}
