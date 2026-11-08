import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import AnnouncementBanner from './AnnouncementBanner';

export default function Layout() {
  const location = useLocation();
  const gameId = useSelector((state) => state.race?.gameId);
  const isCarRaceFullscreen = location.pathname.startsWith('/race') && gameId === 'car-race';

  return (
    <div className={`flex flex-col bg-bg text-fg relative overflow-x-hidden selection:bg-accent/20 selection:text-accent ${
      isCarRaceFullscreen ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'
    }`}>
      {!isCarRaceFullscreen && <AnnouncementBanner />}
      <Navbar />

      <main className={`flex-1 relative flex flex-col w-full mx-auto ${
        isCarRaceFullscreen
          ? 'max-w-6xl px-2 sm:px-4 py-2 overflow-hidden h-[calc(100vh-4rem)]'
          : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-6'
      }`}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={isCarRaceFullscreen ? 'flex-1 flex flex-col h-full overflow-hidden' : 'flex-1 flex flex-col'}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer - Hidden only for Car Race game to maximize 3D arena view */}
      {!isCarRaceFullscreen && (
        <footer className="border-t border-border bg-surface py-6 text-xs text-fg/60 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
              <span className="font-semibold text-fg/80">KeySpeed</span>
              <span className="hidden sm:inline">•</span>
              <span>© 2026 Real-time competitive typing platform.</span>
            </div>

            <div className="flex items-center gap-4 font-medium">
              <Link
                to="/privacy"
                className="hover:text-accent transition-colors underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
              <span className="text-fg/30">•</span>
              <Link
                to="/terms"
                className="hover:text-accent transition-colors underline-offset-4 hover:underline"
              >
                Terms & Conditions
              </Link>
            </div>

            <div className="flex items-center gap-3 text-fg/50 font-medium">
              <span>Fast</span>
              <span>•</span>
              <span>Accurate</span>
              <span>•</span>
              <span>Multiplayer</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
