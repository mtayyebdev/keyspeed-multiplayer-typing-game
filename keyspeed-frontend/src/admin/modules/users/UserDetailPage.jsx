import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Shield,
  Ban,
  CheckCircle,
  RotateCcw,
  LogOut,
  Trash2,
  Trophy,
  History,
  ShieldAlert,
  Flame,
  Calendar,
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import StatCard from '../../components/StatCard';
import ConfirmModal from '../../components/ConfirmModal';
import { TableSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/ToastContext';
import {
  useGetUserDetailQuery,
  useChangeUserRoleMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useResetUserStatsMutation,
  useForceLogoutUserMutation,
  useDeleteUserMutation,
} from './adminUsersApi';
import { formatDate, formatRelativeTime, formatNumber } from '../../lib/formatters';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const currentAdmin = useSelector((state) => state.auth?.user);

  const { data, isLoading } = useGetUserDetailQuery(id);

  const [changeRole] = useChangeUserRoleMutation();
  const [banUser] = useBanUserMutation();
  const [unbanUser] = useUnbanUserMutation();
  const [resetStats] = useResetUserStatsMutation();
  const [forceLogout] = useForceLogoutUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [modalState, setModalState] = useState({
    type: null,
    reason: '',
    isLoading: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-fg/10 rounded animate-pulse" />
        <div className="h-44 bg-surface rounded-2xl border border-border animate-pulse" />
        <TableSkeleton rows={5} cols={5} />
      </div>
    );
  }

  const user = data?.user;
  const last20Results = data?.last20Results || [];
  const flaggedHistory = data?.flaggedHistory || [];
  const banHistory = data?.banHistory || [];

  if (!user) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-fg">User not found</h3>
        <Link to="/admin/users" className="text-sm text-accent underline mt-2 inline-block">
          Return to users list
        </Link>
      </div>
    );
  }

  const isSelf = currentAdmin?.id === user.id || currentAdmin?._id === user.id;
  const winRate =
    user.racesPlayed > 0 ? Math.round((user.racesWon / user.racesPlayed) * 100) : 0;

  const handleRoleToggle = async () => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await changeRole({ id: user.id, role: nextRole }).unwrap();
      toast.success(`Role updated to ${nextRole}.`);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to update role');
    }
  };

  const handleUnban = async () => {
    try {
      await unbanUser(user.id).unwrap();
      toast.success(`User @${user.username} unbanned successfully.`);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to unban user');
    }
  };

  const handleForceLogout = async () => {
    try {
      await forceLogout(user.id).unwrap();
      toast.success(`Session tokens invalidated for @${user.username}.`);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to invalidate tokens');
    }
  };

  const handleExecuteModalAction = async () => {
    setModalState((prev) => ({ ...prev, isLoading: true }));
    try {
      if (modalState.type === 'ban') {
        await banUser({ id: user.id, reason: modalState.reason || 'Banned by admin' }).unwrap();
        toast.success(`User @${user.username} has been banned.`);
      } else if (modalState.type === 'resetStats') {
        await resetStats(user.id).unwrap();
        toast.success(`Stats reset for @${user.username}.`);
      } else if (modalState.type === 'delete') {
        await deleteUser(user.id).unwrap();
        toast.success(`User @${user.username} deleted.`);
        navigate('/admin/users');
        return;
      }
      setModalState({ type: null, reason: '', isLoading: false });
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Action failed');
      setModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg/60 hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users List</span>
        </Link>
      </div>

      {/* Profile Header & Action Panel */}
      <div className="p-6 rounded-2xl bg-surface border border-border shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent text-bg flex items-center justify-center font-bold text-2xl shadow-sm flex-shrink-0">
            {user.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-fg">@{user.username}</h2>
              <StatusBadge status={user.role} />
              <StatusBadge status={user.status} />
            </div>
            <div className="text-xs text-fg/60 mt-1">{user.email}</div>
            <div className="flex items-center gap-4 text-xs text-fg/50 mt-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined: {formatDate(user.createdAt)}
              </span>
              <span>Last login: {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}</span>
            </div>
            {user.isBanned && (
              <div className="mt-2 text-xs font-semibold text-danger bg-danger-soft px-2.5 py-1 rounded-lg border border-danger/20 inline-block">
                Reason: {user.bannedReason || 'Banned by admin'} (at {formatDate(user.bannedAt)})
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex flex-wrap items-center gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
          <button
            onClick={handleRoleToggle}
            disabled={isSelf}
            className="btn-secondary text-xs px-3 py-2 cursor-pointer disabled:opacity-40"
            title={isSelf ? 'Cannot demote self' : 'Toggle role'}
          >
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span>{user.role === 'admin' ? 'Demote to User' : 'Make Admin'}</span>
          </button>

          {user.isBanned ? (
            <button
              onClick={handleUnban}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-accent-soft text-accent border border-accent/30 hover:bg-accent-soft/80 cursor-pointer transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
              Unban Racer
            </button>
          ) : (
            <button
              onClick={() => setModalState({ type: 'ban', reason: '', isLoading: false })}
              disabled={isSelf}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-danger hover:bg-danger-soft cursor-pointer transition-colors disabled:opacity-40"
            >
              <Ban className="w-3.5 h-3.5 inline mr-1" />
              Ban Racer
            </button>
          )}

          <button
            onClick={() => setModalState({ type: 'resetStats', reason: '', isLoading: false })}
            className="btn-secondary text-xs px-3 py-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Stats</span>
          </button>

          <button
            onClick={handleForceLogout}
            className="btn-secondary text-xs px-3 py-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Force Logout</span>
          </button>

          <button
            onClick={() => setModalState({ type: 'delete', reason: '', isLoading: false })}
            disabled={isSelf}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-danger text-white hover:opacity-90 cursor-pointer disabled:opacity-40 transition-opacity"
          >
            <Trash2 className="w-3.5 h-3.5 inline mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Best WPM"
          value={`${user.bestWpm || 0} WPM`}
          subtitle="Top speed recorded"
          icon={Flame}
        />
        <StatCard
          title="Average WPM"
          value={`${user.avgWpm || 0} WPM`}
          subtitle="Overall average"
          icon={Trophy}
        />
        <StatCard
          title="Races Played"
          value={formatNumber(user.racesPlayed)}
          subtitle={`${user.racesWon || 0} victories`}
          icon={History}
        />
        <StatCard
          title="Win Rate"
          value={`${winRate}%`}
          subtitle="First place ratio"
          icon={CheckCircle}
        />
      </div>

      {/* Tables Section */}
      <div className="space-y-6">
        {/* 1. Last 20 Race Results */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/80 flex items-center justify-between">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              <span>Recent Race Results (Last 20)</span>
            </h3>
            <span className="text-xs text-fg/50">{last20Results.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface/50 border-b border-border text-fg/60 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Position</th>
                  <th className="py-2.5 px-4 font-semibold">WPM</th>
                  <th className="py-2.5 px-4 font-semibold">Accuracy</th>
                  <th className="py-2.5 px-4 font-semibold">Errors</th>
                  <th className="py-2.5 px-4 font-semibold">Mode</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {last20Results.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-fg/40">
                      No race results recorded
                    </td>
                  </tr>
                ) : (
                  last20Results.map((res) => (
                    <tr key={res._id} className="hover:bg-surface-hover transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold">
                        {res.position === 1 ? '🥇 1st' : `${res.position}th`}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-accent">
                        {res.wpm} WPM
                      </td>
                      <td className="py-2.5 px-4">{res.accuracy}%</td>
                      <td className="py-2.5 px-4">{res.errors || 0}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={res.raceId?.mode || 'solo'} />
                      </td>
                      <td className="py-2.5 px-4">
                        {res.flagged ? (
                          <StatusBadge status="rejected" label="Flagged" />
                        ) : (
                          <StatusBadge status="approved" label="Valid" />
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-fg/60">{formatRelativeTime(res.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Flagged History */}
        {flaggedHistory.length > 0 && (
          <div className="card overflow-hidden border-danger/30">
            <div className="p-4 border-b border-border bg-danger-soft/20 flex items-center justify-between">
              <h3 className="text-sm font-bold text-danger flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>Anti-Cheat Flagged History ({flaggedHistory.length})</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface/50 border-b border-border text-fg/60 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Speed</th>
                    <th className="py-2.5 px-4">Accuracy</th>
                    <th className="py-2.5 px-4">Flag Reason</th>
                    <th className="py-2.5 px-4">Review Status</th>
                    <th className="py-2.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {flaggedHistory.map((f) => (
                    <tr key={f._id} className="hover:bg-surface-hover">
                      <td className="py-2.5 px-4 font-mono font-bold text-danger">{f.wpm} WPM</td>
                      <td className="py-2.5 px-4">{f.accuracy}%</td>
                      <td className="py-2.5 px-4 text-fg/80">{f.flaggedReason || 'High WPM anomaly'}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={f.reviewStatus || 'pending'} />
                      </td>
                      <td className="py-2.5 px-4 text-fg/60">{formatDate(f.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Administrative Audit Log for this User */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/80">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <History className="w-4 h-4 text-accent" />
              <span>Admin Action History</span>
            </h3>
          </div>
          <div className="divide-y divide-border/40 text-xs">
            {banHistory.length === 0 ? (
              <div className="p-4 text-center text-fg/40">No administrative actions recorded</div>
            ) : (
              banHistory.map((act) => (
                <div key={act._id} className="p-3.5 flex items-center justify-between hover:bg-surface-hover">
                  <div>
                    <span className="font-semibold text-fg">@{act.adminUsername}</span>
                    <span className="mx-2 text-fg/40">performed</span>
                    <span className="font-mono text-accent font-semibold">{act.action}</span>
                    {act.details?.reason && (
                      <span className="ml-2 text-fg/60 italic">"{act.details.reason}"</span>
                    )}
                  </div>
                  <span className="text-fg/50">{formatDate(act.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={modalState.type === 'delete'}
        onClose={() => setModalState({ type: null, reason: '', isLoading: false })}
        onConfirm={handleExecuteModalAction}
        title={`Delete Racer @${user.username}`}
        description="Permanently deletes account and historical race records."
        confirmText="Delete Account"
        isDestructive={true}
        requireInput={user.username}
        isLoading={modalState.isLoading}
      />

      <ConfirmModal
        isOpen={modalState.type === 'resetStats'}
        onClose={() => setModalState({ type: null, reason: '', isLoading: false })}
        onConfirm={handleExecuteModalAction}
        title={`Reset Statistics for @${user.username}`}
        description="This will reset best WPM, average WPM, races played, and victories to 0."
        confirmText="Reset Stats"
        isDestructive={true}
        isLoading={modalState.isLoading}
      />

      {modalState.type === 'ban' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setModalState({ type: null, reason: '', isLoading: false })}
          />
          <div className="relative z-10 w-full max-w-md p-6 rounded-2xl bg-surface border border-border shadow-card text-fg">
            <h3 className="text-lg font-bold text-fg mb-1">Ban Racer @{user.username}</h3>
            <p className="text-xs text-fg/60 mb-4">Provide a reason for the ban.</p>
            <textarea
              rows={3}
              value={modalState.reason}
              onChange={(e) => setModalState((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Exploiting macros / botting"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-fg text-sm focus:outline-none focus:border-accent"
            />
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setModalState({ type: null, reason: '', isLoading: false })}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-surface text-fg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteModalAction}
                disabled={modalState.isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-danger text-white hover:opacity-90"
              >
                {modalState.isLoading ? 'Banning...' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
