import React from 'react';
import { UserPreferences, DEFAULT_PREFERENCES } from '../../storage/db';
import { 
  Settings, 
  Moon, 
  Sun, 
  Smartphone, 
  Eye, 
  Gauge, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  Download, 
  Terminal 
} from 'lucide-react';

interface SettingsViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  preferences,
  onUpdatePreferences
}) => {
  const handleResetData = () => {
    if (window.confirm('Reset all saved simulations and preferences back to default clean factory state?')) {
      localStorage.clear();
      onUpdatePreferences(DEFAULT_PREFERENCES);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-5 border border-[var(--glass-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold tracking-wider uppercase mb-1">
            <span className="p-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Settings className="w-3.5 h-3.5" />
            </span>
            <span>Application Configuration & System Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Settings & Android Packaging</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Interface color themes, motion accessibility controls, and instructions for native Android packaging via Capacitor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance & Motion Settings */}
        <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-6 shadow-md">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Display & Accessibility</span>
          </h2>

          {/* Theme Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-[var(--text-secondary)] font-semibold block">Interface Color Theme</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdatePreferences({ theme: 'dark' })}
                className={`p-4 rounded-xl border text-left transition flex items-center justify-between shadow-sm ${
                  preferences.theme === 'dark'
                    ? 'bg-indigo-500/20 border-indigo-500 text-[var(--text-primary)] shadow-indigo-500/15 ring-1 ring-indigo-400'
                    : 'bg-[var(--bg-elevated)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-mono">Aurora Midnight</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Obsidian Glass</div>
                  </div>
                </div>
                {preferences.theme === 'dark' && <Check className="w-4 h-4 text-indigo-400" />}
              </button>

              <button
                onClick={() => onUpdatePreferences({ theme: 'light' })}
                className={`p-4 rounded-xl border text-left transition flex items-center justify-between shadow-sm ${
                  preferences.theme === 'light'
                    ? 'bg-indigo-500/20 border-indigo-500 text-[var(--text-primary)] shadow-indigo-500/15 ring-1 ring-indigo-400'
                    : 'bg-[var(--bg-elevated)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-500">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-mono">Daylight Frost</div>
                    <div className="text-[10px] text-[var(--text-muted)]">High-Contrast Light</div>
                  </div>
                </div>
                {preferences.theme === 'light' && <Check className="w-4 h-4 text-indigo-400" />}
              </button>
            </div>
          </div>

          {/* Low Motion Mode */}
          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[var(--text-primary)]">Low-Motion Performance Mode</div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Disables animated transitions for faster execution on low-spec or mobile devices.
              </div>
            </div>
            <button
              onClick={() => onUpdatePreferences({ lowMotion: !preferences.lowMotion })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                preferences.lowMotion ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  preferences.lowMotion ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reset Factory Data */}
          <div className="pt-4 border-t border-[var(--glass-border)] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-rose-400">Reset Local Storage</div>
              <div className="text-[11px] text-[var(--text-secondary)]">Wipe all cached workloads and presets</div>
            </div>
            <button
              onClick={handleResetData}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 hover:text-white text-xs font-mono transition flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Data</span>
            </button>
          </div>
        </div>

        {/* Android Packaging Guide with Capacitor */}
        <div className="glass-panel-elevated rounded-2xl p-6 border border-[var(--glass-border)] space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Android Packaging (Capacitor)</span>
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
              Offline Capable PWA/APK
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            OS Lab includes pre-configured Capacitor support (<code className="text-cyan-400">capacitor.config.ts</code>) enabling compilation into a native standalone Android APK.
          </p>

          <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-2.5 font-mono text-xs shadow-inner">
            <div className="text-[var(--text-primary)] font-bold flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Android Build Pipeline:</span>
            </div>

            <ol className="space-y-1.5 text-[var(--text-secondary)] list-decimal list-inside text-[11px]">
              <li>Compile web bundle: <code className="text-indigo-400">npm run build</code></li>
              <li>Install Capacitor Android: <code className="text-indigo-400">npm install @capacitor/android</code></li>
              <li>Add Android project: <code className="text-indigo-400">npx cap add android</code></li>
              <li>Sync build assets: <code className="text-indigo-400">npx cap sync android</code></li>
              <li>Open Android Studio: <code className="text-indigo-400">npx cap open android</code></li>
              <li>In Android Studio, select <strong className="text-[var(--text-primary)]">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong></li>
            </ol>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] space-y-1.5 text-xs font-mono shadow-sm">
            <div className="text-[var(--text-primary)] font-bold text-[11px] uppercase tracking-wider text-purple-400">
              Active Capacitor Configuration:
            </div>
            <div className="text-[var(--text-secondary)] text-[11px] space-y-0.5">
              <div>• App Name: <span className="text-[var(--text-primary)] font-semibold">OS Lab</span></div>
              <div>• Package ID: <span className="text-[var(--text-primary)] font-semibold">com.oslab.simulator</span></div>
              <div>• Web Directory: <span className="text-[var(--text-primary)] font-semibold">dist</span></div>
              <div>• Theme Color: <span className="text-[var(--text-primary)] font-semibold">#080C18</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
