import React, { useState } from 'react';
import {
  Trash2,
  Eye,
  FileText,
  Clock,
  ShieldAlert,
  Bot,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import FilterBar from '../../components/FilterBar';
import StatusBadge from '../../components/StatusBadge';
import Drawer from '../../components/Drawer';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../components/ToastContext';
import { useTableState } from '../../hooks/useTableState';
import {
  useGetRacesQuery,
  useGetRaceDetailQuery,
  useDeleteRaceMutation,
} from './adminRacesApi';
import { formatDate, formatRelativeTime, formatDuration } from '../../lib/formatters';

export default function RacesListPage() {
  const toast = useToast();
  const {
    page,
    setPage,
    limit,
    setLimit,
    filters,
    setFilter,
    resetFilters,
  } = useTableState({
    mode: 'all',
    gameId: 'all',
    isPrivate: 'all',
    hasBots: false,
    hasFlagged: false,
    startDate: '',
    endDate: '',
  });

  const { data, isLoading } = useGetRacesQuery({
    page,
    limit,
    mode: filters.mode,
    gameId: filters.gameId,
    isPrivate: filters.isPrivate,
    hasBots: filters.hasBots,
    hasFlagged: filters.hasFlagged,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const [deleteRace] = useDeleteRaceMutation();

  // Selected race for Drawer
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const { data: detailData, isFetching: isDetailLoading } = useGetRaceDetailQuery(
    selectedRaceId,
    { skip: !selectedRaceId },
  );

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const races = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const handleDeleteRace = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteRace(deleteTarget._id).unwrap();
      toast.success(res.message || 'Race deleted successfully.');
      setDeleteTarget(null);
      if (selectedRaceId === deleteTarget._id) {
        setSelectedRaceId(null);
      }
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to delete race');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'mode',
      label: 'Mode',
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={r.mode === 'race' ? 'live' : 'solo'} />
          {r.isPrivate && (
            <span className="text-[10px] font-mono uppercase bg-fg/10 text-fg px-1.5 py-0.5 rounded border border-border">
              Private ({r.roomCode || 'CODE'})
            </span>
          )}
          {r.hasFlagged && (
            <span className="text-[10px] bg-danger-soft text-danger px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-danger/20">
              <ShieldAlert className="w-3 h-3" /> Flagged
            </span>
          )}
          {r.hasBots && (
            <span className="text-[10px] bg-surface text-fg/60 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-border">
              <Bot className="w-3 h-3" /> Bots
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'gameId',
      label: 'Game',
      render: (_, r) => (
        <span className="text-xs font-mono font-bold text-fg">
          {r.gameId === 'car-race' ? '🏎️ Car Race' : '🏁 Classic'}
        </span>
      ),
    },
    {
      key: 'playersCount',
      label: 'Players',
      render: (count) => (
        <span className="text-xs font-semibold text-fg">
          {count} {count === 1 ? 'racer' : 'racers'}
        </span>
      ),
    },
    {
      key: 'winner',
      label: 'Winner',
      render: (w) =>
        w ? (
          <div className="text-xs">
            <span className="font-semibold text-fg">@{w.username}</span>
            <span className="ml-1.5 font-mono text-accent font-bold">{w.wpm} WPM</span>
          </div>
        ) : (
          <span className="text-xs text-fg/40">—</span>
        ),
    },
    {
      key: 'text',
      label: 'Typing Text',
      render: (text) => (
        <span className="text-xs text-fg/70 max-w-[200px] truncate block" title={text?.content}>
          {text?.content ? text.content.slice(0, 45) + '...' : '—'}
        </span>
      ),
    },
    {
      key: 'durationSeconds',
      label: 'Duration',
      render: (dur) => (
        <span className="text-xs font-mono text-fg/70 flex items-center gap-1">
          <Clock className="w-3 h-3 text-fg/40" />
          {dur ? formatDuration(dur) : '—'}
        </span>
      ),
    },
    {
      key: 'startedAt',
      label: 'Date',
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
      render: (_, r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedRaceId(r._id)}
            title="Inspect race breakdown"
            aria-label="Inspect race"
            className="p-1.5 rounded-lg text-fg/60 hover:text-fg hover:bg-surface-hover cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            title="Delete race"
            aria-label="Delete race"
            className="p-1.5 rounded-lg text-fg/60 hover:text-danger hover:bg-danger-soft cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg tracking-tight">Races & Results</h2>
          <p className="text-xs text-fg/60 mt-0.5">Historical race logs, player standings, and metrics</p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar onReset={resetFilters}>
        {/* Game filter */}
        <select
          value={filters.gameId}
          onChange={(e) => setFilter('gameId', e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Games</option>
          <option value="classic-race">Classic Race</option>
          <option value="car-race">Car Race</option>
        </select>

        {/* Mode filter */}
        <select
          value={filters.mode}
          onChange={(e) => setFilter('mode', e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Modes</option>
          <option value="race">Live Race</option>
          <option value="solo">Solo Practice</option>
        </select>

        {/* Private/Public */}
        <select
          value={filters.isPrivate}
          onChange={(e) => setFilter('isPrivate', e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">Public & Private</option>
          <option value="false">Public Races Only</option>
          <option value="true">Private Rooms Only</option>
        </select>

        {/* Toggle Flagged */}
        <button
          onClick={() => setFilter('hasFlagged', !filters.hasFlagged)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
            filters.hasFlagged
              ? 'bg-danger-soft border-danger/40 text-danger'
              : 'bg-surface border-border text-fg/60 hover:text-fg'
          }`}
        >
          Has Flagged Results
        </button>

        {/* Toggle Bots */}
        <button
          onClick={() => setFilter('hasBots', !filters.hasBots)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
            filters.hasBots
              ? 'bg-accent-soft border-accent/40 text-accent'
              : 'bg-surface border-border text-fg/60 hover:text-fg'
          }`}
        >
          Has Bots
        </button>
      </FilterBar>

      {/* Main Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={races}
          isLoading={isLoading}
          emptyTitle="No Races Found"
          emptyDescription="No races match your specified filters."
          onRowClick={(row) => setSelectedRaceId(row._id)}
        />

        <Pagination
          page={page}
          totalPages={meta.totalPages}
          limit={limit}
          total={meta.total}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {/* Race Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedRaceId)}
        onClose={() => setSelectedRaceId(null)}
        title="Race Session Breakdown"
        subtitle={`Session ID: ${selectedRaceId || ''}`}
        width="max-w-lg"
      >
        {isDetailLoading ? (
          <div className="space-y-4">
            <div className="h-28 bg-surface rounded-xl animate-pulse" />
            <div className="h-44 bg-surface rounded-xl animate-pulse" />
          </div>
        ) : detailData ? (
          <div className="space-y-6">
            {/* Race metadata */}
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-fg/60">Mode:</span>
                <StatusBadge status={detailData.race?.mode === 'race' ? 'live' : 'solo'} />
              </div>
              <div className="flex justify-between">
                <span className="text-fg/60">Started:</span>
                <span className="font-semibold text-fg">{formatDate(detailData.race?.startedAt)}</span>
              </div>
              {detailData.race?.endedAt && (
                <div className="flex justify-between">
                  <span className="text-fg/60">Ended:</span>
                  <span className="font-semibold text-fg">{formatDate(detailData.race?.endedAt)}</span>
                </div>
              )}
              {detailData.race?.isPrivate && (
                <div className="flex justify-between">
                  <span className="text-fg/60">Room Code:</span>
                  <span className="font-mono font-bold text-accent">{detailData.race?.roomCode}</span>
                </div>
              )}
            </div>

            {/* Paragraph content preview */}
            <div className="p-4 rounded-xl bg-surface border border-border">
              <div className="flex items-center gap-1.5 text-xs font-bold text-fg mb-2">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>Text Used</span>
              </div>
              <p className="text-xs text-fg/80 leading-relaxed font-mono bg-bg/50 p-3 rounded-lg border border-border/50">
                {detailData.race?.textId?.content || 'Text unavailable'}
              </p>
            </div>

            {/* Player results table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-fg/70 mb-2">
                Racer Standings ({detailData.results?.length || 0})
              </h4>
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/50 text-xs">
                {detailData.results?.map((res) => (
                  <div key={res._id} className="p-3 bg-surface hover:bg-surface-hover flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-fg">
                          #{res.position}
                        </span>
                        <span className="font-semibold text-fg">
                          {res.isBot ? `🤖 ${res.userId?.username || 'Bot'}` : `@${res.userId?.username || 'Guest'}`}
                        </span>
                        {res.flagged && (
                          <span className="text-[10px] bg-danger-soft text-danger px-1 rounded border border-danger/30">
                            Flagged
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-fg/50 mt-0.5">
                        {res.accuracy}% acc · {res.errors || 0} errors
                      </div>
                    </div>

                    <div className="text-right font-mono font-bold text-sm text-accent">
                      {res.wpm} WPM
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delete race button */}
            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setDeleteTarget(detailData.race)}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-danger-soft border border-danger/30 text-danger hover:bg-danger hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Race & Recalculate Stats</span>
              </button>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRace}
        title="Delete Race Record"
        description="This will delete this race and all associated player results. The best and average WPM of all affected racers will be recalculated automatically."
        confirmText="Delete Race"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
