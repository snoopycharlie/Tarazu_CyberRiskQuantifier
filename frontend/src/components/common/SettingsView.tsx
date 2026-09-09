import React, { useState, useEffect } from 'react';
import {
  User, Mail, Building2, Palette, LayoutDashboard, Bell,
  Database, Shield, LogOut, ChevronRight, Check, Monitor,
  Sun, Moon, RefreshCw, Info, Clock
} from 'lucide-react';
import { DemoUser, authLogout } from '../../utils/auth';

interface SettingsViewProps {
  currentUser: DemoUser | null;
  onLogout: () => void;
}

type ThemeMode = 'light' | 'dark';
type DensityMode = 'comfortable' | 'compact';

const SETTINGS_KEY = 'tarazu_settings';

interface AppSettings {
  theme: ThemeMode;
  density: DensityMode;
  defaultPage: string;
  defaultCurrency: 'INR';
  riskAlerts: boolean;
  complianceAlerts: boolean;
  recommendationAlerts: boolean;
  userName: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  density: 'comfortable',
  defaultPage: 'dashboard',
  defaultCurrency: 'INR',
  riskAlerts: true,
  complianceAlerts: true,
  recommendationAlerts: true,
  userName: '',
};

export const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (s: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
};

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onLogout }) => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [savedFlash, setSavedFlash] = useState(false);

  const update = (partial: Partial<AppSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    saveSettings(next);
    // Apply theme immediately
    if (partial.theme) {
      document.documentElement.classList.toggle('dark', partial.theme === 'dark');
    }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  useEffect(() => {
    // Apply stored theme on mount
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
  }, []);

  const handleLogout = () => {
    authLogout();
    onLogout();
  };

  const handleResetDemo = () => {
    if (confirm('Reset all application preferences to defaults?')) {
      localStorage.removeItem(SETTINGS_KEY);
      setSettings(DEFAULT_SETTINGS);
      document.documentElement.classList.remove('dark');
    }
  };

  const loginTime = currentUser?.loginTime
    ? new Date(currentUser.loginTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Unknown';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold text-slate uppercase tracking-widest block mb-1">
          Preferences
        </span>
        <h1 className="font-editorial text-4xl font-bold text-ink tracking-tight">Settings</h1>
        <p className="text-slate text-base mt-1">
          Manage your profile, appearance, and application preferences.
        </p>
      </div>

      {/* Save flash */}
      {savedFlash && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald/10 border border-emerald/20 text-emerald text-xs font-semibold w-fit animate-in fade-in duration-150">
          <Check className="w-3.5 h-3.5" />
          <span>Settings saved</span>
        </div>
      )}

      {/* Profile */}
      <section className="steep-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-mist">
          <User className="w-4 h-4 text-sienna" />
          <h2 className="font-editorial text-lg font-bold text-ink">Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={settings.userName || currentUser?.name || ''}
              onChange={(e) => update({ userName: e.target.value })}
              placeholder={currentUser?.name || 'Your name'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none focus:border-sienna/50 transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={currentUser?.email || ''}
              readOnly
              className="w-full px-3.5 py-2.5 rounded-xl border border-mist bg-fog text-slate text-sm font-medium cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
              Role
            </label>
            <input
              type="text"
              value={currentUser?.role || ''}
              readOnly
              className="w-full px-3.5 py-2.5 rounded-xl border border-mist bg-fog text-slate text-sm font-medium cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
              Organization
            </label>
            <input
              type="text"
              value={currentUser?.org || ''}
              readOnly
              className="w-full px-3.5 py-2.5 rounded-xl border border-mist bg-fog text-slate text-sm font-medium cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="steep-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-mist">
          <Palette className="w-4 h-4 text-sienna" />
          <h2 className="font-editorial text-lg font-bold text-ink">Appearance</h2>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-3">
            Color Theme
          </label>
          <div className="flex items-center gap-3">
            {([
              { value: 'light', label: 'Light', icon: Sun },
              { value: 'dark', label: 'Dark', icon: Moon },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => update({ theme: value })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition ${
                  settings.theme === value
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-fog border-mist text-slate hover:text-ink hover:border-slate/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate mt-2">
            Dark mode applies immediately and persists across sessions.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-3">
            Display Density
          </label>
          <div className="flex items-center gap-3">
            {([
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ] as const).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => update({ density: value })}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition ${
                  settings.density === value
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-fog border-mist text-slate hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preferences */}
      <section className="steep-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-mist">
          <LayoutDashboard className="w-4 h-4 text-sienna" />
          <h2 className="font-editorial text-lg font-bold text-ink">Dashboard</h2>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-2">
            Default Landing Page
          </label>
          <select
            value={settings.defaultPage}
            onChange={(e) => update({ defaultPage: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none focus:border-sienna/50 transition"
          >
            <option value="dashboard">Overview (Recommended)</option>
            <option value="pillar1">Risk by Business Size</option>
            <option value="pillar2">How Risk Spreads</option>
            <option value="pillar3">Investment Advisor</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
      </section>

      {/* Notifications */}
      <section className="steep-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-mist">
          <Bell className="w-4 h-4 text-sienna" />
          <h2 className="font-editorial text-lg font-bold text-ink">Notifications</h2>
        </div>

        <div className="space-y-3">
          {([
            { key: 'riskAlerts', label: 'Risk Alerts', desc: 'Notify when risk exposure changes significantly' },
            { key: 'complianceAlerts', label: 'Compliance Alerts', desc: 'Notify when compliance gaps are detected' },
            { key: 'recommendationAlerts', label: 'Recommendation Alerts', desc: 'Notify when new security improvements are available' },
          ] as const).map(({ key, label, desc }) => (
            <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-fog border border-mist cursor-pointer hover:bg-mist/60 transition">
              <div>
                <div className="text-sm font-semibold text-ink">{label}</div>
                <div className="text-xs text-slate mt-0.5">{desc}</div>
              </div>
              <div
                onClick={() => update({ [key]: !settings[key] } as any)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ml-4 cursor-pointer ${
                  settings[key] ? 'bg-sienna' : 'bg-slate/30'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                    settings[key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Demo Utilities */}
      <section className="steep-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-mist">
          <Database className="w-4 h-4 text-sienna" />
          <h2 className="font-editorial text-lg font-bold text-ink">Demo Utilities</h2>
        </div>

        <div className="p-3 rounded-xl bg-peach/30 border border-sienna/20 flex items-start gap-2">
          <Info className="w-4 h-4 text-sienna shrink-0 mt-0.5" />
          <p className="text-xs text-sienna/80 leading-relaxed">
            This application runs in demo mode with sample data for Suraksha Finance Ltd (BFSI · Mid-tier). 
            Demo data persists automatically. Use the options below to reset if needed.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-fog border border-mist text-sm font-semibold text-ink hover:bg-mist transition"
        >
          <RefreshCw className="w-4 h-4 text-sienna" />
          <span>Reset Application Preferences</span>
        </button>
      </section>

      {/* Session & Security */}
      <section className="steep-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-mist">
          <Shield className="w-4 h-4 text-sienna" />
          <h2 className="font-editorial text-lg font-bold text-ink">Session & Security</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3 rounded-xl bg-fog border border-mist">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate" />
              <div>
                <div className="font-semibold text-ink text-xs">Signed in as</div>
                <div className="text-slate text-xs">{currentUser?.email || 'Unknown'}</div>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald/10 text-emerald font-semibold">Active</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-fog border border-mist text-xs text-slate">
            <Clock className="w-4 h-4" />
            <span>Session started: {loginTime}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson text-sm font-semibold hover:bg-crimson/20 transition w-full justify-center"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </section>
    </div>
  );
};
