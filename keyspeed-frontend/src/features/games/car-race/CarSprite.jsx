import React from 'react';

/**
 * CarSprite - High-detail SVG sports race car styled strictly with theme tokens.
 * Differentiation via prominent race number, plate, and player badge.
 * Own car = var(--accent), opponents = var(--fg) at varying opacities.
 */
export default function CarSprite({
  isCurrentPlayer = false,
  playerNumber = 1,
  username = 'Racer',
  speed = 0,
  state = 'idle', // 'running' | 'stalled' | 'idle' | 'finished'
  className = '',
}) {
  const isStalled = state === 'stalled';
  const isMoving = speed > 5 && !isStalled;

  // Spin duration: faster speed = faster wheel rotation
  const wheelDuration = isMoving ? `${Math.max(0.06, 12 / Math.max(10, speed))}s` : '0s';

  // Body coloring: Own car uses theme accent, opponents use fg with distinct opacities
  const bodyFill = isCurrentPlayer
    ? 'var(--accent)'
    : playerNumber === 2
    ? 'var(--fg)'
    : playerNumber === 3
    ? 'var(--fg)'
    : 'var(--fg)';

  const bodyOpacity = isCurrentPlayer
    ? 1
    : playerNumber === 2
    ? 0.85
    : playerNumber === 3
    ? 0.65
    : 0.5;

  const cockpitFill = 'var(--surface)';
  const tireColor = 'var(--bg)';
  const rimColor = isCurrentPlayer ? 'var(--accent)' : 'var(--border-strong-color, var(--fg))';

  return (
    <div className={`relative select-none flex flex-col items-center ${className}`}>
      {/* Driver name tag & race number badge */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-sm border border-border bg-surface text-fg z-10">
        <span
          className="w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] text-bg font-extrabold"
          style={{ backgroundColor: isCurrentPlayer ? 'var(--accent)' : 'var(--fg)' }}
        >
          {playerNumber}
        </span>
        <span className="truncate max-w-[80px]">
          {isCurrentPlayer ? `${username} (YOU)` : username}
        </span>
        {isStalled && (
          <span className="text-[9px] text-danger font-extrabold px-1 rounded bg-danger-soft animate-pulse">
            STALL
          </span>
        )}
      </div>

      {/* SVG Racing Car */}
      <svg
        viewBox="0 0 160 55"
        className={`w-full h-auto overflow-visible transition-transform duration-200 ${
          isStalled ? 'translate-y-0.5' : isMoving ? '-translate-y-0.5' : ''
        }`}
        style={{ filter: isStalled ? 'grayscale(0.3)' : 'none' }}
      >
        <defs>
          <style>{`
            @keyframes wheelSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .wheel-rotating {
              transform-origin: center;
              animation: wheelSpin ${wheelDuration} linear infinite;
            }
          `}</style>
        </defs>

        {/* Skid mark / smoke puff on stall */}
        {isStalled && (
          <g className="animate-pulse">
            <ellipse cx="28" cy="48" rx="8" ry="3" fill="var(--danger)" opacity="0.35" />
            <ellipse cx="18" cy="44" rx="6" ry="4" fill="var(--fg)" opacity="0.25" />
            <path
              d="M 15 42 Q 10 36 6 38"
              stroke="var(--danger)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="2,2"
              opacity="0.8"
            />
          </g>
        )}

        {/* Chassis Shadow */}
        <ellipse cx="80" cy="49" rx="66" ry="4" fill="var(--bg)" opacity="0.6" />

        {/* Rear Wing / Spoiler */}
        <path
          d="M 12 18 L 4 14 L 6 10 L 18 10 L 22 18 Z"
          fill={bodyFill}
          opacity={bodyOpacity}
          stroke="var(--border-strong-color, var(--fg))"
          strokeWidth="1"
        />
        {/* Wing support struts */}
        <line x1="14" y1="18" x2="16" y2="28" stroke="var(--fg)" strokeWidth="1.5" opacity="0.7" />
        <line x1="8" y1="18" x2="10" y2="28" stroke="var(--fg)" strokeWidth="1.5" opacity="0.7" />

        {/* Main Aerodynamic Body */}
        <path
          d="M 14 36 L 20 25 C 24 23, 36 21, 52 20 L 76 16 C 92 16, 114 22, 126 27 L 148 33 C 154 35, 156 38, 154 41 L 146 44 L 14 44 Z"
          fill={bodyFill}
          opacity={bodyOpacity}
          stroke="var(--border-strong-color, var(--fg))"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Cockpit / Tinted Glass Canopy */}
        <path
          d="M 56 20 L 78 17 C 90 17, 102 21, 108 26 L 54 26 Z"
          fill={cockpitFill}
          stroke="var(--fg)"
          strokeWidth="1"
          opacity="0.9"
        />

        {/* Driver Helmet */}
        <circle
          cx="76"
          cy="22"
          r="4.5"
          fill={isCurrentPlayer ? 'var(--accent)' : 'var(--fg)'}
          stroke="var(--bg)"
          strokeWidth="1"
        />
        {/* Visor */}
        <path d="M 76 21 L 80 22 L 78 24 Z" fill="var(--bg)" />

        {/* Side Air Scoop / Racing Vent */}
        <path
          d="M 44 32 L 60 30 L 60 34 L 46 35 Z"
          fill="var(--bg)"
          opacity="0.75"
        />

        {/* Big Race Number on the Door */}
        <rect
          x="70"
          y="28"
          width="20"
          height="12"
          rx="2"
          fill="var(--surface)"
          stroke="var(--border-color, var(--fg))"
          strokeWidth="1"
        />
        <text
          x="80"
          y="37.5"
          textAnchor="middle"
          fontSize="10"
          fontWeight="900"
          fontFamily="monospace"
          fill={isCurrentPlayer ? 'var(--accent)' : 'var(--fg)'}
        >
          {playerNumber}
        </text>

        {/* Headlight (LED racing beam) */}
        <polygon
          points="146,33 154,36 150,38 144,35"
          fill={isStalled ? 'var(--fg)' : 'var(--accent)'}
          opacity="0.9"
        />

        {/* Brake Light / Rear Diffuser light */}
        <rect
          x="12"
          y="32"
          width="3"
          height="6"
          rx="1"
          fill={isStalled ? 'var(--danger)' : 'var(--fg)'}
          opacity={isStalled ? '1' : '0.4'}
        />

        {/* Rear Wheel */}
        <g transform="translate(36, 44)">
          {/* Tire */}
          <circle cx="0" cy="0" r="10" fill={tireColor} stroke="var(--fg)" strokeWidth="1.5" />
          {/* Rim */}
          <circle cx="0" cy="0" r="6" fill="var(--surface)" stroke={rimColor} strokeWidth="1" />
          {/* Rotating Spokes */}
          <g className={isMoving ? 'wheel-rotating' : ''}>
            <line x1="-5" y1="0" x2="5" y2="0" stroke={rimColor} strokeWidth="1.2" />
            <line x1="0" y1="-5" x2="0" y2="5" stroke={rimColor} strokeWidth="1.2" />
            <circle cx="0" cy="0" r="2" fill={tireColor} />
          </g>
        </g>

        {/* Front Wheel */}
        <g transform="translate(126, 44)">
          {/* Tire */}
          <circle cx="0" cy="0" r="10" fill={tireColor} stroke="var(--fg)" strokeWidth="1.5" />
          {/* Rim */}
          <circle cx="0" cy="0" r="6" fill="var(--surface)" stroke={rimColor} strokeWidth="1" />
          {/* Rotating Spokes */}
          <g className={isMoving ? 'wheel-rotating' : ''}>
            <line x1="-5" y1="0" x2="5" y2="0" stroke={rimColor} strokeWidth="1.2" />
            <line x1="0" y1="-5" x2="0" y2="5" stroke={rimColor} strokeWidth="1.2" />
            <circle cx="0" cy="0" r="2" fill={tireColor} />
          </g>
        </g>

        {/* Front Splitter / Nose */}
        <path
          d="M 148 43 L 158 43 L 156 45 L 146 45 Z"
          fill="var(--bg)"
          stroke="var(--fg)"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
}
