import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, CheckCircle2 } from 'lucide-react';

export default function RaceTrack({ players = [], currentUserId, currentSocketId, currentUsername }) {
  return (
    <div className="w-full rounded-2xl p-4 sm:p-6 border border-border bg-surface shadow-card mb-6">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <span className="text-xs font-bold uppercase tracking-widest text-fg/70">
          Race Track ({players.length} Racers)
        </span>
        <div className="flex items-center gap-4 text-xs text-fg/60">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" />
            Your Lane
          </span>
          <span>•</span>
          <span>Finish Line 🏁</span>
        </div>
      </div>

      <div className="space-y-3.5">
        {players.map((player, index) => {
          const isMe =
            (player.id && currentSocketId && player.id === currentSocketId) ||
            (player.userId && currentUserId && player.userId === currentUserId) ||
            (player.username && currentUsername && player.username === currentUsername);

          const progress = Math.min(100, Math.max(0, player.progress || 0));

          return (
            <div
              key={player.id || index}
              className={`relative rounded-xl p-3 border transition-all duration-150 ${
                isMe
                  ? 'bg-accent-soft border-accent/50 shadow-sm'
                  : 'bg-surface border-border hover:border-strong'
              }`}
            >
              {/* Lane Info Header */}
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                      isMe ? 'bg-accent text-bg' : 'bg-surface-hover text-fg/70 border border-border'
                    }`}
                  >
                    {player.isBot ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  </div>
                  <span className={`font-semibold ${isMe ? 'text-accent' : 'text-fg'}`}>
                    {player.username}
                  </span>
                  {isMe && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-accent text-bg shadow-sm">
                      YOU
                    </span>
                  )}
                  {player.isBot && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface border border-border text-fg/60">
                      BOT
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className="text-fg/70 text-xs font-semibold">{player.wpm || 0} WPM</span>
                  {player.finished && (
                    <span className="flex items-center gap-1 text-accent font-bold text-xs bg-accent-soft px-2 py-0.5 rounded border border-accent/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {player.position ? `#${player.position}` : 'Done'}
                    </span>
                  )}
                </div>
              </div>

              {/* Lane Track */}
              <div className="relative w-full h-8 bg-bg rounded-lg overflow-hidden border border-border flex items-center px-1">
                {/* Distance marker lines */}
                <div className="absolute inset-0 flex justify-between pointer-events-none px-4 opacity-15">
                  <div className="w-px h-full bg-fg" />
                  <div className="w-px h-full bg-fg" />
                  <div className="w-px h-full bg-fg" />
                  <div className="w-px h-full bg-fg" />
                  <div className="w-px h-full bg-fg" />
                </div>

                {/* Progress Fill bar: solid accent for user, fg at 50% for others */}
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-300 ${
                    isMe ? 'bg-accent' : 'bg-fg/50'
                  }`}
                  style={{ width: `${progress}%` }}
                />

                {/* Smooth Animated Car / Racer Avatar */}
                <motion.div
                  className="absolute z-10 flex items-center justify-center"
                  animate={{ left: `calc(${progress}% - ${progress > 90 ? '28px' : '0px'})` }}
                  transition={{ type: 'spring', damping: 24, stiffness: 220 }}
                  style={{ willChange: 'transform, left' }}
                >
                  <div
                    className={`w-7 h-5 rounded-md flex items-center justify-center transition-transform ${
                      isMe ? 'bg-accent text-bg scale-110 shadow-sm border border-bg' : 'bg-fg text-bg border border-bg'
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z" />
                      <circle cx="7.5" cy="14.5" r="1.5" />
                      <circle cx="16.5" cy="14.5" r="1.5" />
                    </svg>
                  </div>
                </motion.div>

                {/* Finish Line Flag */}
                <div className="absolute right-2 text-xs select-none pointer-events-none">
                  🏁
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
