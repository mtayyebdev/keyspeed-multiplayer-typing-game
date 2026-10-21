import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { setTheme, THEMES } from '../../features/theme/themeSlice';

export default function ThemeSwitcher() {
  const dispatch = useDispatch();
  const currentTheme = useSelector((state) => state.theme?.current || 'midnight');

  return (
    <div
      role="group"
      aria-label="Theme switcher"
      className="flex items-center gap-1.5 p-1 rounded-full bg-surface border border-border shadow-sm"
    >
      {THEMES.map((t) => {
        const isActive = currentTheme === t.id;
        return (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => dispatch(setTheme(t.id))}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.92 }}
            aria-label={`Switch to ${t.name} theme`}
            aria-pressed={isActive}
            title={`${t.name} theme`}
            className={`relative w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
              isActive
                ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg border-transparent'
                : 'border-border opacity-75 hover:opacity-100 hover:border-strong'
            }`}
            style={{
              backgroundColor: t.bg,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full pointer-events-none"
              style={{ backgroundColor: t.accent }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

