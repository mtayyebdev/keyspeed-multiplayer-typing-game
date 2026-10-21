import React, { useState } from 'react';
import {
  Plus,
  Upload,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
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
  useGetTextsQuery,
  useCreateTextMutation,
  useUpdateTextMutation,
  useDeleteTextMutation,
  useImportTextsMutation,
} from './adminTextsApi';

export default function TextsListPage() {
  const toast = useToast();
  const {
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
  } = useTableState({
    difficulty: 'all',
    language: 'all',
    status: 'all',
  });

  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useGetTextsQuery({
    page,
    limit,
    search: debouncedSearch,
    difficulty: filters.difficulty,
    language: filters.language,
    status: filters.status,
  });

  const [createText] = useCreateTextMutation();
  const [updateText] = useUpdateTextMutation();
  const [deleteText] = useDeleteTextMutation();
  const [importTexts] = useImportTextsMutation();

  // Create / Edit modal state
  const [editorModal, setEditorModal] = useState({
    isOpen: false,
    textId: null,
    content: '',
    difficulty: 'normal',
    language: 'en',
    isActive: true,
    isLoading: false,
  });

  // Bulk import modal state
  const [importModal, setImportModal] = useState({
    isOpen: false,
    rawText: '',
    parsed: [],
    errors: [],
    hasValidated: false,
    isLoading: false,
  });

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const texts = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  // Live word and char calculation
  const liveCharCount = editorModal.content.length;
  const liveWordCount = editorModal.content.trim()
    ? editorModal.content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const handleOpenCreate = () => {
    setEditorModal({
      isOpen: true,
      textId: null,
      content: '',
      difficulty: 'normal',
      language: 'en',
      isActive: true,
      isLoading: false,
    });
  };

  const handleOpenEdit = (t) => {
    setEditorModal({
      isOpen: true,
      textId: t._id,
      content: t.content,
      difficulty: t.difficulty || 'normal',
      language: t.language || 'en',
      isActive: t.isActive !== false,
      isLoading: false,
    });
  };

  const handleSaveEditor = async (e) => {
    e.preventDefault();
    if (!editorModal.content.trim()) {
      toast.error('Text content cannot be empty.');
      return;
    }

    setEditorModal((prev) => ({ ...prev, isLoading: true }));
    try {
      if (editorModal.textId) {
        await updateText({
          id: editorModal.textId,
          content: editorModal.content,
          difficulty: editorModal.difficulty,
          language: editorModal.language,
          isActive: editorModal.isActive,
        }).unwrap();
        toast.success('Paragraph updated successfully.');
      } else {
        await createText({
          content: editorModal.content,
          difficulty: editorModal.difficulty,
          language: editorModal.language,
          isActive: editorModal.isActive,
        }).unwrap();
        toast.success('New typing paragraph created.');
      }
      setEditorModal({ isOpen: false, textId: null, content: '', difficulty: 'normal', language: 'en', isActive: true, isLoading: false });
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to save text');
      setEditorModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleToggleActive = async (t) => {
    try {
      await updateText({
        id: t._id,
        isActive: !t.isActive,
      }).unwrap();
      toast.success(`Paragraph ${t.isActive ? 'deactivated' : 'activated'}.`);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to update status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteText(deleteTarget._id).unwrap();
      toast.success('Paragraph deleted successfully.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to delete text');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk import validation
  const handleValidateImport = () => {
    const raw = importModal.rawText.trim();
    if (!raw) {
      toast.error('Please paste CSV or JSON data');
      return;
    }

    const parsedItems = [];
    const parseErrors = [];

    // Try parsing as JSON first
    if (raw.startsWith('[') || raw.startsWith('{')) {
      try {
        const json = JSON.parse(raw);
        const array = Array.isArray(json) ? json : [json];
        array.forEach((item, index) => {
          if (!item.content || typeof item.content !== 'string' || item.content.trim().length < 20) {
            parseErrors.push(`Item ${index + 1}: content missing or too short`);
          } else {
            parsedItems.push({
              content: item.content.trim(),
              difficulty: (item.difficulty || 'normal').toLowerCase(),
              language: (item.language || 'en').toLowerCase(),
            });
          }
        });
      } catch (e) {
        parseErrors.push(`Invalid JSON format: ${e.message}`);
      }
    } else {
      // Parse as CSV (format: content,difficulty,language or one paragraph per line)
      const lines = raw.split(/\r?\n/).filter(Boolean);
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.length < 20) {
          parseErrors.push(`Line ${index + 1}: text under 20 characters`);
        } else {
          parsedItems.push({
            content: trimmed,
            difficulty: 'normal',
            language: 'en',
          });
        }
      });
    }

    setImportModal((prev) => ({
      ...prev,
      parsed: parsedItems,
      errors: parseErrors,
      hasValidated: true,
    }));
  };

  const handleExecuteImport = async () => {
    if (!importModal.parsed.length) {
      toast.error('No valid items to import');
      return;
    }

    setImportModal((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await importTexts(importModal.parsed).unwrap();
      toast.success(res.message);
      setImportModal({ isOpen: false, rawText: '', parsed: [], errors: [], hasValidated: false, isLoading: false });
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Import failed');
      setImportModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const columns = [
    {
      key: 'content',
      label: 'Paragraph Snippet',
      render: (content, t) => (
        <div className="max-w-md">
          <p className="font-mono text-xs text-fg leading-relaxed line-clamp-2">
            {content}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-fg/50 mt-1">
            <span>{t.wordCount} words</span>
            <span>·</span>
            <span>{t.charCount} chars</span>
            <span>·</span>
            <span className="capitalize">{t.language || 'en'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (diff) => <StatusBadge status={diff} label={diff?.toUpperCase()} />,
    },
    {
      key: 'usageCount',
      label: 'Used In Races',
      render: (count) => (
        <span className="font-mono text-xs text-fg font-semibold">
          {count} times
        </span>
      ),
    },
    {
      key: 'avgWpm',
      label: 'Avg WPM',
      render: (wpm) => (
        <span className="font-mono font-bold text-accent text-xs">
          {wpm ? `${wpm} WPM` : '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (active, t) => (
        <button
          onClick={() => handleToggleActive(t)}
          className="cursor-pointer"
          title={`Click to ${active ? 'deactivate' : 'activate'}`}
        >
          <StatusBadge
            status={active ? 'active' : 'pending'}
            label={active ? 'Active' : 'Inactive'}
          />
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (_, t) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(t)}
            title="Edit paragraph"
            aria-label="Edit text"
            className="p-1.5 rounded-lg text-fg/60 hover:text-fg hover:bg-surface-hover cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(t)}
            title="Delete paragraph"
            aria-label="Delete text"
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
      {/* Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg tracking-tight">Typing Texts Library</h2>
          <p className="text-xs text-fg/60 mt-0.5">
            Manage practice paragraphs, configure difficulty tiers, and import text batches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setImportModal({
                isOpen: true,
                rawText: '',
                parsed: [],
                errors: [],
                hasValidated: false,
                isLoading: false,
              })
            }
            className="btn-secondary text-xs px-3.5 py-2 cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="btn-primary text-xs px-4 py-2 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Text</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar onReset={resetFilters}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by text content..."
          className="w-full sm:w-64"
        />

        <select
          value={filters.difficulty}
          onChange={(e) => setFilter('difficulty', e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active (Available in Races)</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterBar>

      {/* Table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={texts}
          isLoading={isLoading}
          emptyTitle="No Texts Available"
          emptyDescription="Add or import paragraphs to populate the typing library."
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

      {/* 1. Create / Edit Text Modal with Live Preview */}
      {editorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setEditorModal((prev) => ({ ...prev, isOpen: false }))}
          />
          <div className="relative z-10 w-full max-w-2xl p-6 rounded-2xl bg-surface border border-border shadow-card text-fg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-fg mb-1">
              {editorModal.textId ? 'Edit Typing Paragraph' : 'Add New Typing Paragraph'}
            </h3>
            <p className="text-xs text-fg/60 mb-4">
              Compose or paste original English text. Character and word counts will auto-calculate.
            </p>

            <form onSubmit={handleSaveEditor} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-fg/80">Paragraph Content:</label>
                  <span className="text-[11px] font-mono text-fg/50">
                    {liveWordCount} words · {liveCharCount} chars
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={editorModal.content}
                  onChange={(e) =>
                    setEditorModal((prev) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Enter the typing paragraph here..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-fg font-mono text-sm leading-relaxed focus:outline-none focus:border-accent"
                />
              </div>

              {/* Live Typing Arena Preview */}
              <div>
                <label className="text-xs font-semibold text-fg/80 flex items-center gap-1.5 mb-1.5">
                  <Eye className="w-3.5 h-3.5 text-accent" />
                  <span>Arena In-Game Preview:</span>
                </label>
                <div className="p-4 rounded-xl bg-surface border border-border-strong text-sm font-mono leading-relaxed select-none shadow-card">
                  {editorModal.content ? (
                    <p className="text-fg/80">
                      <span className="text-fg">{editorModal.content.slice(0, 15)}</span>
                      <span className="bg-accent-soft border-b-2 border-accent text-fg">
                        {editorModal.content.slice(15, 16)}
                      </span>
                      <span className="text-fg/45">{editorModal.content.slice(16)}</span>
                    </p>
                  ) : (
                    <span className="text-xs text-fg/40 italic">Type content above to preview arena view...</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-fg/80 mb-1">Difficulty:</label>
                  <select
                    value={editorModal.difficulty}
                    onChange={(e) =>
                      setEditorModal((prev) => ({ ...prev, difficulty: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg/80 mb-1">Language:</label>
                  <select
                    value={editorModal.language}
                    onChange={(e) =>
                      setEditorModal((prev) => ({ ...prev, language: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="en">English (en)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={editorModal.isActive}
                    onChange={(e) =>
                      setEditorModal((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                    className="rounded border-border text-accent focus:ring-accent cursor-pointer"
                  />
                  <label htmlFor="isActiveCheck" className="text-xs font-semibold text-fg cursor-pointer">
                    Active in races
                  </label>
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
                  {editorModal.isLoading ? 'Saving...' : 'Save Paragraph'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Bulk Import Modal */}
      {importModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setImportModal((prev) => ({ ...prev, isOpen: false }))}
          />
          <div className="relative z-10 w-full max-w-2xl p-6 rounded-2xl bg-surface border border-border shadow-card text-fg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-fg mb-1">Bulk Import Typing Paragraphs</h3>
            <p className="text-xs text-fg/60 mb-4">
              Paste paragraphs (one per line) or a JSON array of objects with{' '}
              <span className="font-mono text-accent">content</span> and optional{' '}
              <span className="font-mono text-accent">difficulty</span>.
            </p>

            <div className="space-y-4">
              <textarea
                rows={6}
                value={importModal.rawText}
                onChange={(e) =>
                  setImportModal((prev) => ({
                    ...prev,
                    rawText: e.target.value,
                    hasValidated: false,
                    parsed: [],
                    errors: [],
                  }))
                }
                placeholder={`Example JSON:
[
  { "content": "The quick brown fox jumps over the lazy dog.", "difficulty": "easy" }
]

Or plain text lines (each line is imported as a separate text):
Paragraph one text...
Paragraph two text...`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-fg font-mono text-xs focus:outline-none focus:border-accent"
              />

              {/* Validation Feedback */}
              {importModal.hasValidated && (
                <div className="p-3.5 rounded-xl bg-bg border border-border space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>{importModal.parsed.length} valid paragraphs ready for import</span>
                  </div>

                  {importModal.errors.length > 0 && (
                    <div className="text-danger space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertCircle className="w-4 h-4" />
                        <span>{importModal.errors.length} formatting errors detected:</span>
                      </div>
                      <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                        {importModal.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleValidateImport}
                  className="btn-secondary text-xs px-3.5 py-2 cursor-pointer"
                >
                  Validate & Preview
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportModal((prev) => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-border bg-surface text-fg hover:bg-surface-hover cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={!importModal.parsed.length || importModal.isLoading}
                    className="btn-primary text-xs px-5 py-2 cursor-pointer disabled:opacity-40"
                  >
                    {importModal.isLoading ? 'Importing...' : `Import ${importModal.parsed.length} Texts`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Typing Paragraph?"
        description="This paragraph will be permanently removed from the active library."
        confirmText="Delete Paragraph"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
