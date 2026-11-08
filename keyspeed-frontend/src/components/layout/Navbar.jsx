import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLogoutMutation } from '../../features/auth/authApi';
import {
  Zap,
  Trophy,
  LogOut,
  Flame,
  Play,
  Settings,
  Shield,
  Menu,
  X,
  Home,
  User,
  LogIn,
  UserPlus,
  FileText,
  FileCheck,
} from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

export default function Navbar() {
  const location = useLocation();
  const [logoutMutation] = useLogoutMutation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      setIsMobileMenuOpen(false);
    } catch (e) {
      // Ignored
    }
  };

  // Close mobile drawer on route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Solo Test', path: '/solo', icon: Flame },
    { label: 'Live Race', path: '/lobby', icon: Play, isRace: true },
    { label: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/95 backdrop-blur-sm transition-colors duration-150 shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-accent text-bg flex items-center justify-center font-bold transition-transform group-hover:scale-105 shadow-sm">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-fg">
              Key<span className="text-accent">Speed</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
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

          {/* Right Section: Settings (desktop only) & User Auth & Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Settings Link: Hidden in mobile view, shown on desktop */}
            <Link
              to="/settings"
              title="Settings & Preferences"
              aria-label="Settings"
              className={`hidden md:flex p-2 rounded-xl transition-all duration-150 border cursor-pointer active:scale-95 items-center justify-center ${
                isActive('/settings')
                  ? 'bg-accent-soft text-accent border-accent/30 shadow-sm'
                  : 'text-fg/60 hover:text-fg bg-surface border-border hover:border-strong hover:bg-surface-hover shadow-sm'
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface border border-border hover:border-strong hover:bg-surface-hover text-fg transition-all duration-150 shadow-card cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-accent text-bg flex items-center justify-center font-bold text-xs shadow-sm">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs sm:text-sm font-medium max-w-[90px] sm:max-w-[120px] truncate">
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
                  className="hidden sm:flex p-2 text-fg/60 hover:text-danger hover:bg-danger-soft rounded-lg transition-all duration-150 border border-transparent hover:border-danger/30 cursor-pointer active:scale-95"
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
                  className="hidden sm:inline-flex px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-accent text-bg hover:bg-accent-hover hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-150 shadow-sm cursor-pointer"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
              className="md:hidden p-2 rounded-xl text-fg/70 hover:text-fg hover:bg-surface-hover border border-border cursor-pointer active:scale-95 transition-all flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer (Side Menu like Admin) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col bg-surface border-r border-border shadow-2xl transition-transform duration-200 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation drawer"
      >
        {/* Header / Brand + Close button */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border flex-shrink-0">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-accent text-bg flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-extrabold text-base tracking-tight text-fg">
                Key<span className="text-accent">Speed</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent/20">
                v1
              </span>
            </div>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-fg/50 hover:text-fg hover:bg-surface-hover cursor-pointer transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card if Authenticated */}
        {isAuthenticated && user && (
          <div className="p-3 border-b border-border bg-bg/40 flex-shrink-0">
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border hover:border-accent/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-accent text-bg flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-fg truncate group-hover:text-accent transition-colors">
                    {user.username}
                  </div>
                  <div className="text-[10px] text-fg/50 font-mono truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-accent font-mono bg-accent-soft px-2 py-0.5 rounded border border-accent/20 font-semibold flex-shrink-0 ml-1">
                {user.bestWpm || 0} WPM
              </span>
            </Link>
          </div>
        )}

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 no-scrollbar">
          {/* Main Navigation */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-fg/40 px-3 mb-1">
              Main Menu
            </div>
            <div className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = item.isRace
                  ? isActive('/lobby') || isActive('/race')
                  : isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-accent-soft text-accent border border-accent/30 font-semibold shadow-sm'
                        : 'text-fg/70 hover:text-fg hover:bg-surface-hover border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Preferences & System */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-fg/40 px-3 mb-1">
              Settings & Preferences
            </div>
            <div className="space-y-1">
              <Link
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive('/settings')
                    ? 'bg-accent-soft text-accent border border-accent/30 font-semibold shadow-sm'
                    : 'text-fg/70 hover:text-fg hover:bg-surface-hover border border-transparent'
                }`}
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span>Settings</span>
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-accent-soft text-accent border border-accent/30 font-semibold shadow-sm'
                      : 'text-fg/70 hover:text-fg hover:bg-surface-hover border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 flex-shrink-0 text-accent" />
                    <span>Admin Panel</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent/20">
                    Admin
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Account Section */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-fg/40 px-3 mb-1">
              Account
            </div>
            <div className="space-y-1">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isActive('/profile')
                        ? 'bg-accent-soft text-accent border border-accent/30 font-semibold shadow-sm'
                        : 'text-fg/70 hover:text-fg hover:bg-surface-hover border border-transparent'
                    }`}
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span>Racer Profile</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger-soft transition-all duration-150 border border-transparent hover:border-danger/30 cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                      isActive('/login')
                        ? 'bg-accent-soft text-accent border border-accent/30 font-semibold shadow-sm'
                        : 'text-fg/70 hover:text-fg hover:bg-surface-hover border border-transparent'
                    }`}
                  >
                    <LogIn className="w-4 h-4 flex-shrink-0" />
                    <span>Sign In</span>
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-accent text-bg hover:bg-accent-hover transition-all duration-150 shadow-sm cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 flex-shrink-0" />
                    <span>Create Account</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Legal Pages */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-fg/40 px-3 mb-1">
              Information
            </div>
            <div className="space-y-1">
              <Link
                to="/privacy"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive('/privacy')
                    ? 'bg-accent-soft text-accent border border-accent/30 font-semibold'
                    : 'text-fg/60 hover:text-fg hover:bg-surface-hover border border-transparent'
                }`}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Privacy Policy</span>
              </Link>

              <Link
                to="/terms"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive('/terms')
                    ? 'bg-accent-soft text-accent border border-accent/30 font-semibold'
                    : 'text-fg/60 hover:text-fg hover:bg-surface-hover border border-transparent'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Terms & Conditions</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer in Drawer: Theme Switcher & Info */}
        <div className="p-3 border-t border-border bg-bg/50 flex-shrink-0 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-fg/50 font-semibold uppercase tracking-wider">
              Theme
            </span>
            <span className="text-[10px] text-fg/40">Palette</span>
          </div>
          <ThemeSwitcher />
        </div>
      </aside>
    </>
  );
}
