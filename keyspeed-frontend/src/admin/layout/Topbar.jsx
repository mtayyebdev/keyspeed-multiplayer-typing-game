import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu, ArrowLeft, Shield } from 'lucide-react';
import ThemeSwitcher from '../../components/layout/ThemeSwitcher';
import { ADMIN_MODULES } from '../config/modules';

export default function Topbar({ onOpenMobile }) {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Determine current active module
  const currentModule =
    ADMIN_MODULES.find((m) => {
      if (m.path === '') {
        return location.pathname === '/admin' || location.pathname === '/admin/';
      }
      return location.pathname.startsWith(m.fullPath);
    }) || ADMIN_MODULES[0];

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/95 backdrop-blur-sm border-b border-border px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left side: Mobile menu toggle + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 rounded-xl text-fg/60 hover:text-fg hover:bg-surface-hover md:hidden border border-border cursor-pointer transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-fg leading-tight flex items-center gap-2">
            <span>{currentModule.label}</span>
          </h1>
          <p className="hidden sm:block text-xs text-fg/50">{currentModule.description}</p>
        </div>
      </div>

      {/* Right side: Back to Game, ThemeSwitcher, User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-surface text-fg hover:bg-surface-hover hover:border-strong transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Game</span>
        </Link>

        {/* Existing ThemeSwitcher component */}
        <ThemeSwitcher />

        {/* Admin profile chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-xl bg-accent text-bg flex items-center justify-center font-bold text-xs shadow-sm">
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold text-fg leading-tight">
              {user?.username || 'Admin'}
            </span>
            <span className="text-[10px] text-accent font-medium flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" />
              <span>Admin</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

