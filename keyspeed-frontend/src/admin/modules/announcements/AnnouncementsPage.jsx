import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import DataTable from '../../components/DataTable';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../components/ToastContext';
import { useTableState } from '../../hooks/useTableState';
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} from './adminAnnouncementsApi';
import { formatDate } from '../../lib/formatters';

export default function AnnouncementsPage() {
  const toast = useToast();
  const { page, setPage, limit, setLimit } = useTableState();

  const { data, isLoading } = useGetAnnouncementsQuery({ page, limit });

  const [createAnnouncement] = useCreateAnnouncementMutation();
  const [updateAnnouncement] = useUpdateAnnouncementMutation();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();

  const [editorModal, setEditorModal] = useState({
    isOpen: false,
    id: null,
    message: '',
    type: 'info',
    isActive: true,
    startDate: '',
    endDate: '',
    isLoading: false,
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const announcements = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const handleOpenCreate = () => {
    setEditorModal({
      isOpen: true,
      id: null,
      message: '',
      type: 'info',
      isActive: true,
      startDate: '',
      endDate: '',
      isLoading: false,
    });
  };

  const handleOpenEdit = (item) => {
    setEditorModal({
      isOpen: true,
      id: item._id,
      message: item.message,
      type: item.type || 'info',
      isActive: item.isActive !== false,
      startDate: item.startDate ? new Date(item.startDate).toISOString().slice(0, 16) : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : '',
      isLoading: false,
    });
  };

  const handleSaveEditor = async (e) => {
    e.preventDefault();
    if (!editorModal.message.trim()) {
      toast.error('Announcement message cannot be empty.');
      return;
    }

    setEditorModal((prev) => ({ ...prev, isLoading: true }));
    try {
      if (editorModal.id) {
        await updateAnnouncement({
          id: editorModal.id,
          message: editorModal.message.trim(),
          type: editorModal.type,
          isActive: editorModal.isActive,
          startDate: editorModal.startDate || null,
          endDate: editorModal.endDate || null,
        }).unwrap();
        toast.success('Announcement updated.');
      } else {
        await createAnnouncement({
          message: editorModal.message.trim(),
          type: editorModal.type,
          isActive: editorModal.isActive,
          startDate: editorModal.startDate || null,
          endDate: editorModal.endDate || null,
        }).unwrap();
        toast.success('Announcement published.');
      }
      setEditorModal({ isOpen: false, id: null, message: '', type: 'info', isActive: true, startDate: '', endDate: '', isLoading: false });
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to save announcement');
      setEditorModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const willBeActive = !item.isActive;
      await updateAnnouncement({
        id: item._id,
        isActive: willBeActive,
        // If activating, clear any future start date so it appears immediately
        ...(willBeActive ? { startDate: null } : {}),
      }).unwrap();
      toast.success(`Announcement ${willBeActive ? 'activated' : 'deactivated'}.`);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to update status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAnnouncement(deleteTarget._id).unwrap();
      toast.success('Announcement deleted.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'message',
      label: 'Announcement Message',
      render: (msg, item) => (
        <div className="flex items-start gap-2.5 max-w-lg">
          <div className="mt-0.5 flex-shrink-0">
            {item.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-danger" />
            ) : (
              <Info className="w-4 h-4 text-accent" />
            )}
          </div>
          <div>
            <div className="font-medium text-fg text-xs leading-relaxed">{msg}</div>
            <div className="text-[11px] text-fg/50 mt-1 flex items-center gap-2">
              <span className="capitalize font-semibold">{item.type}</span>
              {item.startDate && (
                <span>Starts: {formatDate(item.startDate)}</span>
              )}
              {item.endDate && <span>Ends: {formatDate(item.endDate)}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (type) => <StatusBadge status={type} />,
    },
    {
      key: 'isActive',
      label: 'Visibility',
      render: (active, item) => (
        <button
          onClick={() => handleToggleActive(item)}
          className="cursor-pointer"
          title={`Click to ${active ? 'hide' : 'show'} banner`}
        >
          <StatusBadge
            status={active ? 'active' : 'pending'}
            label={active ? 'Live Banner' : 'Draft / Off'}
          />
        </button>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (date) => (
        <span className="text-xs text-fg/60">{formatDate(date)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (_, item) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(item)}
            title="Edit message"
            aria-label="Edit announcement"
            className="p-1.5 rounded-lg text-fg/60 hover:text-fg hover:bg-surface-hover cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(item)}
            title="Delete announcement"
            aria-label="Delete announcement"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg tracking-tight">System Announcements</h2>
          <p className="text-xs text-fg/60 mt-0.5">
            Broadcast dismissible banner messages to all racers across the public site
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary text-xs px-4 py-2 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={announcements}
          isLoading={isLoading}
          emptyTitle="No Announcements"
          emptyDescription="Create an announcement to broadcast a message to users."
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

      {/* Create / Edit Modal */}
      {editorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setEditorModal((prev) => ({ ...prev, isOpen: false }))}
          />
          <div className="relative z-10 w-full max-w-lg p-6 rounded-2xl bg-surface border border-border shadow-card text-fg">
            <h3 className="text-lg font-bold text-fg mb-1">
              {editorModal.id ? 'Edit Announcement' : 'Create New Announcement'}
            </h3>
            <p className="text-xs text-fg/60 mb-4">
              Active announcements are displayed at the very top of the public website.
            </p>

            <form onSubmit={handleSaveEditor} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-fg/80 mb-1">Message Banner Text:</label>
                <textarea
                  rows={3}
                  value={editorModal.message}
                  onChange={(e) =>
                    setEditorModal((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="e.g. Scheduled server maintenance tonight from 2:00 AM - 3:00 AM UTC."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-fg text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-fg/80 mb-1">Type:</label>
                  <select
                    value={editorModal.type}
                    onChange={(e) =>
                      setEditorModal((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="info">Info (Accent)</option>
                    <option value="warning">Warning (Danger)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isAnnouncementActive"
                    checked={editorModal.isActive}
                    onChange={(e) =>
                      setEditorModal((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="rounded border-border text-accent focus:ring-accent cursor-pointer"
                  />
                  <label htmlFor="isAnnouncementActive" className="font-semibold text-fg cursor-pointer">
                    Active immediately
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-fg/80 mb-1">Display Start (Optional):</label>
                  <input
                    type="datetime-local"
                    value={editorModal.startDate}
                    onChange={(e) =>
                      setEditorModal((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent"
                  />
                  <p className="text-[11px] text-fg/50 mt-1">Leave blank to show immediately on the site.</p>
                </div>

                <div>
                  <label className="block font-semibold text-fg/80 mb-1">Display End (Optional):</label>
                  <input
                    type="datetime-local"
                    value={editorModal.endDate}
                    onChange={(e) =>
                      setEditorModal((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="w-full px-3 py-1.5 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent"
                  />
                  <p className="text-[11px] text-fg/50 mt-1">Leave blank to keep banner visible indefinitely.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditorModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-surface text-fg hover:bg-surface-hover cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editorModal.isLoading}
                  className="btn-primary text-xs px-5 py-2 cursor-pointer"
                >
                  {editorModal.isLoading ? 'Saving...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Announcement?"
        description="This will permanently delete this banner notification."
        confirmText="Delete Announcement"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
