import React, { useState } from 'react';
import { Shield, Eye } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import FilterBar from '../../components/FilterBar';
import Drawer from '../../components/Drawer';
import { useTableState } from '../../hooks/useTableState';
import { useGetAuditLogsQuery } from './adminAuditApi';
import { formatDate, formatRelativeTime } from '../../lib/formatters';

export default function AuditLogPage() {
  const {
    page,
    setPage,
    limit,
    setLimit,
    filters,
    setFilter,
    resetFilters,
  } = useTableState({
    action: 'all',
    targetType: 'all',
    startDate: '',
    endDate: '',
  });

  const { data, isLoading } = useGetAuditLogsQuery({
    page,
    limit,
    action: filters.action,
    targetType: filters.targetType,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  const [inspectEntry, setInspectEntry] = useState(null);

  const logs = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const columns = [
    {
      key: 'createdAt',
      label: 'Timestamp',
      render: (date) => (
        <div>
          <div className="font-semibold text-fg text-xs">{formatDate(date)}</div>
          <div className="text-[11px] text-fg/50">{formatRelativeTime(date)}</div>
        </div>
      ),
    },
    {
      key: 'adminUsername',
      label: 'Administrator',
      render: (name) => (
        <div className="flex items-center gap-1.5 font-semibold text-xs text-fg">
          <Shield className="w-3.5 h-3.5 text-accent" />
          <span>@{name}</span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (act) => (
        <span className="font-mono text-xs font-bold text-accent bg-accent-soft px-2 py-0.5 rounded border border-accent/20">
          {act}
        </span>
      ),
    },
    {
      key: 'targetType',
      label: 'Target',
      render: (type, item) => (
        <div className="text-xs">
          <span className="capitalize font-semibold text-fg">{type}</span>
          {item.targetId && (
            <span className="text-[11px] text-fg/50 block font-mono truncate max-w-[120px]">
              ID: {item.targetId}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'details',
      label: 'Details Summary',
      render: (details) => {
        const str = JSON.stringify(details || {});
        return (
          <span
            className="text-xs font-mono text-fg/70 block truncate max-w-[240px]"
            title={str}
          >
            {str}
          </span>
        );
      },
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      render: (ip) => (
        <span className="text-xs font-mono text-fg/50">{ip || 'Internal'}</span>
      ),
    },
    {
      key: 'inspect',
      label: '',
      className: 'text-right',
      render: (_, item) => (
        <button
          onClick={() => setInspectEntry(item)}
          className="p-1.5 rounded-lg text-fg/60 hover:text-fg hover:bg-surface-hover cursor-pointer"
          title="Inspect payload"
          aria-label="Inspect entry"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg tracking-tight">Audit Trail Log</h2>
          <p className="text-xs text-fg/60 mt-0.5">
            Immutable, read-only security record of all administrative operations
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar onReset={resetFilters}>
        {/* Action Type Filter */}
        <select
          value={filters.action}
          onChange={(e) => setFilter('action', e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Action Types</option>
          <option value="user:role_change">user:role_change</option>
          <option value="user:ban">user:ban</option>
          <option value="user:unban">user:unban</option>
          <option value="user:reset_stats">user:reset_stats</option>
          <option value="user:force_logout">user:force_logout</option>
          <option value="user:delete">user:delete</option>
          <option value="settings:update">settings:update</option>
          <option value="settings:reset">settings:reset</option>
          <option value="text:create">text:create</option>
          <option value="text:update">text:update</option>
          <option value="text:delete">text:delete</option>
          <option value="text:import">text:import</option>
          <option value="room:close">room:close</option>
          <option value="user:disconnect">user:disconnect</option>
          <option value="flagged:approve">flagged:approve</option>
          <option value="flagged:reject">flagged:reject</option>
          <option value="flagged:reject_and_ban">flagged:reject_and_ban</option>
          <option value="leaderboard:remove">leaderboard:remove</option>
          <option value="leaderboard:recalculate">leaderboard:recalculate</option>
          <option value="announcement:create">announcement:create</option>
          <option value="announcement:delete">announcement:delete</option>
        </select>

        {/* Target Type Filter */}
        <select
          value={filters.targetType}
          onChange={(e) => setFilter('targetType', e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Target Entities</option>
          <option value="user">User</option>
          <option value="settings">Settings</option>
          <option value="text">Text</option>
          <option value="race">Race</option>
          <option value="result">Result</option>
          <option value="room">Room</option>
          <option value="leaderboard">Leaderboard</option>
          <option value="announcement">Announcement</option>
        </select>
      </FilterBar>

      {/* Main Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          emptyTitle="No Audit Logs Recorded"
          emptyDescription="Administrative mutations will automatically generate immutable audit entries."
          onRowClick={(row) => setInspectEntry(row)}
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

      {/* Payload Inspection Drawer */}
      <Drawer
        isOpen={Boolean(inspectEntry)}
        onClose={() => setInspectEntry(null)}
        title="Audit Record Payload"
        subtitle={`Action: ${inspectEntry?.action || ''}`}
        width="max-w-md"
      >
        {inspectEntry && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <div className="flex justify-between">
                <span className="text-fg/60">Administrator:</span>
                <span className="font-semibold text-fg">@{inspectEntry.adminUsername}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg/60">Timestamp:</span>
                <span className="font-semibold text-fg">{formatDate(inspectEntry.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg/60">Target Entity:</span>
                <span className="font-mono font-bold text-accent capitalize">{inspectEntry.targetType}</span>
              </div>
              {inspectEntry.targetId && (
                <div className="flex justify-between">
                  <span className="text-fg/60">Target ID:</span>
                  <span className="font-mono text-fg/80">{inspectEntry.targetId}</span>
                </div>
              )}
              {inspectEntry.ipAddress && (
                <div className="flex justify-between">
                  <span className="text-fg/60">Client IP:</span>
                  <span className="font-mono text-fg/80">{inspectEntry.ipAddress}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-fg/80 uppercase tracking-wider mb-2">
                Structured Mutation Payload
              </label>
              <pre className="p-4 rounded-xl bg-bg border border-border text-fg/90 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-card">
                {JSON.stringify(inspectEntry.details || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
