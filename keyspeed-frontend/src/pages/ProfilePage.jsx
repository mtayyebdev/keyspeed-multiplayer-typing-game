import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  useGetUserProfileQuery,
  useGetMyResultsQuery,
  useGetMeQuery,
} from '../features/auth/authApi';
import {
  User,
  Zap,
  Activity,
  Trophy,
  Award,
  Calendar,
  Loader2,
  Clock,
  BarChart2,
} from 'lucide-react';
import PerformanceBigChart from '../components/charts/PerformanceBigChart';
import PerformanceLineChart from '../components/charts/PerformanceLineChart';
import AccuracyPieChart from '../components/charts/AccuracyPieChart';

export default function ProfilePage() {
  const { username } = useParams();
  const authUser = useSelector((state) => state.auth.user);

  // If a specific username param is present, view that user's public profile
  const isSelf = !username || username.toLowerCase() === authUser?.username?.toLowerCase();

  const { data: publicData, isLoading: isPublicLoading } = useGetUserProfileQuery(username, {
    skip: !username,
  });

  const { data: myResults = [], isLoading: isMyResultsLoading } = useGetMyResultsQuery(undefined, {
    skip: !!username,
  });

  const { data: myUserData, isLoading: isMeLoading } = useGetMeQuery(undefined, {
    skip: !!username,
  });

  const profileUser = username ? publicData?.user : myUserData || authUser;
  const results = username ? publicData?.lastResults || [] : myResults || [];
  const isLoading = username ? isPublicLoading : isMeLoading || isMyResultsLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
        <p className="text-xs text-fg/60">Loading racer profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <User className="w-12 h-12 text-fg/40 mb-3" />
        <h2 className="text-xl font-bold text-fg mb-2">Racer Not Found</h2>
        <p className="text-xs text-fg/60 mb-6">The requested racer profile could not be located.</p>
        <Link
          to="/leaderboard"
          className="px-4 py-2 rounded-xl bg-accent text-bg text-xs font-semibold"
        >
          View Leaderboard
        </Link>
      </div>
    );
  }

  const joinDate = profileUser.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Oct 2026';

  // Sort match results chronologically for live trend charting
  const sortedResults = [...results].reverse();

  let profileTimeline = [];
  if (sortedResults.length > 0) {
    profileTimeline = sortedResults.map((r, i) => ({
      second: i + 1,
      wpm: r.wpm || 0,
      rawWpm: Math.round((r.wpm || 0) * 1.06),
      accuracy: r.accuracy || 100,
      errors: r.errors ?? 0,
    }));
  } else {
    // Generate realistic curve based on actual user profile metrics
    const avg = profileUser.avgWpm || 40;
    const best = profileUser.bestWpm || Math.round(avg * 1.25);
    profileTimeline = [
      { second: 1, wpm: Math.round(avg * 0.85), rawWpm: Math.round(avg * 0.9), accuracy: 96, errors: 2 },
      { second: 2, wpm: Math.round(avg * 0.94), rawWpm: Math.round(avg * 0.99), accuracy: 98, errors: 1 },
      { second: 3, wpm: avg, rawWpm: Math.round(avg * 1.05), accuracy: 97, errors: 1 },
      { second: 4, wpm: Math.round(avg * 1.07), rawWpm: Math.round(avg * 1.12), accuracy: 99, errors: 0 },
      { second: 5, wpm: best, rawWpm: Math.round(best * 1.06), accuracy: 100, errors: 0 },
    ];
  }

  // Line Chart Data: Speed progression
  const profileLineData = profileTimeline.map((item, i) => ({
    label: sortedResults[i] ? `M#${i + 1}` : `Match ${item.second}`,
    value: item.wpm,
    secondary: item.rawWpm,
  }));

  // Pie Chart Data: Win Rate & Competitive Podium Distribution
  const racesPlayed = profileUser.racesPlayed || results.length || 0;
  const racesWon = profileUser.racesWon || results.filter((r) => r.position === 1).length || 0;
  const podiumFinishes = results.filter((r) => r.position === 2 || r.position === 3).length;
  const otherFinishes = Math.max(0, racesPlayed - racesWon - podiumFinishes);
  const winRate = racesPlayed > 0 ? Math.round((racesWon / racesPlayed) * 100) : 0;

  const profilePieData = [
    { label: 'Victories (1st)', value: racesWon, type: 'correct' },
    { label: 'Podiums (2nd/3rd)', value: podiumFinishes, type: 'correct' },
    { label: 'Other Finishes', value: otherFinishes, type: 'error' },
  ];

  const statsByGame = publicData?.statsByGame;
  const classicResults = results.filter((r) => !r.gameId || r.gameId === 'classic-race');
  const carResults = results.filter((r) => r.gameId === 'car-race');

  const classicStats = statsByGame?.['classic-race'] || {
    racesPlayed: classicResults.length || profileUser.racesPlayed || 0,
    racesWon: classicResults.filter((r) => r.position === 1).length || profileUser.racesWon || 0,
    avgWpm: profileUser.avgWpm || 0,
    bestWpm: profileUser.bestWpm || 0,
  };

  const carStats = statsByGame?.['car-race'] || {
    racesPlayed: carResults.length || 0,
    racesWon: carResults.filter((r) => r.position === 1).length || 0,
    avgWpm:
      carResults.length > 0
        ? Math.round(carResults.reduce((a, b) => a + (b.wpm || 0), 0) / carResults.length)
        : 0,
    bestWpm: carResults.length > 0 ? Math.max(...carResults.map((r) => r.wpm || 0)) : 0,
    topSpeed:
      carResults.length > 0
        ? Math.max(...carResults.map((r) => r.topSpeed || Math.round((r.wpm || 0) * 2.67)))
        : 0,
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full py-8">
      {/* Profile Header Card */}
      <div className="rounded-2xl p-6 sm:p-8 border border-border bg-surface shadow-card mb-6 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-accent text-bg flex items-center justify-center font-black text-3xl shrink-0 shadow-sm">
            {profileUser.username?.[0]?.toUpperCase() || 'R'}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
                {profileUser.username}
              </h1>
              {isSelf && (
                <span className="w-fit mx-auto sm:mx-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/20 shadow-sm">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-fg/60">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                Joined {joinDate}
              </span>
              <span>•</span>
              <span className="text-accent font-semibold bg-accent-soft px-2 py-0.5 rounded-full border border-accent/20 text-[11px]">
                Active Racer
              </span>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-border">
          <div className="p-4 rounded-xl bg-bg border border-border text-center shadow-sm hover:border-strong transition-all duration-150">
            <div className="flex items-center justify-center gap-1 text-xs text-fg/60 mb-1">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>Best WPM</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-accent">
              {profileUser.bestWpm || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg border border-border text-center shadow-sm hover:border-strong transition-all duration-150">
            <div className="flex items-center justify-center gap-1 text-xs text-fg/60 mb-1">
              <Activity className="w-3.5 h-3.5 text-accent" />
              <span>Average WPM</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-fg">
              {profileUser.avgWpm || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg border border-border text-center shadow-sm hover:border-strong transition-all duration-150">
            <div className="flex items-center justify-center gap-1 text-xs text-fg/60 mb-1">
              <Award className="w-3.5 h-3.5 text-accent" />
              <span>Races Played</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-fg">
              {profileUser.racesPlayed || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg border border-border text-center shadow-sm hover:border-strong transition-all duration-150">
            <div className="flex items-center justify-center gap-1 text-xs text-fg/60 mb-1">
              <Trophy className="w-3.5 h-3.5 text-accent" />
              <span>Races Won</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-accent">
              {profileUser.racesWon || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Per Game Discipline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Classic Race Card */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏁</span>
              <h3 className="text-base font-bold text-fg">Classic Race</h3>
            </div>
            <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/30">
              Classic
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded-xl bg-bg border border-border">
              <span className="text-[10px] text-fg/60 block">Races</span>
              <span className="text-lg font-bold text-fg">{classicStats.racesPlayed}</span>
            </div>
            <div className="p-2 rounded-xl bg-bg border border-border">
              <span className="text-[10px] text-fg/60 block">Victories</span>
              <span className="text-lg font-bold text-accent">{classicStats.racesWon}</span>
            </div>
            <div className="p-2 rounded-xl bg-bg border border-border">
              <span className="text-[10px] text-fg/60 block">Best WPM</span>
              <span className="text-lg font-bold text-fg">{classicStats.bestWpm}</span>
            </div>
          </div>
        </div>

        {/* Car Race Card */}
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏎️</span>
              <h3 className="text-base font-bold text-fg">Car Race GP</h3>
            </div>
            <span className="text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full bg-accent text-bg border border-accent">
              New
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded-xl bg-bg border border-border">
              <span className="text-[10px] text-fg/60 block">Races</span>
              <span className="text-lg font-bold text-fg">{carStats.racesPlayed}</span>
            </div>
            <div className="p-2 rounded-xl bg-bg border border-border">
              <span className="text-[10px] text-fg/60 block">Victories</span>
              <span className="text-lg font-bold text-accent">{carStats.racesWon}</span>
            </div>
            <div className="p-2 rounded-xl bg-bg border border-border">
              <span className="text-[10px] text-fg/60 block">Top Speed</span>
              <span className="text-lg font-bold text-accent">
                {carStats.topSpeed ? `${carStats.topSpeed} km/h` : `${Math.round(carStats.bestWpm * 2.67)} km/h`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Performance Analytics Section */}
      <div className="space-y-6 mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-fg tracking-tight">
            Performance Analytics & Live Charts
          </h2>
        </div>

        {/* Big Chart */}
        <PerformanceBigChart
          timeline={profileTimeline}
          title="Performance Progression Across Matches"
          height={250}
        />

        {/* Side-by-Side: Line Chart + Pie Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PerformanceLineChart
            data={profileLineData}
            title="Speed Velocity Trend"
            height={190}
            showAverage={true}
          />

          <AccuracyPieChart
            data={profilePieData}
            title="Podium & Race Outcomes"
            centerLabel="Win Rate"
            centerValue={`${winRate}%`}
            size={180}
          />
        </div>
      </div>

      {/* Last 10 Results Card */}
      <div className="rounded-2xl p-6 sm:p-8 border border-border bg-surface shadow-card">
        <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" />
          <span>Last 10 Race Results</span>
        </h2>

        {results.length === 0 ? (
          <div className="py-12 text-center text-fg/60 text-xs">
            No race records saved yet. Complete a solo practice or live race to see records!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-bg text-fg/70 text-[11px] uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3 text-right">WPM</th>
                  <th className="py-3 px-3 text-right">Accuracy</th>
                  <th className="py-3 px-3 text-right">Errors</th>
                  <th className="py-3 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((res, index) => {
                  const mode = res.raceId?.mode || (res.position === 1 ? 'solo' : 'race');
                  const dateStr = res.createdAt
                    ? new Date(res.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Today';

                  return (
                    <tr
                      key={res._id}
                      className={`transition-all duration-150 ${
                        index % 2 === 0
                          ? 'bg-surface hover:bg-surface-hover'
                          : 'bg-bg hover:bg-surface-hover'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold border border-accent/20 bg-accent-soft text-accent">
                          {mode}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {res.position ? (
                          <span className={res.position === 1 ? 'text-accent font-black' : 'text-fg/70'}>
                            #{res.position}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-black font-mono text-accent">
                        {res.wpm}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-fg font-medium">
                        {res.accuracy}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-danger font-semibold">
                        {res.errors ?? 0}
                      </td>
                      <td className="py-3 px-3 text-right text-fg/60 font-mono text-[11px]">
                        {dateStr}
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
