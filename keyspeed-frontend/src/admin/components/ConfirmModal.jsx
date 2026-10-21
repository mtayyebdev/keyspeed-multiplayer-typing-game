import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  requireInput = null, // e.g. "DELETE" or specific username
  inputPlaceholder = 'Type confirmation text here...',
  isLoading = false,
}) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled =
    isLoading || (requireInput && inputValue.trim() !== requireInput.trim());

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isLoading ? onClose : undefined}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative z-10 w-full max-w-md p-6 rounded-2xl bg-surface border border-border shadow-card text-fg"
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={!isLoading ? onClose : undefined}
            className="absolute top-4 right-4 p-1 rounded-lg text-fg/40 hover:text-fg hover:bg-surface-hover cursor-pointer transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isDestructive
                  ? 'bg-danger-soft text-danger border border-danger/20'
                  : 'bg-accent-soft text-accent border border-accent/20'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-fg leading-tight">{title}</h3>
              <p className="text-sm text-fg/60 mt-1">{description}</p>
            </div>
          </div>

          {requireInput && (
            <div className="my-4">
              <label className="block text-xs font-semibold text-fg/80 mb-1.5">
                Type <span className="font-mono text-danger font-bold">{requireInput}</span> to confirm:
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-fg placeholder-fg/40 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all font-mono"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-surface text-fg hover:bg-surface-hover hover:border-strong cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirmDisabled}
              className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:pointer-events-none ${
                isDestructive
                  ? 'bg-danger text-white hover:opacity-90'
                  : 'bg-accent text-bg hover:opacity-90'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

