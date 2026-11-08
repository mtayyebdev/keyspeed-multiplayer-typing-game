import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGetLeaderboardQuery } from '../features/leaderboard/leaderboardApi';
import {
  Trophy,
  Calendar,
  Zap,
  Award,
  Loader2,
  ArrowUpRight,
  BarChart2,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Layers,
  Crown,
  Target,
  Users,
} from 'lucide-react';
import PerformanceBigChart from '../components/charts/PerformanceBigChart';
import PerformanceLineChart from '../components/charts/PerformanceLineChart';
import AccuracyPieChart from '../components/charts/AccuracyPieChart';
import LeaderboardBarChart from '../components/charts/LeaderboardBarChart';

import { useSelector } from 'react-redux';

// Realistic fallback benchmark data if the database has 0 verified runs yet
const DEMO_LEADERS = [
  { _id: 'd1', rank: 1, username: 'VelocityPrime', wpm: 124, accuracy: 99, racesPlayed: 84, racesWon: 62 },
  { _id: 'd2', rank: 2, username: 'CyberTypist', wpm: 112, accuracy: 98, racesPlayed: 65, racesWon: 41 },
  { _id: 'd3', rank: 3, username: 'GhostKey', wpm: 105, accuracy: 99, racesPlayed: 92, racesWon: 53 },
  { _id: 'd4', rank: 4, username: 'NeonSprint', wpm: 96, accuracy: 97, racesPlayed: 48, racesWon: 27 },
  { _id: 'd5', rank: 5, username: 'PulseRacer', wpm: 88, accuracy: 96, racesPlayed: 39, racesWon: 18 },
  { _id: 'd6', rank: 6, username: 'ApexFingers', wpm: 82, accuracy: 95, racesPlayed: 51, racesWon: 22 },
  { _id: 'd7', rank: 7, username: 'QuantumShift', wpm: 76, accuracy: 98, racesPlayed: 30, racesWon: 11 },
  { _id: 'd8', rank: 8, username: 'EchoStrike', wpm: 71, accuracy: 94, racesPlayed: 25, racesWon: 9 },
  { _id: 'd9', rank: 9, username: 'ShadowTap', wpm: 66, accuracy: 97, racesPlayed: 19, racesWon: 6 },
  { _id: 'd10', rank: 10, username: 'NovaDrift', wpm: 60, accuracy: 93, racesPlayed: 15, racesWon: 4 },
];

