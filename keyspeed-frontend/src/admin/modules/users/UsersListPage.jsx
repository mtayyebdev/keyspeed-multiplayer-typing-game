import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Download,
  Ban,
  CheckCircle,
  Trash2,
  LogOut,
  Shield,
  Eye,
  UserCheck,
  Edit,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import SearchInput from '../../components/SearchInput';
import FilterBar from '../../components/FilterBar';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../components/ToastContext';
import { useTableState } from '../../hooks/useTableState';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useGetUsersQuery,
  useChangeUserRoleMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useResetUserStatsMutation,
  useForceLogoutUserMutation,
  useDeleteUserMutation,
  useBulkUserActionMutation,
  useLazyExportUsersDataQuery,
  useUpdateUserMutation,
} from './adminUsersApi';
import { formatDate, formatRelativeTime } from '../../lib/formatters';
import { exportToCsv } from '../../lib/csvExport';

export default function UsersListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const currentAdmin = useSelector((state) => state.auth?.user);

  const {
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    sortField,
    sortOrder,
    handleSort,
    filters,
    setFilter,
    resetFilters,
  } = useTableState({ role: 'all', status: 'all', startDate: '', endDate: '' });

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useGetUsersQuery({
    page,
    limit,
    search: debouncedSearch,
    role: filters.role,
    status: filters.status,
    startDate: filters.startDate,
    endDate: filters.endDate,
    sortField,
    sortOrder,
  });

  const [triggerExport, { isFetching: isExporting }] = useLazyExportUsersDataQuery();

  // Mutations
  const [changeRole] = useChangeUserRoleMutation();
  const [banUser] = useBanUserMutation();
  const [unbanUser] = useUnbanUserMutation();
  const [resetStats] = useResetUserStatsMutation();
  const [forceLogout] = useForceLogoutUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [bulkAction] = useBulkUserActionMutation();
  const [updateUser] = useUpdateUserMutation();

  // Selected for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal states
  const [modalState, setModalState] = useState({
    type: null, // 'delete' | 'ban' | 'edit' | 'bulkDelete' | 'bulkBan' | 'resetStats'
    user: null,
    reason: '',
    username: '',
    email: '',
    isLoading: false,
  });

  const usersList = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(usersList.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await triggerExport({
        role: filters.role !== 'all' ? filters.role : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
      }).unwrap();
      exportToCsv(`keyspeed_users_${new Date().toISOString().slice(0, 10)}`, res);
      toast.success('Users list exported to CSV successfully.');
    } catch (e) {
      toast.error('Failed to export CSV: ' + (e.data?.message || e.message));
    }
  };

  const executeAction = async () => {
    setModalState((prev) => ({ ...prev, isLoading: true }));
    try {
      if (modalState.type === 'delete') {
        await deleteUser(modalState.user.id).unwrap();
        toast.success(`User @${modalState.user.username} deleted successfully.`);
      } else if (modalState.type === 'ban') {
        await banUser({
          id: modalState.user.id,
          reason: modalState.reason || 'Banned by admin',
        }).unwrap();
        toast.success(`User @${modalState.user.username} has been banned.`);
      } else if (modalState.type === 'resetStats') {
        await resetStats(modalState.user.id).unwrap();
        toast.success(`Stats reset for @${modalState.user.username}.`);
      } else if (modalState.type === 'edit') {
        await updateUser({
          id: modalState.user.id,
          username: modalState.username,
          email: modalState.email,
        }).unwrap();
        toast.success('User updated successfully.');
      } else if (modalState.type === 'bulkDelete') {
        const res = await bulkAction({
          userIds: selectedIds,
          action: 'delete',
        }).unwrap();
        toast.success(res.message);
        setSelectedIds([]);
      } else if (modalState.type === 'bulkBan') {
        const res = await bulkAction({
          userIds: selectedIds,
          action: 'ban',
          reason: modalState.reason || 'Bulk administrative ban',
        }).unwrap();
        toast.success(res.message);
        setSelectedIds([]);
      }
      setModalState({ type: null, user: null, reason: '', username: '', email: '', isLoading: false });
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Action failed');
      setModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleRoleToggle = async (u) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await changeRole({ id: u.id, role: nextRole }).unwrap();
      toast.success(`User @${u.username} role changed to ${nextRole}.`);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to change role');
    }
  };

  const handleUnban = async (u) => {
    try {
      await unbanUser(u.id).unwrap();
      toast.success(`User @${u.username} unbanned successfully.`);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to unban');
    }
  };

  const handleForceLogout = async (u) => {
    try {
      await forceLogout(u.id).unwrap();
      toast.success(`Session tokens invalidated for @${u.username}.`);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to force logout');
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'Racer',
      sortable: true,
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-soft text-accent border border-accent/20 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {u.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-fg flex items-center gap-1.5">
              <span>@{u.username}</span>
              {u.role === 'admin' && (
                <Shield className="w-3.5 h-3.5 text-accent" title="Administrator" />
              )}
            </div>
            <div className="text-xs text-fg/50">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (role) => <StatusBadge status={role} />,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => <StatusBadge status={status} />,
    },
    {
      key: 'bestWpm',
      label: 'Best WPM',
      sortable: true,
      render: (wpm) => <span className="font-mono font-bold text-accent">{wpm} WPM</span>,
    },
    {
      key: 'racesPlayed',
      label: 'Races',
      sortable: true,
      render: (races, u) => (
        <span className="text-xs text-fg/80">
          {races} ({u.racesWon} won)
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: (date) => (
        <span className="text-xs text-fg/60" title={formatDate(date)}>
          {formatRelativeTime(date)}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      label: 'Last Login',
      sortable: true,
      render: (date) => (
        <span className="text-xs text-fg/60">
          {date ? formatRelativeTime(date) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (_, u) => {
        const isSelf = currentAdmin?.id === u.id || currentAdmin?._id === u.id;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {/* View Details */}
            <button
              onClick={() => navigate(`/admin/users/${u.id}`)}
              title="View User Details"
              aria-label="View user profile"
              className="p-1.5 rounded-lg text-fg/60 hover:text-fg hover:bg-surface-hover cursor-pointer transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Edit User */}
            <button
              onClick={() =>
                setModalState({
                  type: 'edit',
                  user: u,
                  username: u.username,
                  email: u.email,
                  reason: '',
                  isLoading: false,
                })
              }
              title="Edit Profile"
              aria-label="Edit user"
              className="p-1.5 rounded-lg text-fg/60 hover:text-fg hover:bg-surface-hover cursor-pointer transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>

            {/* Toggle Role */}
            <button
              onClick={() => handleRoleToggle(u)}
              disabled={isSelf}
              title={
                isSelf
                  ? 'Cannot demote yourself'
                  : u.role === 'admin'
                  ? 'Demote to user'
                  : 'Promote to admin'
              }
              aria-label="Toggle user role"
              className="p-1.5 rounded-lg text-fg/60 hover:text-accent hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <UserCheck className="w-4 h-4" />
            </button>

            {/* Ban / Unban */}
            {u.isBanned ? (
              <button
                onClick={() => handleUnban(u)}
                title="Unban racer"
                aria-label="Unban user"
                className="p-1.5 rounded-lg text-accent hover:bg-accent-soft cursor-pointer transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() =>
                  setModalState({
                    type: 'ban',
                    user: u,
                    reason: '',
                    username: '',
                    email: '',
                    isLoading: false,
                  })
                }
                disabled={isSelf}
                title={isSelf ? 'Cannot ban yourself' : 'Ban racer'}
                aria-label="Ban user"
                className="p-1.5 rounded-lg text-fg/60 hover:text-danger hover:bg-danger-soft disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}

            {/* Force Logout */}
            <button
              onClick={() => handleForceLogout(u)}
              title="Force logout (invalidate active session)"
              aria-label="Force logout user"
              className="p-1.5 rounded-lg text-fg/60 hover:text-fg hover:bg-surface-hover cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Delete User */}
            <button
              onClick={() =>
                setModalState({
                  type: 'delete',
                  user: u,
                  reason: '',
                  username: '',
                  email: '',
                  isLoading: false,
                })
              }
              disabled={isSelf}
              title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
              aria-label="Delete user"
              className="p-1.5 rounded-lg text-fg/60 hover:text-danger hover:bg-danger-soft disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg tracking-tight">Racer Accounts</h2>
          <p className="text-xs text-fg/60 mt-0.5">Manage users, security statuses, roles, and statistics</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="btn-secondary text-xs px-3.5 py-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <FilterBar onReset={resetFilters}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by username or email..."
          className="w-full sm:w-64"
        />

        {/* Role select */}
        <select
          value={filters.role}
          onChange={(e) => setFilter('role', e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        {/* Status select */}
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>
      </FilterBar>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-accent-soft border border-accent/30 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs font-semibold text-accent flex items-center gap-2">
            <span>{selectedIds.length} user(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setModalState({
                  type: 'bulkBan',
                  user: null,
                  reason: '',
                  username: '',
                  email: '',
                  isLoading: false,
                })
              }
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-danger hover:bg-danger-soft transition-colors cursor-pointer"
            >
              Ban Selected
            </button>
            <button
              onClick={() =>
                setModalState({
                  type: 'bulkDelete',
                  user: null,
                  reason: '',
                  username: '',
                  email: '',
                  isLoading: false,
                })
              }
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-danger text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={usersList}
          isLoading={isLoading}
          emptyTitle="No Racers Found"
          emptyDescription="Try adjusting your search criteria or filters."
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
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

      {/* Confirmation Modals */}
      {/* 1. Delete Single User */}
      <ConfirmModal
        isOpen={modalState.type === 'delete'}
        onClose={() => setModalState({ type: null, user: null, reason: '', username: '', email: '', isLoading: false })}
        onConfirm={executeAction}
        title={`Delete Racer @${modalState.user?.username}`}
        description="This action cannot be undone. All races, statistics, and leaderboard records will be permanently erased."
        confirmText="Delete User"
        isDestructive={true}
        requireInput={modalState.user?.username}
        isLoading={modalState.isLoading}
      />

      {/* 2. Ban User Modal */}
      {modalState.type === 'ban' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setModalState({ type: null, user: null, reason: '', username: '', email: '', isLoading: false })}
          />
          <div className="relative z-10 w-full max-w-md p-6 rounded-2xl bg-surface border border-border shadow-card text-fg">
            <h3 className="text-lg font-bold text-fg mb-1">
              Ban Racer @{modalState.user?.username}
            </h3>
            <p className="text-xs text-fg/60 mb-4">
              Banning invalidates active session tokens and restricts access to login and races.
            </p>

            <label className="block text-xs font-semibold text-fg/80 mb-1.5">
              Reason for ban:
            </label>
            <textarea
              rows={3}
              value={modalState.reason}
              onChange={(e) => setModalState((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Anti-cheat flagged anomalous WPM / Macro typing"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-fg text-sm focus:outline-none focus:border-accent"
            />

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setModalState({ type: null, user: null, reason: '', username: '', email: '', isLoading: false })}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-surface text-fg hover:bg-surface-hover cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={modalState.isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-danger text-white hover:opacity-90 cursor-pointer"
              >
                {modalState.isLoading ? 'Banning...' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Edit User Modal */}
      {modalState.type === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setModalState({ type: null, user: null, reason: '', username: '', email: '', isLoading: false })}
          />
          <div className="relative z-10 w-full max-w-md p-6 rounded-2xl bg-surface border border-border shadow-card text-fg">
            <h3 className="text-lg font-bold text-fg mb-1">
              Edit Racer Profile
            </h3>
            <p className="text-xs text-fg/60 mb-4">Update username or email address</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-fg/80 mb-1">Username:</label>
                <input
                  type="text"
                  value={modalState.username}
                  onChange={(e) => setModalState((prev) => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-fg text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg/80 mb-1">Email:</label>
                <input
                  type="email"
                  value={modalState.email}
                  onChange={(e) => setModalState((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border text-fg text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setModalState({ type: null, user: null, reason: '', username: '', email: '', isLoading: false })}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-surface text-fg hover:bg-surface-hover cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={modalState.isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent text-bg hover:opacity-90 cursor-pointer"
              >
                {modalState.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bulk Delete Confirmation */}
      <ConfirmModal
        isOpen={modalState.type === 'bulkDelete'}
        onClose={() => setModalState({ type: null, user: null, reason: '', username: '', email: '', isLoading: false })}
        onConfirm={executeAction}
        title={`Delete ${selectedIds.length} Selected Racers?`}
        description="Permanently deletes the selected user accounts and their complete racing histories."
        confirmText="Bulk Delete"
        isDestructive={true}
        requireInput="DELETE"
        isLoading={modalState.isLoading}
      />
    </div>
  );
}
