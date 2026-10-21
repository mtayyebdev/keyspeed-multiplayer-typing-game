import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Ban,
  ArrowUpRight,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import FilterBar from '../../components/FilterBar';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/ToastContext';
import { useTableState } from '../../hooks/useTableState';
import {
  useGetFlaggedQuery,
  useApproveFlaggedMutation,
  useRejectFlaggedMutation,
  useRejectAndBanMutation,
} from './adminFlaggedApi';
import { formatDate, formatRelativeTime } from '../../lib/formatters';

export default function FlaggedListPage() {
  const toast = useToast();
  const { page, setPage, limit, setLimit, filters, setFilter, resetFilters } = useTableState({
    status: 'pending',
  });

  const { data, isLoading } = useGetFlaggedQuery({
    page,
    limit,
    status: filters.status,
  });

  const [approveResult] = useApproveFlaggedMutation();
  const [rejectResult] = useRejectFlaggedMutation();
  const [rejectAndBan] = useRejectAndBanMutation();

  const [banModal, setBanModal] = useState({
    isOpen: false,
    item: null,
    reason: '',
    isLoading: false,
  });

  const results = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const handleApprove = async (item) => {
    try {
      await approveResult(item._id).unwrap();
      toast.success('Run approved and restored to leaderboards.');
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to approve');
    }
  };

  const handleReject = async (item) => {
    try {
      await rejectResult(item._id).unwrap();
      toast.success('Run rejected and kept excluded.');
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to reject');
    }
  };

  const handleConfirmBan = async () => {
    if (!banModal.item) return;
    setBanModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await rejectAndBan({
        resultId: banModal.item._id,
        reason: banModal.reason || `Anti-cheat flag: anomalous ${banModal.item.wpm} WPM`,
      }).unwrap();
      toast.success(`Result rejected and @${banModal.item.userId?.username} banned.`);
      setBanModal({ isOpen: false, item: null, reason: '', isLoading: false });
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to reject and ban');
      setBanModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'Racer',
      render: (_, r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent-soft text-accent border border-accent/20 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {r.userId?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-semibold text-fg flex items-center gap-1">
              <span>@{r.userId?.username || 'Guest'}</span>
              {r.userId?.isBanned && (
                <span className="text-[10px] text-danger font-bold ml-1">(Banned)</span>
              )}
            </div>
            <div className="text-xs text-fg/50">{r.userId?.email || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'wpm',
      label: 'Recorded Speed',
      render: (wpm, r) => {
        const avg = r.userId?.avgWpm || 0;
        const diff = avg > 0 ? Math.round(((wpm - avg) / avg) * 100) : null;

        return (
          <div>
            <div className="font-mono font-bold text-danger text-sm flex items-center gap-1">
              <span>{wpm} WPM</span>
              {diff !== null && diff > 50 && (
                <span className="text-[10px] font-semibold text-danger flex items-center">
                  <ArrowUpRight className="w-3 h-3" />+{diff}%
                </span>
              )}
            </div>
            <div className="text-[11px] text-fg/50 mt-0.5">
              Racer average: <span className="font-mono text-fg/80">{avg} WPM</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'accuracy',
      label: 'Accuracy',
      render: (acc, r) => (
        <div className="text-xs">
          <div className="font-medium text-fg">{acc}%</div>
          <div className="text-fg/50 text-[11px]">{r.errors || 0} errors</div>
        </div>
      ),
    },
    {
      key: 'flaggedReason',
      label: 'Detection Reason',
      render: (reason) => (
        <span className="text-xs text-fg/80 font-mono bg-surface px-2 py-1 rounded border border-border">
          {reason || 'WPM exceeds maximum platform threshold'}
        </span>
      ),
    },
    {
      key: 'reviewStatus',
      label: 'Status',
      render: (status) => <StatusBadge status={status || 'pending'} />,
    },
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (date) => (
        <span className="text-xs text-fg/60" title={formatDate(date)}>
          {formatRelativeTime(date)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Review Decision',
      className: 'text-right',
      render: (_, r) => {
        const isPending = !r.reviewStatus || r.reviewStatus === 'pending';
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {isPending ? (
              <>
                <button
                  onClick={() => handleApprove(r)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-soft text-accent border border-accent/30 hover:bg-accent-soft/80 cursor-pointer transition-colors flex items-center gap-1"
                  title="Approve run (legitimate)"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>

                <button
                  onClick={() => handleReject(r)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-fg/70 hover:text-fg hover:bg-surface-hover cursor-pointer transition-colors flex items-center gap-1"
                  title="Reject run (exclude)"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  onClick={() =>
                    setBanModal({
                      isOpen: true,
                      item: r,
                      reason: `Anti-cheat flag: anomalous ${r.wpm} WPM run`,
                      isLoading: false,
                    })
                  }
                  className="p-1.5 rounded-lg text-danger hover:bg-danger-soft cursor-pointer transition-colors"
                  title="Reject and ban racer"
                >
                  <Ban className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span className="text-xs text-fg/40 italic">
                Reviewed by @{r.reviewedBy?.username || 'Admin'}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg tracking-tight">Anti-Cheat Review Queue</h2>
          <p className="text-xs text-fg/60 mt-0.5">
            Evaluate flagged runs detected by heuristic and WPM thresholds
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar onReset={resetFilters}>
        <div className="flex items-center gap-1.5">
          {['pending', 'approved', 'rejected', 'all'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter('status', st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-all ${
                filters.status === st
                  ? 'bg-accent text-bg shadow-sm'
                  : 'bg-surface border border-border text-fg/70 hover:text-fg hover:bg-surface-hover'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </FilterBar>

      {/* Queue Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={results}
          isLoading={isLoading}
          emptyTitle="Queue is Clean"
          emptyDescription="No flagged runs awaiting review in this category."
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

      {/* Reject & Ban Modal */}
      {banModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setBanModal({ isOpen: false, item: null, reason: '', isLoading: false })}
          />
          <div className="relative z-10 w-full max-w-md p-6 rounded-2xl bg-surface border border-border shadow-card text-fg">
            <h3 className="text-lg font-bold text-danger flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5" />
              <span>Reject Run & Ban Racer</span>
            </h3>
            <p className="text-xs text-fg/60 mb-4">
              This will mark the run rejected and immediately ban racer{' '}
              <span className="font-bold text-fg">@{banModal.item?.userId?.username}</span> from the game.
            </p>

            <label className="block text-xs font-semibold text-fg/80 mb-1.5">
              Reason for ban:
            </label>
            <textarea
              rows={3}
              value={banModal.reason}
              onChange={(e) => setBanModal((prev) => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-fg text-sm focus:outline-none focus:border-accent"
            />

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setBanModal({ isOpen: false, item: null, reason: '', isLoading: false })}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-surface text-fg hover:bg-surface-hover cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                disabled={banModal.isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-danger text-white hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                {banModal.isLoading ? 'Processing...' : 'Confirm Reject & Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