export default function LeaderboardPage() {
  const [scope, setScope] = useState('alltime'); // 'alltime' | 'daily'
  const [selectedGameId, setSelectedGameId] = useState('classic-race'); // 'classic-race' | 'car-race'
  const [chartView, setChartView] = useState('all'); // 'all' | 'big' | 'line' | 'pie' | 'bars'
  const currentUsername = useSelector((state) => state.auth?.user?.username);
  const { data: leaders = [], isLoading, isFetching } = useGetLeaderboardQuery({
    scope,
    gameId: selectedGameId,
  });

  const isDemo = leaders.length === 0;
  const chartLeaders = leaders.length > 0 ? leaders : DEMO_LEADERS;

  // Key metrics for quick stat cards
  const peakWpm = Math.max(...chartLeaders.map((l) => l.wpm || 0), 0);
  const avgWpm = Math.round(
    chartLeaders.reduce((acc, l) => acc + (l.wpm || 0), 0) / (chartLeaders.length || 1)
  );
  const peakAccuracy = Math.max(...chartLeaders.map((l) => l.accuracy || 0), 0);
  const totalRanked = leaders.length > 0 ? leaders.length : DEMO_LEADERS.length;

  // 1. Big Chart Timeline: Rank by rank speed & precision
  const leaderboardTimeline = chartLeaders.map((l) => ({
    second: l.rank, // represents Rank #
    wpm: l.wpm,
    rawWpm: Math.round(l.wpm * 1.05),
    accuracy: l.accuracy || 98,
    errors: Math.max(0, 100 - (l.accuracy || 98)),
  }));

  // 2. Line Chart Data: Rank #1 to #N curve
  const leaderboardLineData = chartLeaders.map((l) => ({
    label: `#${l.rank} ${l.username.length > 7 ? l.username.substring(0, 6) + '…' : l.username}`,
    value: l.wpm,
    secondary: Math.round(l.wpm * 1.05),
  }));

  // 3. Pie Chart Data: Speed Tiers Distribution
  const tier100Plus = chartLeaders.filter((l) => l.wpm >= 100).length;
  const tier80to99 = chartLeaders.filter((l) => l.wpm >= 80 && l.wpm < 100).length;
  const tier60to79 = chartLeaders.filter((l) => l.wpm >= 60 && l.wpm < 80).length;
  const tierUnder60 = chartLeaders.filter((l) => l.wpm < 60).length;

  const speedTiersPieData = [
    { label: '100+ WPM (Hyper Sonic)', value: tier100Plus, type: 'correct' },
    { label: '80–99 WPM (Expert)', value: tier80to99, type: 'correct' },
    { label: '60–79 WPM (Pro)', value: tier60to79, type: 'correct' },
    { label: '<60 WPM (Standard)', value: tierUnder60, type: 'error' },
  ].filter((t) => t.value > 0);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-lg bg-accent text-bg font-black text-xs flex items-center justify-center shadow-sm">
          1
        </span>
      );
    }
    if (rank === 2 || rank === 3) {
      return (
        <span className="w-7 h-7 rounded-lg bg-accent-soft text-accent border border-accent/40 font-bold text-xs flex items-center justify-center shadow-sm">
          {rank}
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-lg bg-surface border border-border text-fg/70 font-semibold text-xs flex items-center justify-center">
        {rank}
      </span>
    );
  };

  const top3 = chartLeaders.slice(0, 3);

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full py-8">
      {/* Heading & Scope Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
              KeySpeed <span className="text-accent">Leaderboard</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-fg/60">
            <span>Top verified typists on KeySpeed</span>
            {isDemo && (
              <span className="px-2 py-0.5 rounded-full bg-accent-soft text-accent font-mono text-[10px] border border-accent/20">
                KeySpeed Benchmarks Preview
              </span>
            )}
          </div>
        </div>

        {/* Game & Scope switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Game Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg border border-border">
            <button
              onClick={() => setSelectedGameId('classic-race')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                selectedGameId === 'classic-race'
                  ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                  : 'bg-surface text-fg hover:bg-surface-hover border border-border'
              }`}
            >
              <span>🏁 Classic Race</span>
            </button>
            <button
              onClick={() => setSelectedGameId('car-race')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                selectedGameId === 'car-race'
                  ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                  : 'bg-surface text-fg hover:bg-surface-hover border border-border'
              }`}
            >
              <span>🏎️ Car Race</span>
            </button>
          </div>

          {/* Scope switch */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg border border-border w-fit">
            <button
              onClick={() => setScope('alltime')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                scope === 'alltime'
                  ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                  : 'bg-surface text-fg hover:bg-surface-hover border border-border'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>All-Time</span>
            </button>

            <button
              onClick={() => setScope('daily')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                scope === 'daily'
                  ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                  : 'bg-surface text-fg hover:bg-surface-hover border border-border'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Today's Daily</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="rounded-2xl p-4 border border-border bg-surface shadow-card text-center font-mono hover:border-strong transition-all duration-150">
          <div className="flex items-center justify-center gap-1 text-xs text-fg/60 mb-1 uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 text-accent" />
            <span>#1 Peak Speed</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-accent">
            {peakWpm} WPM
          </div>
          <span className="text-[10px] text-fg/60 uppercase">{chartLeaders[0]?.username || 'Leader'}</span>
        </div>

        <div className="rounded-2xl p-4 border border-border bg-surface shadow-card text-center font-mono hover:border-strong transition-all duration-150">
          <div className="flex items-center justify-center gap-1 text-xs text-fg/60 mb-1 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span>Arena Average</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-fg">
            {avgWpm} WPM
          </div>
          <span className="text-[10px] text-fg/60 uppercase">Top 20 Typists</span>
        </div>

        <div className="rounded-2xl p-4 border border-border bg-surface shadow-card text-center font-mono hover:border-strong transition-all duration-150">
          <div className="flex items-center justify-center gap-1 text-xs text-fg/60 mb-1 uppercase tracking-wider">
            <Target className="w-3.5 h-3.5 text-accent" />
            <span>Top Accuracy</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-fg">
            {peakAccuracy}%
          </div>
          <span className="text-[10px] text-fg/60 uppercase">Precision Record</span>
        </div>

        <div className="rounded-2xl p-4 border border-border bg-surface shadow-card text-center font-mono hover:border-strong transition-all duration-150">
          <div className="flex items-center justify-center gap-1 text-xs text-fg/60 mb-1 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-accent" />
            <span>Ranked Racers</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-fg">
            {totalRanked}
          </div>
          <span className="text-[10px] text-fg/60 uppercase">Verified Records</span>
        </div>
      </div>

      {/* Top 3 Podium Showcase */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
          {/* #2 Second Place */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl p-5 border border-border bg-surface shadow-card text-center order-2 md:order-1 relative hover:border-strong transition-all duration-150"
          >
            <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent border border-accent/30 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-sm">
              #2
            </div>
            <h3 className="font-bold text-fg text-base truncate">{top3[1].username}</h3>
            <div className="text-2xl font-black font-mono text-fg mt-1">
              {top3[1].wpm} <span className="text-xs font-normal text-fg/60">WPM</span>
            </div>
            <div className="text-xs font-mono text-fg/60 mt-1">
              {top3[1].accuracy}% Accuracy
            </div>
          </motion.div>

          {/* #1 First Place (Accent Highlight) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl p-6 border-2 border-accent bg-accent-soft shadow-card text-center order-1 md:order-2 relative md:-mt-4"
          >
            <div className="w-11 h-11 rounded-2xl bg-accent text-bg font-black text-base flex items-center justify-center mx-auto mb-2 shadow-sm">
              <Crown className="w-5 h-5 fill-current" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent block mb-1">
              KeySpeed Champion
            </span>
            <h3 className="font-black text-fg text-lg truncate">{top3[0].username}</h3>
            <div className="text-3xl sm:text-4xl font-black font-mono text-accent mt-1">
              {top3[0].wpm} <span className="text-sm font-normal text-fg/60">WPM</span>
            </div>
            <div className="text-xs font-mono text-fg/60 mt-1 font-semibold">
              {top3[0].accuracy}% Accuracy • {top3[0].racesWon || 0} Wins
            </div>
          </motion.div>

          {/* #3 Third Place */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl p-5 border border-border bg-surface shadow-card text-center order-3 relative hover:border-strong transition-all duration-150"
          >
            <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent border border-accent/30 font-black text-sm flex items-center justify-center mx-auto mb-2 shadow-sm">
              #3
            </div>
            <h3 className="font-bold text-fg text-base truncate">{top3[2].username}</h3>
            <div className="text-2xl font-black font-mono text-fg mt-1">
              {top3[2].wpm} <span className="text-xs font-normal text-fg/60">WPM</span>
            </div>
            <div className="text-xs font-mono text-fg/60 mt-1">
              {top3[2].accuracy}% Accuracy
            </div>
          </motion.div>
        </div>
      )}

      {/* Live Charts Section */}
      <div className="space-y-4 mb-6">
        {/* Chart View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-accent flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-fg tracking-tight">
              Leaderboard Analytics & Live Charts
            </h2>
          </div>

          <div className="w-full sm:w-auto overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-bg border border-border text-xs min-w-max">
              <button
                onClick={() => setChartView('all')}
                className={`px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  chartView === 'all'
                    ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                    : 'bg-surface text-fg hover:bg-surface-hover hover:border-strong border border-border font-medium'
                }`}
              >
                <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                <span>All Charts</span>
              </button>

              <button
                onClick={() => setChartView('big')}
                className={`px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  chartView === 'big'
                    ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                    : 'bg-surface text-fg hover:bg-surface-hover hover:border-strong border border-border font-medium'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Velocity (Big)</span>
              </button>

              <button
                onClick={() => setChartView('line')}
                className={`px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  chartView === 'line'
                    ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                    : 'bg-surface text-fg hover:bg-surface-hover hover:border-strong border border-border font-medium'
                }`}
              >
                <LineIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Rank Curve</span>
              </button>

              <button
                onClick={() => setChartView('pie')}
                className={`px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  chartView === 'pie'
                    ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                    : 'bg-surface text-fg hover:bg-surface-hover hover:border-strong border border-border font-medium'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Speed Tiers</span>
              </button>

              <button
                onClick={() => setChartView('bars')}
                className={`px-2.5 py-1 rounded-lg transition-all duration-150 flex items-center gap-1 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  chartView === 'bars'
                    ? 'bg-accent text-bg font-bold shadow-sm border border-accent'
                    : 'bg-surface text-fg hover:bg-surface-hover hover:border-strong border border-border font-medium'
                }`}
              >
                <Award className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Top Typists</span>
              </button>
            </div>
          </div>
        </div>

        {/* Big Performance Chart */}
        {(chartView === 'all' || chartView === 'big') && (
          <PerformanceBigChart
            timeline={leaderboardTimeline}
            title="Rank-by-Rank Velocity & Precision Curve"
            height={240}
          />
        )}

        {/* Side-by-Side: Line Chart + Speed Tiers Pie Chart */}
        {(chartView === 'all' || chartView === 'line' || chartView === 'pie') && (
          <div
            className={`grid gap-4 ${
              chartView === 'all' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {(chartView === 'all' || chartView === 'line') && (
              <PerformanceLineChart
                data={leaderboardLineData}
                title="WPM Speed Dropoff Across Ranks"
                height={190}
                showAverage={true}
              />
            )}

            {(chartView === 'all' || chartView === 'pie') && (
              <AccuracyPieChart
                data={speedTiersPieData}
                title="Arena Speed Tier Distribution"
                centerLabel="Avg Speed"
                centerValue={`${avgWpm} WPM`}
                size={180}
              />
            )}
          </div>
        )}

        {/* Top Racers Comparison Bar Chart */}
        {(chartView === 'all' || chartView === 'bars') && (
          <LeaderboardBarChart
            leaders={chartLeaders}
            title="Top Racers WPM Benchmark"
            maxItems={8}
          />
        )}
      </div>

      {/* Detailed Standings Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-fg">
              Verified Rankings
            </h3>
          </div>
          {isFetching && (
            <div className="flex items-center gap-2 text-xs text-accent font-mono font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <span className="text-xs text-fg/60">Loading standings...</span>
          </div>
        ) : chartLeaders.length === 0 ? (
          <div className="p-16 text-center text-fg/60 flex flex-col items-center gap-3">
            <Award className="w-10 h-10 text-fg/40" />
            <p className="text-sm font-semibold text-fg">No records yet for this period.</p>
            <p className="text-xs text-fg/60">
              Be the first racer to set a high score today!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-bg text-fg/70 font-semibold uppercase tracking-wider text-[11px] border-b border-border">
                <tr>
                  <th className="py-3.5 px-4 w-16">Rank</th>
                  <th className="py-3.5 px-4">Racer</th>
                  <th className="py-3.5 px-4 text-right">WPM</th>
                  <th className="py-3.5 px-4 text-right">Accuracy</th>
                  <th className="py-3.5 px-4 text-right hidden sm:table-cell">Races</th>
                  <th className="py-3.5 px-4 text-right hidden sm:table-cell">Wins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chartLeaders.map((leader, index) => {
                  const isMe = currentUsername && leader.username === currentUsername;
                  return (
                    <tr
                      key={leader._id || leader.username}
                      className={`transition-all duration-150 group ${
                        isMe
                          ? 'bg-accent-soft border-l-4 border-accent font-semibold'
                          : index % 2 === 0
                          ? 'bg-surface hover:bg-surface-hover'
                          : 'bg-bg hover:bg-surface-hover'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono">{getRankBadge(leader.rank)}</td>
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/profile/${leader.username}`}
                          className="font-semibold text-fg group-hover:text-accent transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{leader.username}</span>
                          {isMe && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-accent text-bg shadow-sm">
                              YOU
                            </span>
                          )}
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black font-mono text-accent text-sm sm:text-base">
                        {leader.wpm}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-fg font-medium">
                        {leader.accuracy}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-fg/70 hidden sm:table-cell">
                        {leader.racesPlayed || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-fg font-bold hidden sm:table-cell">
                        {leader.racesWon || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
