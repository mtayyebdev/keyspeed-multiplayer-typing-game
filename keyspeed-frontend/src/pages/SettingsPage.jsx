import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setTheme, THEMES } from '../features/theme/themeSlice';
import { soundEngine } from '../lib/soundEngine';
import { useChangePasswordMutation, useDeleteAccountMutation } from '../features/auth/authApi';
import {
  Settings as SettingsIcon,
  Palette,
  Volume2,
  VolumeX,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  LogIn,
} from 'lucide-react';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentTheme = useSelector((state) => state.theme?.current || 'midnight');
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Sound Engine state
  const initialSoundSettings = soundEngine.getSettings();
  const [soundEnabled, setSoundEnabled] = useState(initialSoundSettings.enabled);
  const [soundVolume, setSoundVolume] = useState(initialSoundSettings.volume);
  const [soundType, setSoundType] = useState(initialSoundSettings.soundType);

  const updateSound = (newSettings) => {
    soundEngine.setSettings(newSettings);
    if (typeof newSettings.enabled === 'boolean') setSoundEnabled(newSettings.enabled);
    if (typeof newSettings.volume === 'number') setSoundVolume(newSettings.volume);
    if (newSettings.soundType) setSoundType(newSettings.soundType);
  };

  const handleTestSound = () => {
    soundEngine.initContext();
    soundEngine.playKey(' ');
  };

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const [changePassword, { isLoading: isUpdatingPass }] = useChangePasswordMutation();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err?.data?.message || 'Failed to update password. Please check your current password.',
      });
    }
  };

  // Danger Zone / Delete Account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteAccount, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    try {
      await deleteAccount().unwrap();
      setShowDeleteModal(false);
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(err?.data?.message || 'Failed to delete account. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start max-w-4xl mx-auto w-full py-8 px-4">
      {/* Page Header */}
      <div className="flex items-center gap-3 w-full mb-8">
        <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center shadow-sm">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-fg tracking-tight">
            Settings & <span className="text-accent">Preferences</span>
          </h1>
          <p className="text-sm text-fg/60">
            Customize your typing audio, color theme, password, and account settings
          </p>
        </div>
      </div>

      <div className="w-full space-y-6">
        {/* 1. THEME SWITCHER SECTION */}
        <section className="bg-surface rounded-2xl p-6 border border-border shadow-card">
          <div className="flex items-center gap-2.5 mb-2">
            <Palette className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-fg">Appearance & Theme</h2>
          </div>
          <p className="text-xs text-fg/60 mb-5">
            Choose from 4 high-contrast, clean 3-color palettes built for readability and velocity.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {THEMES.map((t) => {
              const isActive = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => dispatch(setTheme(t.id))}
                  className={`relative p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between h-28 ${
                    isActive
                      ? 'border-accent ring-2 ring-accent/30 shadow-sm'
                      : 'border-border hover:border-strong hover:bg-surface-hover'
                  }`}
                  style={{ backgroundColor: t.bg }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold" style={{ color: t.text }}>
                      {t.name}
                    </span>
                    {isActive && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: t.accent, color: t.bg }}
                      >
                        <Check className="w-3 h-3 stroke-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border border-black/10 flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: t.accent }}
                    />
                    <div
                      className="h-2 flex-1 rounded-full opacity-60"
                      style={{ backgroundColor: t.text }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. KEYBOARD SOUND FX SECTION */}
        <section className="bg-surface rounded-2xl p-6 border border-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-accent" />
              ) : (
                <VolumeX className="w-5 h-5 text-fg/40" />
              )}
              <div>
                <h2 className="text-lg font-bold text-fg">Keyboard Typing Sounds</h2>
                <p className="text-xs text-fg/60">
                  Ultra-low latency synthesized keystroke audio for realistic mechanical feedback
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => updateSound({ enabled: !soundEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent ${
                soundEnabled ? 'bg-accent' : 'bg-fg/20'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-bg shadow ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <AnimatePresence>
            {soundEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-5 pt-5 border-t border-border space-y-4 overflow-hidden"
              >
              {/* Sound Preset selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-fg/70 mb-2">
                  Sound Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'mechanical', title: 'Cherry MX Mechanical', desc: 'Tactile click & spring body' },
                    { id: 'typewriter', title: 'Vintage Typewriter', desc: 'Heavy metallic bottom strike' },
                    { id: 'soft', title: 'Modern Soft Pop', desc: 'Subtle high-speed bubble tap' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        updateSound({ soundType: s.id });
                        soundEngine.playKey(' ');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                        soundType === s.id
                          ? 'border-accent bg-accent-soft shadow-sm'
                          : 'border-border bg-bg hover:border-strong hover:bg-surface-hover'
                      }`}
                    >
                      <div className="text-xs font-bold text-fg flex items-center justify-between">
                        <span>{s.title}</span>
                        {soundType === s.id && <Check className="w-3.5 h-3.5 text-accent" />}
                      </div>
                      <div className="text-[11px] text-fg/60 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Slider & Test Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3 flex-1 max-w-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-fg/70 shrink-0">
                    Volume:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundVolume}
                    onChange={(e) => updateSound({ volume: parseFloat(e.target.value) })}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-fg/70 w-9 text-right">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTestSound}
                  className="btn-secondary text-xs py-2 px-4 shadow-sm self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Test Keystroke Sound</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

        {/* 3. SECURITY & PASSWORD SECTION */}
        <section className="bg-surface rounded-2xl p-6 border border-border shadow-card">
          <div className="flex items-center gap-2.5 mb-2">
            <Lock className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-fg">Security & Password</h2>
          </div>

          {isAuthenticated && user ? (
            <div>
              <p className="text-xs text-fg/60 mb-5">
                Update your account password. Choose a strong password with at least 6 characters.
              </p>

              {passwordMsg.text && (
                <div
                  className={`mb-5 p-3.5 rounded-xl border text-xs sm:text-sm flex items-center gap-2.5 shadow-sm ${
                    passwordMsg.type === 'success'
                      ? 'bg-accent-soft border-accent/30 text-accent font-semibold'
                      : 'bg-danger-soft border-danger/30 text-danger'
                  }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-fg/70 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-fg/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-bg border border-border text-fg placeholder-fg/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      aria-label={showCurrentPass ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-fg/40 hover:text-fg transition-colors p-1 rounded-md cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-fg/70 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-fg/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-bg border border-border text-fg placeholder-fg/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      aria-label={showNewPass ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-fg/40 hover:text-fg transition-colors p-1 rounded-md cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-fg/70 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-fg/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-bg border border-border text-fg placeholder-fg/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-fg/40 hover:text-fg transition-colors p-1 rounded-md cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="btn-primary text-xs py-2.5 px-5 shadow-sm mt-2 disabled:opacity-50"
                >
                  {isUpdatingPass ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-bg border border-border text-center flex flex-col items-center justify-center py-6">
              <LogIn className="w-8 h-8 text-fg/40 mb-2" />
              <h3 className="text-sm font-semibold text-fg">Sign in to manage password</h3>
              <p className="text-xs text-fg/60 max-w-sm mt-1 mb-4">
                You are currently browsing as a guest. Log in to change your password and manage account security.
              </p>
              <Link to="/login" className="btn-primary text-xs py-2 px-4 shadow-sm">
                Sign In
              </Link>
            </div>
          )}
        </section>

        {/* 4. DANGER ZONE (DELETE ACCOUNT) SECTION */}
        {isAuthenticated && user && (
          <section className="bg-surface rounded-2xl p-6 border border-danger/30 shadow-card bg-danger-soft/10">
            <div className="flex items-center gap-2.5 mb-2 text-danger">
              <ShieldAlert className="w-5 h-5 text-danger" />
              <h2 className="text-lg font-bold">Danger Zone</h2>
            </div>
            <p className="text-xs text-fg/60 mb-4 leading-relaxed">
              Permanently delete your KeySpeed account, race history, WPM records, and profile. This action cannot be reversed.
            </p>

            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationText('');
                setDeleteError('');
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-danger text-white text-xs hover:bg-danger/90 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </section>
        )}
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-surface rounded-2xl p-6 sm:p-7 border border-danger/40 shadow-2xl max-w-md w-full relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-danger-soft border border-danger/30 flex items-center justify-center mb-4 text-danger shadow-sm">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-fg mb-1">Delete Account Permanently?</h3>
              <p className="text-xs text-fg/70 mb-4 leading-relaxed">
                This will delete your user record <span className="font-semibold text-fg">@{user?.username}</span> and all associated race results. To confirm, type <span className="font-mono font-bold text-danger">DELETE</span> below:
              </p>

              {deleteError && (
                <div className="mb-4 p-3 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg border border-border text-fg placeholder-fg/40 focus:outline-none focus:border-danger focus:ring-2 focus:ring-danger/20 transition-all duration-150 text-sm mb-5 font-mono"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAccount || deleteConfirmationText.trim().toUpperCase() !== 'DELETE'}
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold bg-danger text-white text-xs hover:bg-danger/90 active:scale-[0.98] transition-all shadow-sm cursor-pointer disabled:opacity-40"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Permanently Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
