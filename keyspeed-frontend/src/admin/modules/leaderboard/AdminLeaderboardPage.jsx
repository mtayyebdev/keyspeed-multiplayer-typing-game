import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  RefreshCw,
  Trophy,
  Flame,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../components/ToastContext';
import {
  useGetAdminLeaderboardQuery,
  useRemoveLeaderboardEntryMutation,
  useResetDailyLeaderboardMutation,
  useRecalculateLeaderboardMutation,
} from './adminLeaderboardApi';
import { formatDate, formatRelativeTime } from '../../lib/formatters';

export default function AdminLeaderboardPage() {
  const toast = useToast();
  const [scope, setScope] = useState('alltime');

  const { data: leaderboard = [], isLoading } = useGetAdminLeaderboardQuery(scope);

  const [removeEntry] = useRemoveLeaderboardEntryMutation();
  const [resetDaily] = useResetDailyLeaderboardMutation();
  const [recalculate] = useRecalculateLeaderboardMutation();

  const [modalState, setModalState] = useState({
    type: null, // 'remove' | 'recalculate' | 'resetDaily'
    entry: null,
    isLoading: false,
  });

  const handleExecuteModalAction = async () => {
    setModalState((prev) => ({ ...prev, isLoading: true }));
    try {
      if (modalState.type === 'remove') {
        const id = modalState.entry.resultId || modalState.entry._id;
        await removeEntry(id).unwrap();
        toast.success(`Entry for @${modalState.entry.username} removed from leaderboard.`);
      } else if (modalState.type === 'recalculate') {
        const res = await recalculate().unwrap();
        toast.success(res.message);
      } else if (modalState.type === 'resetDaily') {
        const res = await resetDaily().unwrap();
        toast.success(res.message);
      }
      setModalState({ type: null, entry: null, isLoading: false });
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Action failed');
      setModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columns = [
    {
      key: 'rank',
      label: 'Rank',
      render: (rank) => {
        const isTop3 = rank <= 3;
        return (
          <span
            className={`inline-flex items-center justify-center font-mono font-bold text-xs rounded-lg px-2 py-0.5 ${
              isTop3
                ? 'bg-accent text-bg shadow-sm'
                : 'bg-surface border border-border text-fg/70'
            }`}
          >
            #{rank}
          </span>
        );
      },
    },
    {
      key: 'user',
      label: 'Racer',
      render: (_, item) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-accent-soft text-accent border border-accent/20 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {item.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-fg">@{item.username}</div>
            <div className="text-[11px] text-fg/50">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'wpm',
      label: 'Speed',
      render: (wpm) => (
        <span className="font-mono font-extrabold text-accent text-sm">
          {wpm} WPM
        </span>
      ),
    },
    {
      key: 'accuracy',
      label: 'Accuracy',
      render: (acc) => <span className="text-xs text-fg/80">{acc}%</span>,
    },
    {
      key: 'racesPlayed',
      label: 'Victories',
      render: (_, item) => (
        <span className="text-xs text-fg/70">
          {item.racesWon || 0} / {item.racesPlayed || 0} races
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Achieved',
      render: (date) => (
        <span className="text-xs text-fg/60" title={formatDate(date)}>
          {formatRelativeTime(date)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (_, item) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setModalState({ type: 'remove', entry: item, isLoading: false })}
            className="p-1.5 rounded-lg text-fg/60 hover:text-danger hover:bg-danger-soft cursor-pointer transition-colors"
            title="Flag and remove from leaderboard"
            aria-label="Remove entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg tracking-tight">Leaderboard Management</h2>
          <p className="text-xs text-fg/60 mt-0.5">
            Supervise platform rankings, recalculate valid statistics, and moderate records
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setModalState({ type: 'recalculate', entry: null, isLoading: false })}
            className="btn-secondary text-xs px-3 py-2 cursor-pointer flex items-center gap-1.5"
            title="Recalculate all-time statistics from valid non-flagged runs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-accent" />
            <span>Recalculate All</span>
          </button>

          <button
            onClick={() => setModalState({ type: 'resetDaily', entry: null, isLoading: false })}
            className="btn-secondary text-xs px-3 py-2 cursor-pointer flex items-center gap-1.5"
            title="Reset daily leaderboard"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Daily</span>
          </button>
        </div>
      </div>

      {/* Scope Filter Switch */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border w-fit shadow-card">
        <button
          onClick={() => setScope('alltime')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            scope === 'alltime'
              ? 'bg-accent text-bg shadow-sm'
              : 'text-fg/60 hover:text-fg hover:bg-surface-hover'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>All-Time Rankings</span>
        </button>

        <button
          onClick={() => setScope('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            scope === 'daily'
              ? 'bg-accent text-bg shadow-sm'
              : 'text-fg/60 hover:text-fg hover:bg-surface-hover'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Daily Leaderboard</span>
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={leaderboard}
          isLoading={isLoading}
          emptyTitle="Leaderboard Empty"
          emptyDescription={`No records found on the ${scope} leaderboard.`}
        />
      </div>

      {/* Remove Entry Modal */}
      <ConfirmModal
        isOpen={modalState.type === 'remove'}
        onClose={() => setModalState({ type: null, entry: null, isLoading: false })}
        onConfirm={handleExecuteModalAction}
        title="Remove Entry From Leaderboard"
        description={`This will flag the run as rejected and recalculate the best WPM for @${modalState.entry?.username}.`}
        confirmText="Remove Entry"
        isDestructive={true}
        isLoading={modalState.isLoading}
      />

      {/* Recalculate Confirmation */}
      <ConfirmModal
        isOpen={modalState.type === 'recalculate'}
        onClose={() => setModalState({ type: null, entry: null, isLoading: false })}
        onConfirm={handleExecuteModalAction}
        title="Recalculate All Racers Statistics?"
        description="This will scan every racer in the database, filter only verified non-flagged runs, and rebuild all average WPM, best WPM, races played, and win counts."
        confirmText="Recalculate All"
        isLoading={modalState.isLoading}
      />

      {/* Reset Daily Confirmation */}
      <ConfirmModal
        isOpen={modalState.type === 'resetDaily'}
        onClose={() => setModalState({ type: null, entry: null, isLoading: false })}
        onConfirm={handleExecuteModalAction}
        title="Reset Daily Leaderboard?"
        description="This will clear the active daily leaderboard standings for all racers."
        confirmText="Reset Daily"
        isDestructive={true}
        isLoading={modalState.isLoading}
      />
    </div>
  );
}
