import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLogoutMutation } from '../../features/auth/authApi';
import { Zap, Trophy, LogOut, Flame, Play, Settings, Shield } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [logoutMutation] = useLogoutMutation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (e) {
      // Ignored
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 transition-colors duration-150 shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-accent text-bg flex items-center justify-center font-bold transition-transform group-hover:scale-105 shadow-sm">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-fg">
            Key<span className="text-accent">Speed</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-accent/20 bg-accent-soft text-accent font-semibold ml-0.5">
            v1
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to="/solo"
            className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              isActive('/solo')
                ? 'bg-accent-soft text-accent border border-accent/30 font-semibold shadow-sm'
                : 'text-fg/70 hover:text-fg hover:bg-surface-hover border border-transparent'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Solo Test</span>
          </Link>

          <Link
            to="/lobby"
            className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              isActive('/lobby') || isActive('/race')
                ? 'bg-accent-soft text-accent border border-accent/30 font-semibold shadow-sm'
                : 'text-fg/70 hover:text-fg hover:bg-surface-hover border border-transparent'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Live Race</span>
          </Link>

          <Link
            to="/leaderboard"
            className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              isActive('/leaderboard')
                ? 'bg-accent-soft text-accent border border-accent/30 font-semibold shadow-sm'
                : 'text-fg/70 hover:text-fg hover:bg-surface-hover border border-transparent'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Leaderboard</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                location.pathname.startsWith('/admin')
                  ? 'bg-accent-soft text-accent border border-accent/30 font-semibold shadow-sm'
                  : 'text-fg/70 hover:text-fg hover:bg-surface-hover border border-transparent'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Right Section: ThemeSwitcher, Settings & User Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Switcher */}
          {/* <ThemeSwitcher /> */}

          {/* Settings Link */}
          <Link
            to="/settings"
            title="Settings & Preferences"
            aria-label="Settings"
            className={`p-2 rounded-xl transition-all duration-150 border cursor-pointer active:scale-95 flex items-center justify-center ${
              isActive('/settings')
                ? 'bg-accent-soft text-accent border-accent/30 shadow-sm'
                : 'text-fg/60 hover:text-fg bg-surface border-border hover:border-strong hover:bg-surface-hover shadow-sm'
            }`}
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Admin Icon for mobile / header */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              title="Admin Dashboard"
              aria-label="Admin Dashboard"
              className={`md:hidden p-2 rounded-xl transition-all duration-150 border cursor-pointer active:scale-95 flex items-center justify-center ${
                location.pathname.startsWith('/admin')
                  ? 'bg-accent-soft text-accent border-accent/30 shadow-sm'
                  : 'text-fg/60 hover:text-fg bg-surface border-border hover:border-strong hover:bg-surface-hover shadow-sm'
              }`}
            >
              <Shield className="w-4 h-4" />
            </Link>
          )}

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface border border-border hover:border-strong hover:bg-surface-hover text-fg transition-all duration-150 shadow-card cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-accent text-bg flex items-center justify-center font-bold text-xs shadow-sm">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs sm:text-sm font-medium max-w-[100px] sm:max-w-[120px] truncate">
                  {user.username}
                </span>
                <span className="hidden sm:inline-block text-xs text-accent font-mono bg-accent-soft px-1.5 py-0.5 rounded border border-accent/20">
                  {user.bestWpm || 0} WPM
                </span>
              </Link>
              <button
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="p-2 text-fg/60 hover:text-danger hover:bg-danger-soft rounded-lg transition-all duration-150 border border-transparent hover:border-danger/30 cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/login"
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-fg/70 hover:text-fg hover:bg-surface-hover transition-all duration-150 cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-accent text-bg hover:bg-accent-hover hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-150 shadow-sm cursor-pointer"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
