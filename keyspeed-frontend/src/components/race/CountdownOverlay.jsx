import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CountdownOverlay({ secondsLeft, onComplete }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof secondsLeft === 'number' && secondsLeft >= 0) {
      setIsVisible(true);
      if (secondsLeft === 0) {
        // Auto-dismiss the "GO!" message after 700ms
        const timer = setTimeout(() => {
          setIsVisible(false);
          if (onComplete) onComplete();
        }, 700);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [secondsLeft, onComplete]);

  if (!isVisible || secondsLeft === null || secondsLeft === undefined || secondsLeft < 0) {
    return null;
  }

  const isGo = secondsLeft === 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none select-none transition-all duration-300 ${
        isGo ? 'bg-transparent' : 'bg-bg/85'
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={secondsLeft}
          initial={{ scale: 0.3, opacity: 0, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.4, opacity: 0, transition: { duration: 0.18 } }}
          transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          className="flex flex-col items-center justify-center"
        >
          {isGo ? (
            <div className="text-8xl sm:text-9xl font-black italic tracking-tighter text-accent animate-pulse">
              GO!
            </div>
          ) : (
            <div className="text-8xl sm:text-9xl font-black font-mono text-accent">
              {secondsLeft}
            </div>
          )}
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-fg mt-4 px-4 py-1.5 rounded-full bg-surface border border-border shadow-card">
            {isGo ? 'Race in progress!' : 'Get ready to race...'}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
