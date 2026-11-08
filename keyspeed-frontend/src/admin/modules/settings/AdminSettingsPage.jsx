import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldAlert,
  Bot,
  UserPlus,
  Power,
  RotateCcw,
  Save,
  Gauge,
} from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../components/ToastContext';
import {
  useGetAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
  useResetAdminSettingsMutation,
} from './adminSettingsApi';

export default function AdminSettingsPage() {
  const toast = useToast();
  const { data: remoteSettings, isLoading } = useGetAdminSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateAdminSettingsMutation();
  const [resetSettings, { isLoading: isResetting }] = useResetAdminSettingsMutation();

  const [form, setForm] = useState({
    botWaitTime: 8,
    maxPlayersPerRace: 4,
    countdownSeconds: 3,
    raceTimeoutSeconds: 120,
    maxAllowedWpm: 250,
    maxProgressJumpPerTick: 15,
    botsEnabled: true,
    registrationEnabled: true,
    maintenanceMode: false,
    carRace: {
      stallPenaltyMs: 400,
      idleTimeoutMs: 1000,
    },
  });

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    if (remoteSettings) {
      setForm({
        botWaitTime: remoteSettings.botWaitTime ?? 8,
        maxPlayersPerRace: remoteSettings.maxPlayersPerRace ?? 4,
        countdownSeconds: remoteSettings.countdownSeconds ?? 3,
        raceTimeoutSeconds: remoteSettings.raceTimeoutSeconds ?? 120,
        maxAllowedWpm: remoteSettings.maxAllowedWpm ?? 250,
        maxProgressJumpPerTick: remoteSettings.maxProgressJumpPerTick ?? 15,
        botsEnabled: remoteSettings.botsEnabled ?? true,
        registrationEnabled: remoteSettings.registrationEnabled ?? true,
        maintenanceMode: remoteSettings.maintenanceMode ?? false,
        carRace: {
          stallPenaltyMs: remoteSettings.carRace?.stallPenaltyMs ?? 400,
          idleTimeoutMs: remoteSettings.carRace?.idleTimeoutMs ?? 1000,
        },
      });
    }
  }, [remoteSettings]);

  const handleChange = (field, value) => {
    if (field.startsWith('carRace.')) {
      const key = field.split('.')[1];
      setForm((prev) => ({
        ...prev,
        carRace: {
          ...prev.carRace,
          [key]: value,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(form).unwrap();
      toast.success('Game server settings updated successfully.');
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to update settings');
    }
  };

  const handleResetConfirm = async () => {
    try {
      const res = await resetSettings().unwrap();
      setForm(res);
      toast.success('Settings restored to factory defaults.');
      setIsResetModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || err.message || 'Failed to reset settings');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-fg/10 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-surface rounded-2xl border border-border animate-pulse" />
          <div className="h-64 bg-surface rounded-2xl border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header & Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg tracking-tight">Game Server Settings</h2>
          <p className="text-xs text-fg/60 mt-0.5">
            Configure live match rules, heuristic anti-cheat parameters, and operational modes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="btn-secondary text-xs px-3.5 py-2 cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary text-xs px-5 py-2 cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Matchmaking & Race Rules */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Sliders className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-fg">Race Rules & Timing</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-fg/80 mb-1">
                <span>Queue Wait Time Before Bots:</span>
                <span className="font-mono text-accent">{form.botWaitTime}s</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={form.botWaitTime}
                onChange={(e) => handleChange('botWaitTime', Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[11px] text-fg/50 mt-1">Seconds to wait for human racers before filling slots with bots.</p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-fg/80 mb-1">
                <span>Max Players Per Race:</span>
                <span className="font-mono text-accent">{form.maxPlayersPerRace} racers</span>
              </div>
              <input
                type="range"
                min={2}
                max={8}
                value={form.maxPlayersPerRace}
                onChange={(e) => handleChange('maxPlayersPerRace', Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[11px] text-fg/50 mt-1">Total participant capacity in public and private rooms.</p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-fg/80 mb-1">
                <span>Countdown Duration:</span>
                <span className="font-mono text-accent">{form.countdownSeconds}s</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={form.countdownSeconds}
                onChange={(e) => handleChange('countdownSeconds', Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[11px] text-fg/50 mt-1">Synchronized pre-race countdown timer (3, 2, 1, GO).</p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-fg/80 mb-1">
                <span>Race Timeout:</span>
                <span className="font-mono text-accent">{form.raceTimeoutSeconds}s</span>
              </div>
              <input
                type="range"
                min={30}
                max={300}
                step={10}
                value={form.raceTimeoutSeconds}
                onChange={(e) => handleChange('raceTimeoutSeconds', Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[11px] text-fg/50 mt-1">Maximum time allowed before incomplete races automatically finish.</p>
            </div>
          </div>
        </div>

        {/* Card 2: Anti-Cheat Heuristics */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <ShieldAlert className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-fg">Anti-Cheat Heuristics</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-fg/80 mb-1">
                <span>Max Allowed Speed (Hard Limit):</span>
                <span className="font-mono text-danger font-bold">{form.maxAllowedWpm} WPM</span>
              </div>
              <input
                type="range"
                min={150}
                max={350}
                step={10}
                value={form.maxAllowedWpm}
                onChange={(e) => handleChange('maxAllowedWpm', Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[11px] text-fg/50 mt-1">Runs exceeding this sustained speed are automatically flagged for review.</p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-fg/80 mb-1">
                <span>Max Progress Jump Per Tick:</span>
                <span className="font-mono text-accent">{form.maxProgressJumpPerTick} chars</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                value={form.maxProgressJumpPerTick}
                onChange={(e) => handleChange('maxProgressJumpPerTick', Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[11px] text-fg/50 mt-1">Detects paste anomalies or macro bursts between consecutive keystroke socket events.</p>
            </div>
          </div>
        </div>

        {/* Card 3: Car Race Specific Settings */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Gauge className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-fg">Car Race GP Simulation Rules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-fg/80 mb-1">
                <span>Stall Penalty Duration:</span>
                <span className="font-mono text-danger font-bold">
                  {form.carRace?.stallPenaltyMs ?? 400} ms
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={1500}
                step={50}
                value={form.carRace?.stallPenaltyMs ?? 400}
                onChange={(e) => handleChange('carRace.stallPenaltyMs', Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[11px] text-fg/50 mt-1">
                Extra delay after correcting a typo with Backspace before the racing car can accelerate again.
              </p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-fg/80 mb-1">
                <span>Idle Deceleration Timeout:</span>
                <span className="font-mono text-accent font-bold">
                  {form.carRace?.idleTimeoutMs ?? 1000} ms
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={3000}
                step={100}
                value={form.carRace?.idleTimeoutMs ?? 1000}
                onChange={(e) => handleChange('carRace.idleTimeoutMs', Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
              <p className="text-[11px] text-fg/50 mt-1">
                Inactivity threshold before the car decelerates quickly to a stop (engine state: idle).
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Platform & Operation Flags */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-card space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Power className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-fg">Platform & Security Controls</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Bots Toggle */}
            <div className="p-4 rounded-xl border border-border bg-surface-hover/30 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-fg">
                  <Bot className="w-4 h-4 text-accent" />
                  <span>AI Bots Enabled</span>
                </div>
                <p className="text-[11px] text-fg/50 mt-1">Spawn simulated racers when waiting in queue.</p>
              </div>
              <input
                type="checkbox"
                checked={form.botsEnabled}
                onChange={(e) => handleChange('botsEnabled', e.target.checked)}
                className="w-5 h-5 rounded border-border text-accent focus:ring-accent cursor-pointer mt-0.5"
              />
            </div>

            {/* Registration Toggle */}
            <div className="p-4 rounded-xl border border-border bg-surface-hover/30 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-fg">
                  <UserPlus className="w-4 h-4 text-accent" />
                  <span>New Signups</span>
                </div>
                <p className="text-[11px] text-fg/50 mt-1">Allow new racers to register on the site.</p>
              </div>
              <input
                type="checkbox"
                checked={form.registrationEnabled}
                onChange={(e) => handleChange('registrationEnabled', e.target.checked)}
                className="w-5 h-5 rounded border-border text-accent focus:ring-accent cursor-pointer mt-0.5"
              />
            </div>

            {/* Maintenance Mode */}
            <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
              form.maintenanceMode ? 'bg-danger-soft border-danger/40' : 'bg-surface-hover/30 border-border'
            }`}>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-fg">
                  <Power className={`w-4 h-4 ${form.maintenanceMode ? 'text-danger' : 'text-fg/50'}`} />
                  <span>Maintenance Mode</span>
                </div>
                <p className="text-[11px] text-fg/50 mt-1">Blocks non-admin logins and new races.</p>
              </div>
              <input
                type="checkbox"
                checked={form.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                className="w-5 h-5 rounded border-border text-danger focus:ring-danger cursor-pointer mt-0.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reset Defaults Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset Game Settings to Defaults?"
        description="All timers, anti-cheat limits, and operational toggles will be reverted to factory standard settings."
        confirmText="Reset Settings"
        isDestructive={true}
        isLoading={isResetting}
      />
    </form>
  );
}
