import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ADMIN_MODULES } from '../config/modules';
import { Zap, ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-surface border-r border-border transition-all duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'} w-64`}
      >
        {/* Header / Brand */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-accent text-bg flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-extrabold text-base tracking-tight text-fg">
                  Key<span className="text-accent">Speed</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent/20">
                  Admin
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-fg/50 hover:text-fg md:hidden cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {ADMIN_MODULES.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.fullPath}
                end={item.path === ''}
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-accent-soft text-accent border border-accent/30 font-semibold shadow-sm'
                      : 'text-fg/70 hover:text-fg hover:bg-surface-hover border border-transparent'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer controls: Back to Game & Collapse toggle */}
        <div className="p-3 border-t border-border flex flex-col gap-2">
          <Link
            to="/"
            title="Back to Game"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-fg/70 hover:text-fg hover:bg-surface-hover border border-border transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Back to Game</span>}
          </Link>

          {/* Desktop collapse button */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center p-2 rounded-xl text-fg/40 hover:text-fg hover:bg-surface-hover border border-transparent hover:border-border transition-all cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

