import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Activity,
  Trophy,
  ShieldAlert,
  Ban,
  Radio,
  Play,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import StatCard from '../../components/StatCard';
import ChartCard from '../../components/ChartCard';
import StatusBadge from '../../components/StatusBadge';
import { CardSkeleton } from '../../components/Skeleton';
import {
  useGetOverviewStatsQuery,
  useGetOverviewChartsQuery,
} from './adminOverviewApi';
import { formatRelativeTime, formatNumber } from '../../lib/formatters';
import { getChartThemeColors } from '../../lib/chartTheme';

export default function OverviewPage() {
  const [range, setRange] = useState(30);

  const { data: statsData, isLoading: isStatsLoading } = useGetOverviewStatsQuery();
  const { data: chartsData, isLoading: isChartsLoading } = useGetOverviewChartsQuery(range);

  const themeColors = getChartThemeColors();
  const stats = statsData?.stats;
  const latestUsers = statsData?.latestUsers || [];
  const latestFlagged = statsData?.latestFlagged || [];
  const latestActions = statsData?.latestActions || [];

  const trends = chartsData?.trends || [];
  const modeSplit = chartsData?.modeSplit || { solo: 0, live: 0 };
  const totalModeRaces = (modeSplit.solo || 0) + (modeSplit.live || 0);

  const pieData = [
    { name: 'Live Races', value: modeSplit.live || 0, color: themeColors.accent },
    { name: 'Solo Tests', value: modeSplit.solo || 0, color: themeColors.muted },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Stat Cards Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-fg tracking-tight">Key Metrics</h2>
          <span className="text-xs text-fg/50">Real-time platform activity</span>
        </div>

        {isStatsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatCard
              title="Total Racers"
              value={formatNumber(stats?.totalUsers)}
              subtitle={`+${stats?.newUsersToday || 0} registered today`}
              icon={Users}
            />
            <StatCard
              title="Active Racers (24h)"
              value={formatNumber(stats?.activeUsersLast24h)}
              subtitle="Logged in past 24 hours"
              icon={Activity}
            />
            <StatCard
              title="Total Races"
              value={formatNumber(stats?.totalRaces)}
              subtitle={`${stats?.racesToday || 0} completed today`}
              icon={Trophy}
            />
            <StatCard
              title="Flagged Runs"
              value={formatNumber(stats?.flaggedPending)}
              subtitle="Pending anti-cheat review"
              icon={ShieldAlert}
              className={stats?.flaggedPending > 0 ? 'border-danger/40 bg-surface' : ''}
            />
            <StatCard
              title="Online Now"
              value={formatNumber(stats?.onlineUsersNow)}
              subtitle="Active socket racers"
              icon={Radio}
            />
            <StatCard
              title="Live Rooms"
              value={formatNumber(stats?.activeRoomsNow)}
              subtitle="Races currently running"
              icon={Play}
            />
            <StatCard
              title="Banned Users"
              value={formatNumber(stats?.bannedUsers)}
              subtitle="Suspended accounts"
              icon={Ban}
            />
            <StatCard
              title="New Users Today"
              value={formatNumber(stats?.newUsersToday)}
              subtitle="Joined since midnight"
              icon={UserPlus}
            />
          </div>
        )}
      </section>

      {/* 2. Charts Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-fg tracking-tight">Growth & Performance Trends</h2>
            <p className="text-xs text-fg/50">Aggregated historical metrics</p>
          </div>

          {/* Date range filter chips */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border self-start sm:self-auto">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                  range === d
                    ? 'bg-accent text-bg shadow-sm'
                    : 'text-fg/60 hover:text-fg hover:bg-surface-hover'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Signups & Races Chart */}
          <ChartCard
            title="Activity (Signups & Races)"
            subtitle={`Daily counts over last ${range} days`}
            className="lg:col-span-2"
          >
            {isChartsLoading ? (
              <div className="w-full h-64 animate-pulse bg-fg/5 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRaces" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeColors.accent} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={themeColors.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={themeColors.border} opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    stroke={themeColors.fg}
                    opacity={0.5}
                    fontSize={11}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis stroke={themeColors.fg} opacity={0.5} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                      borderRadius: '12px',
                      color: themeColors.fg,
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="races"
                    name="Races"
                    stroke={themeColors.accent}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRaces)"
                  />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    name="Signups"
                    stroke={themeColors.fg}
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Race Mode Split */}
          <ChartCard
            title="Race Mode Distribution"
            subtitle="Solo practice vs Live races"
          >
            {isChartsLoading ? (
              <div className="w-full h-64 animate-pulse bg-fg/5 rounded-xl" />
            ) : totalModeRaces === 0 ? (
              <div className="text-center text-xs text-fg/50 p-6">No race data for this range</div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={themeColors.surface} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                        borderRadius: '12px',
                        color: themeColors.fg,
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex items-center gap-6 mt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-fg/80">Live: {modeSplit.live}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-fg/40" />
                    <span className="text-fg/80">Solo: {modeSplit.solo}</span>
                  </div>
                </div>
              </div>
            )}
          </ChartCard>

          {/* Average WPM Trend */}
          <ChartCard
            title="Average WPM Trend"
            subtitle={`Overall racer speed progression over ${range} days`}
            className="lg:col-span-3"
          >
            {isChartsLoading ? (
              <div className="w-full h-64 animate-pulse bg-fg/5 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={themeColors.border} opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    stroke={themeColors.fg}
                    opacity={0.5}
                    fontSize={11}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis stroke={themeColors.fg} opacity={0.5} fontSize={11} unit=" WPM" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                      borderRadius: '12px',
                      color: themeColors.fg,
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgWpm"
                    name="Avg WPM"
                    stroke={themeColors.accent}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: themeColors.accent }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </section>

      {/* 3. Recent Activity Lists (Latest Users, Flagged Results, Admin Actions) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Users */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <span>Latest Racers</span>
            </h3>
            <Link
              to="/admin/users"
              className="text-xs text-accent hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {latestUsers.length === 0 ? (
              <div className="text-xs text-fg/50 text-center py-6">No users found</div>
            ) : (
              latestUsers.map((u) => (
                <Link
                  key={u._id}
                  to={`/admin/users/${u._id}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-full bg-accent-soft text-accent border border-accent/20 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-fg truncate">@{u.username}</div>
                      <div className="text-[11px] text-fg/50 truncate">{u.email}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <StatusBadge status={u.role || 'user'} />
                    <div className="text-[10px] text-fg/40 mt-1">{formatRelativeTime(u.createdAt)}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Latest Flagged Results */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-danger" />
              <span>Flagged Runs</span>
            </h3>
            <Link
              to="/admin/flagged"
              className="text-xs text-accent hover:underline flex items-center gap-0.5"
            >
              <span>Review queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {latestFlagged.length === 0 ? (
              <div className="text-xs text-fg/50 text-center py-6">No flagged runs</div>
            ) : (
              latestFlagged.map((r) => (
                <div
                  key={r._id}
                  className="p-2.5 rounded-xl bg-surface-hover/50 border border-border/60 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-fg">
                      @{r.userId?.username || 'Guest'}
                    </div>
                    <div className="text-[11px] text-danger font-mono font-bold mt-0.5">
                      {r.wpm} WPM · {r.accuracy}% acc
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.reviewStatus || 'pending'} />
                    <div className="text-[10px] text-fg/40 mt-1">{formatRelativeTime(r.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Admin Actions */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span>Admin Audit</span>
            </h3>
            <Link
              to="/admin/audit"
              className="text-xs text-accent hover:underline flex items-center gap-0.5"
            >
              <span>Full audit log</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {latestActions.length === 0 ? (
              <div className="text-xs text-fg/50 text-center py-6">No admin actions yet</div>
            ) : (
              latestActions.map((act) => (
                <div
                  key={act._id}
                  className="p-2.5 rounded-xl border border-border/60 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-fg">@{act.adminUsername}</span>
                    <span className="text-[10px] text-fg/40">{formatRelativeTime(act.createdAt)}</span>
                  </div>
                  <div className="text-[11px] text-fg/70 font-mono mt-1 flex items-center gap-1.5">
                    <span className="text-accent font-semibold">{act.action}</span>
                    <span className="text-fg/40">on</span>
                    <span className="text-fg/90">{act.targetType}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
