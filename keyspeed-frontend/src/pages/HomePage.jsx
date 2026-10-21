import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Play, Shield, Bot, Flame, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-10 lg:py-16 text-center max-w-4xl mx-auto">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-soft border border-accent/20 text-accent text-xs font-semibold mb-6 shadow-sm"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Next-Gen Multiplayer Typing Platform</span>
      </motion.div>

      {/* Hero Title: at most one word in accent */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight sm:leading-none text-fg"
      >
        Type Faster.{' '}
        <span className="text-accent">Race</span> Live.{' '}
        <br />
        Dominate the Track.
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-6 text-lg sm:text-xl text-fg/70 max-w-2xl font-normal leading-relaxed"
      >
        Challenge friends or test your velocity in real-time synchronized races with
        server-verified WPM, bot-fallback matchmaking, and responsive controls.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
      >
        <Link
          to="/lobby"
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent text-bg font-bold text-lg flex items-center justify-center gap-3 hover:bg-accent-hover hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-150 shadow-sm cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Play Live Race</span>
        </Link>

        <Link
          to="/solo"
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-surface border border-strong text-fg hover:bg-surface-hover hover:border-accent active:scale-[0.98] font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-150 shadow-card cursor-pointer"
        >
          <Flame className="w-5 h-5 text-accent" />
          <span>Solo Practice</span>
        </Link>
      </motion.div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left"
      >
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-card hover:border-strong hover:bg-surface-hover transition-all duration-150 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center mb-3 shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-fg">Synchronized Races</h3>
          <p className="mt-1 text-xs text-fg/60 leading-relaxed">
            Real-time server timestamps, 3-2-1-GO countdown, and sub-150ms throttled progress updates.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface shadow-card hover:border-strong hover:bg-surface-hover transition-all duration-150 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center mb-3 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-fg">Smart Bot Backfill</h3>
          <p className="mt-1 text-xs text-fg/60 leading-relaxed">
            Queue never leaves you hanging. Dynamic bots match your skill level automatically within 8s.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface shadow-card hover:border-strong hover:bg-surface-hover transition-all duration-150 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center mb-3 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-fg">Anti-Cheat Verified</h3>
          <p className="mt-1 text-xs text-fg/60 leading-relaxed">
            Server calculates true WPM and accuracy, rejecting impossible leaps and superhuman bursts.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
