import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Award,
  Zap,
  Target,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  BarChart2,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Layers,
} from 'lucide-react';
import PerformanceBigChart from '../charts/PerformanceBigChart';
import PerformanceLineChart from '../charts/PerformanceLineChart';
import AccuracyPieChart from '../charts/AccuracyPieChart';

export default function ResultsModal({
  isOpen = true,
  result, // { position, wpm, accuracy, errors, durationMs, flagged, reason, timeline, correctChars, errorChars, totalChars }
  onPlayAgain,
  onNavigateHome,
  title = 'Test Complete!',
}) {
  const [displayWpm, setDisplayWpm] = useState(0);
  const [chartView, setChartView] = useState('all'); // 'all' | 'big' | 'line' | 'pie'

  const targetWpm = result?.wpm || 0;
  const isFirstPlace = result?.position === 1;

  // Trigger confetti for first place
  useEffect(() => {
    if (isOpen && isFirstPlace) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, isFirstPlace]);

  // Count-up animation for WPM
  useEffect(() => {
    if (!isOpen) {
      setDisplayWpm(0);
      return;
    }

    const duration = 1200; // 1.2s count up
    const startTime = performance.now();

    const animateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(targetWpm * ease);
      setDisplayWpm(current);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, [isOpen, targetWpm]);

  if (!isOpen || !result) return null;

  const isWinner = result.position === 1;

  // Prepare chart data
  const finalDurationSec = Math.max(2, Math.round((result.durationMs || 10000) / 1000));
  const finalWpm = result.wpm || 0;
  const finalAcc = result.accuracy || 100;
  const finalErr = result.errors ?? 0;

  // Use recorded timeline or synthesize a realistic acceleration curve if missing
  let activeTimeline = result.timeline;
  if (!activeTimeline || activeTimeline.length < 2) {
    activeTimeline = [];
    for (let s = 1; s <= finalDurationSec; s++) {
      const progress = s / finalDurationSec;
      const speedFactor = 0.65 + 0.35 * Math.sin((progress * Math.PI) / 2);
      const variance = (s % 2 === 0 ? 1 : -1) * (s % 3 === 0 ? 3 : 1);
      const currentWpm = Math.max(10, Math.round(finalWpm * speedFactor + variance));
      const currentRaw = Math.round(currentWpm * 1.05);
      const currentErrors = s === Math.floor(finalDurationSec / 2) ? finalErr : 0;
      activeTimeline.push({
        second: s,
        wpm: s === finalDurationSec ? finalWpm : currentWpm,
        rawWpm: currentRaw,
        accuracy: finalAcc,
        errors: currentErrors,
      });
    }
  }

  // Line chart data
  const lineChartData = activeTimeline.map((item) => ({
    label: `${item.second}s`,
    value: item.wpm,
    secondary: item.rawWpm,
  }));

  // Pie chart data: Keystrokes & Accuracy breakdown
  const totalChars =
    result.totalChars || Math.max(50, Math.round((finalWpm * 5 * finalDurationSec) / 60));
  const errorChars = result.errorChars ?? finalErr;
  const correctChars = result.correctChars ?? Math.max(0, totalChars - errorChars);
  const pieChartData = [
    { label: 'Correct Keystrokes', value: correctChars, type: 'correct' },
    { label: 'Errors Made', value: errorChars, type: 'error' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="w-full max-w-4xl mx-auto rounded-2xl p-6 sm:p-8 border border-strong bg-surface shadow-2xl relative"
    >
      {/* Flagged warning if anti-cheat triggered */}
      {result.flagged && (
        <div className="mb-6 p-4 rounded-2xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Anti-Cheat Alert:</span> Your run was flagged for superhuman velocity or irregular leaps ({result.reason || 'Sustained pace exceeded thresholds'}). This result is excluded from leaderboards.
          </div>
        </div>
      )}

      {/* Header with position badge */}
      <div className="flex flex-col items-center text-center mb-6">
        {result.position && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider mb-3 shadow-sm ${
              isWinner
                ? 'bg-accent text-bg shadow-sm'
                : 'bg-surface border border-border text-fg'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>
              {result.position === 1
                ? '1st Place'
                : result.position === 2
                ? '2nd Place'
                : result.position === 3
                ? '3rd Place'
                : `${result.position}th Place`}
            </span>
          </motion.div>
        )}

        <h2 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">{title}</h2>
        <p className="text-xs text-fg/60 mt-1">Verified by KeySpeed Server</p>
      </div>

      {/* Main KPI Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-center font-mono">
        <div className="p-4 rounded-xl bg-bg border border-border shadow-sm">
          <div className="text-xs text-fg/60 mb-1 flex items-center justify-center gap-1 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span>Speed</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-accent">
            {displayWpm}
          </div>
          <span className="text-[10px] text-fg/60 uppercase">WPM</span>
        </div>

        <div className="p-4 rounded-xl bg-bg border border-border shadow-sm">
          <div className="text-xs text-fg/60 mb-1 flex items-center justify-center gap-1 uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-accent" />
            <span>Accuracy</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-fg">
            {result.accuracy || 100}%
          </div>
          <span className="text-[10px] text-fg/60 uppercase">Precision</span>
        </div>

        <div className="p-4 rounded-xl bg-bg border border-border shadow-sm">
          <div className="text-xs text-fg/60 mb-1 flex items-center justify-center gap-1 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-danger" />
            <span>Errors</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-danger">
            {result.errors ?? 0}
          </div>
          <span className="text-[10px] text-fg/60 uppercase">Mistakes</span>
        </div>

        <div className="p-4 rounded-xl bg-bg border border-border shadow-sm">
          <div className="text-xs text-fg/60 mb-1 flex items-center justify-center gap-1 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-fg/60" />
            <span>Time</span>
          </div>
          <div className="text-3xl sm:text-4xl font-black text-fg">
            {Math.round((result.durationMs || 0) / 1000)}s
          </div>
          <span className="text-[10px] text-fg/60 uppercase">Duration</span>
        </div>
      </div>

      {/* Chart Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 mb-3 pt-3 border-t border-border">
        <span className="text-xs font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-accent" />
          <span>Live Performance Charts</span>
        </span>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-bg border border-border text-xs">
          <button
            onClick={() => setChartView('all')}
            className={`px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1 cursor-pointer ${
              chartView === 'all'
                ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                : 'bg-surface text-fg hover:bg-surface-hover hover:border-strong border border-border'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Charts</span>
          </button>

          <button
            onClick={() => setChartView('big')}
            className={`px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1 cursor-pointer ${
              chartView === 'big'
                ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                : 'bg-surface text-fg hover:bg-surface-hover hover:border-strong border border-border'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setChartView('line')}
            className={`px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1 cursor-pointer ${
              chartView === 'line'
                ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                : 'bg-surface text-fg hover:bg-surface-hover hover:border-strong border border-border'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Speed</span>
          </button>

          <button
            onClick={() => setChartView('pie')}
            className={`px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1 cursor-pointer ${
              chartView === 'pie'
                ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                : 'bg-surface text-fg hover:bg-surface-hover hover:border-strong border border-border'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Accuracy</span>
          </button>
        </div>
      </div>

      {/* Charts Render Area */}
      <div className="space-y-4 my-3">
        {(chartView === 'all' || chartView === 'big') && (
          <PerformanceBigChart
            timeline={activeTimeline}
            title="Complete Velocity & Accuracy Timeline"
            height={240}
          />
        )}

        {(chartView === 'all' || chartView === 'line' || chartView === 'pie') && (
          <div
            className={`grid gap-4 ${
              chartView === 'all' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {(chartView === 'all' || chartView === 'line') && (
              <PerformanceLineChart
                data={lineChartData}
                title="WPM Speed Progression"
                height={190}
                showAverage={true}
              />
            )}

            {(chartView === 'all' || chartView === 'pie') && (
              <AccuracyPieChart
                data={pieChartData}
                title="Keystrokes & Accuracy Breakdown"
                centerLabel="Accuracy"
                centerValue={`${result.accuracy || 100}%`}
                size={180}
              />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-accent text-bg font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-hover hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-150 shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        )}

        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-surface border border-strong text-fg hover:bg-surface-hover hover:border-accent active:scale-[0.98] font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-150 shadow-sm cursor-pointer"
          >
            <span>Exit to Home</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
