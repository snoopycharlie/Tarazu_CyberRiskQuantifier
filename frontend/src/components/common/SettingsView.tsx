import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Building2, Palette, LayoutDashboard, Bell,
  Database, Shield, LogOut, Check, Monitor,
  Sun, Moon, RefreshCw, Info, Clock, Globe
} from 'lucide-react';
import { DemoUser, authLogout } from '../../utils/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  loadSettings,
  saveSettings,
} from '../../utils/settings';
import { containerVariants, itemVariants } from '../../utils/animations';

interface SettingsViewProps {
  currentUser: DemoUser | null;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onLogout }) => {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [savedFlash, setSavedFlash] = useState(false);
  const { lang, setLang, t } = useLanguage();

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
    if (window.confirm('Reset all application preferences to defaults?')) {
      localStorage.removeItem(SETTINGS_KEY);
      setSettings(DEFAULT_SETTINGS);
      document.documentElement.classList.remove('dark');
    }
  };

  const loginTime = currentUser?.loginTime
    ? new Date(currentUser.loginTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Unknown';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-2xl"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <span className="page-eyebrow block mb-1">
          Preferences
        </span>
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-base mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your profile, appearance, and application preferences.
        </p>
      </motion.div>

      {/* Save flash */}
      {savedFlash && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold w-fit"
          style={{ background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)', color: 'var(--risk-low)' }}
        >
          <Check className="w-3.5 h-3.5" />
          <span>Settings saved</span>
        </motion.div>
      )}

      {/* Profile */}
      <motion.section variants={itemVariants} className="tarazu-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <User className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="section-label block mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={settings.userName || currentUser?.name || ''}
              onChange={(e) => update({ userName: e.target.value })}
              placeholder={currentUser?.name || 'Your name'}
              className="cyber-input"
            />
          </div>
          <div>
            <label className="section-label block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={currentUser?.email || ''}
              readOnly
              className="cyber-input opacity-70 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="section-label block mb-1.5">
              Role
            </label>
            <input
              type="text"
              value={currentUser?.role || ''}
              readOnly
              className="cyber-input opacity-70 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="section-label block mb-1.5">
              Organization
            </label>
            <input
              type="text"
              value={currentUser?.org || ''}
              readOnly
              className="cyber-input opacity-70 cursor-not-allowed"
            />
          </div>
        </div>
      </motion.section>

      {/* Appearance & Language */}
      <motion.section variants={itemVariants} className="tarazu-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <Palette className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('settings.appearance')}</h2>
        </div>

        <div>
          <label className="section-label block mb-3">
            {t('settings.language')}
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang('en')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition"
              style={lang === 'en'
                ? { background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: '#ffffff' }
                : { background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }
              }
            >
              <Globe className="w-4 h-4" />
              <span>{t('settings.english')}</span>
            </button>
            <button
              onClick={() => setLang('hi')}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition"
              style={lang === 'hi'
                ? { background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: '#ffffff' }
                : { background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }
              }
            >
              <Globe className="w-4 h-4" />
              <span>{t('settings.hindi')}</span>
            </button>
          </div>
        </div>

        <div>
          <label className="section-label block mb-3">
            Color Theme
          </label>
          <div className="flex items-center gap-3">
            {([
              { value: 'light', label: t('settings.light'), icon: Sun },
              { value: 'dark', label: t('settings.dark'), icon: Moon },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => update({ theme: value })}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition"
                style={settings.theme === value
                  ? { background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: '#ffffff' }
                  : { background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Dark mode applies immediately and persists across sessions.
          </p>
        </div>

        <div>
          <label className="section-label block mb-3">
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
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition"
                style={settings.density === value
                  ? { background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: '#ffffff' }
                  : { background: 'var(--bg-surface)', borderColor: 'var(--border-strong)', color: 'var(--text-secondary)' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Dashboard Preferences */}
      <motion.section variants={itemVariants} className="tarazu-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <LayoutDashboard className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
        </div>

        <div>
          <label className="section-label block mb-2">
            Default Landing Page
          </label>
          <select
            value={settings.defaultPage}
            onChange={(e) => update({ defaultPage: e.target.value })}
            className="cyber-select"
          >
            <option value="dashboard">Overview (Recommended)</option>
            <option value="pillar1">Risk by Business Size</option>
            <option value="pillar2">How Risk Spreads</option>
            <option value="pillar3">Investment Advisor</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
      </motion.section>

      {/* Notifications */}
      <motion.section variants={itemVariants} className="tarazu-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <Bell className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</h2>
        </div>

        <div className="space-y-3">
          {([
            { key: 'riskAlerts', label: 'Risk Alerts', desc: 'Notify when risk exposure changes significantly' },
            { key: 'complianceAlerts', label: 'Compliance Alerts', desc: 'Notify when compliance gaps are detected' },
            { key: 'recommendationAlerts', label: 'Recommendation Alerts', desc: 'Notify when new security improvements are available' },
          ] as const).map(({ key, label, desc }) => (
            <label
              key={key}
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors"
              style={{ background: 'var(--bg-surface-hover)', borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</div>
              </div>
              <div
                onClick={() => update({ [key]: !settings[key] } as any)}
                className="w-11 h-6 rounded-full transition-colors relative shrink-0 ml-4 cursor-pointer"
                style={{ background: settings[key] ? 'var(--accent-primary)' : 'var(--bg-elevated)', border: `1px solid ${settings[key] ? 'transparent' : 'var(--border-strong)'}` }}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute ${
                    settings[key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                  style={{ top: '1px', left: '1px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                />
              </div>
            </label>
          ))}
        </div>
      </motion.section>

      {/* Demo Utilities */}
      <motion.section variants={itemVariants} className="tarazu-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <Database className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Demo Utilities</h2>
        </div>

        <div
          className="p-3 rounded-xl flex items-start gap-2"
          style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)' }}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            This application runs in demo mode with sample data for Suraksha Finance Ltd (BFSI · Mid-tier). 
            Demo data persists automatically. Use the options below to reset if needed.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          className="btn-secondary"
        >
          <RefreshCw className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <span>Reset Application Preferences</span>
        </button>
      </motion.section>

      {/* Session & Security */}
      <motion.section variants={itemVariants} className="tarazu-card p-6 space-y-4">
        <div className="flex items-center gap-2 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <Shield className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Session & Security</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div
            className="flex items-center justify-between p-3 rounded-xl border"
            style={{ background: 'var(--bg-surface-hover)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <div>
                <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>Signed in as</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{currentUser?.email || 'Unknown'}</div>
              </div>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'var(--risk-low-bg)', color: 'var(--risk-low)' }}
            >
              Active
            </span>
          </div>
          <div
            className="flex items-center gap-2 p-3 rounded-xl border text-xs"
            style={{ background: 'var(--bg-surface-hover)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
          >
            <Clock className="w-4 h-4" />
            <span>Session started: {loginTime}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-danger w-full mt-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </motion.section>
    </motion.div>
  );
};
