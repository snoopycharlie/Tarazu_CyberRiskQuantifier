import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2, FileText, PlusCircle, Scale, Settings, LogOut, ChevronDown,
  LayoutDashboard, BarChart3, Network, Layers, Brain, GitBranch, Shield, Wrench, User,
  AlertTriangle, Languages,
} from 'lucide-react';
import { Organization } from '../../types';
import { DemoGuideButton } from './DemoGuide';
import { formatInrCompact } from '../../utils/format';
import { useLanguage } from '../../i18n/LanguageContext';
import { dropdownVariants } from '../../utils/animations';

interface NavbarProps {
  currentOrg: Organization | null;
  organizations: Organization[];
  onSelectOrg: (org: Organization) => void;
  onOpenNewOrgModal: () => void;
  onOpenIntakeModal: () => void;
  onOpenReportModal: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  totalEal: number;
  aiMode: string;
  onStartDemoGuide: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentOrg,
  organizations,
  onSelectOrg,
  onOpenNewOrgModal,
  onOpenIntakeModal,
  onOpenReportModal,
  activeTab,
  onSelectTab,
  totalEal,
  aiMode,
  onStartDemoGuide,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const { lang, setLang, t } = useLanguage();

  const NAV_TABS = [
    { id: 'dashboard', label: t('nav.tab.dashboard'), icon: LayoutDashboard, group: 'overview' },
    { id: 'pillar1',   label: t('nav.tab.pillar1'),   icon: BarChart3,       group: 'analyze' },
    { id: 'pillar2',   label: t('nav.tab.pillar2'),   icon: Network,         group: 'analyze' },
    { id: 'sheets',    label: t('nav.tab.sheets'),    icon: Layers,          group: 'analyze' },
    { id: 'pillar3',   label: t('nav.tab.pillar3'),   icon: Brain,           group: 'action'  },
    { id: 'whatif',    label: t('nav.tab.whatif'),    icon: GitBranch,       group: 'action'  },
    { id: 'compliance',label: t('nav.tab.compliance'),icon: Shield,          group: 'govern'  },
    { id: 'modules',   label: t('nav.tab.modules'),   icon: Wrench,          group: 'govern'  },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: 'var(--nav-bg)',
        borderColor: 'var(--nav-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Top Bar ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-15" style={{ height: '60px' }}>

          {/* Logo */}
          <button
            className="flex items-center gap-3 group flex-shrink-0 py-1"
            onClick={() => onSelectTab('dashboard')}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{ background: 'var(--gradient-brand)', boxShadow: '0 2px 8px rgba(0,196,180,0.35)' }}
            >
              <Scale className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
            </div>
            <div className="hidden sm:block text-left">
              <span
                className="font-bold text-lg leading-none"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
              >
                Tarazu
              </span>
              <p className="page-eyebrow leading-none mt-1">
                Risk Platform
              </p>
            </div>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-2">

            {/* Financial Exposure Badge */}
            {totalEal > 0 && (
              <div
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: 'var(--risk-high-bg)',
                  border: '1px solid var(--risk-high-border)',
                  color: 'var(--risk-high)',
                }}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span style={{ color: 'var(--text-secondary)' }} className="font-medium">{t('nav.exposure')}:</span>
                <span className="font-bold tabular-nums">{formatInrCompact(totalEal)}</span>
              </div>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all"
              style={{
                background: lang === 'hi' ? 'var(--accent-subtle)' : 'transparent',
                borderColor: lang === 'hi' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: lang === 'hi' ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
              title={lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'हिं' : 'EN'}</span>
            </button>

            {/* Tutorial Button */}
            <DemoGuideButton onClick={onStartDemoGuide} />

            {/* Organization selector */}
            <div className="relative">
              <button
                onClick={() => setShowOrgMenu(!showOrgMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <Building2 className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span className="max-w-[130px] truncate hidden sm:block text-sm">
                  {currentOrg?.name || t('nav.selectOrg')}
                </span>
                <ChevronDown
                  className="w-3.5 h-3.5 shrink-0 transition-transform"
                  style={{
                    color: 'var(--text-muted)',
                    transform: showOrgMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              <AnimatePresence>
                {showOrgMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowOrgMenu(false)}
                    />
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 mt-2 w-64 rounded-xl z-20 overflow-hidden"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <div className="p-2">
                        {/* Org list */}
                        {organizations.map((org) => (
                          <button
                            key={org.id}
                            onClick={() => { onSelectOrg(org); setShowOrgMenu(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all text-sm ${
                              currentOrg?.id === org.id ? '' : ''
                            }`}
                            style={{
                              background: currentOrg?.id === org.id ? 'var(--accent-subtle)' : 'transparent',
                              color: currentOrg?.id === org.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                            }}
                            onMouseEnter={(e) => {
                              if (currentOrg?.id !== org.id) {
                                (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface-hover)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (currentOrg?.id !== org.id) {
                                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              }
                            }}
                          >
                            <Building2
                              className="w-4 h-4 shrink-0"
                              style={{ color: currentOrg?.id === org.id ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">{org.name}</div>
                              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {org.size_tier} · {org.sector}
                              </div>
                            </div>
                            {currentOrg?.id === org.id && (
                              <div
                                className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: 'var(--accent-primary)' }}
                              />
                            )}
                          </button>
                        ))}
                        <div className="mt-1 pt-1" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          <button
                            onClick={() => { onOpenNewOrgModal(); setShowOrgMenu(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-subtle)';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-primary)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                            }}
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>{t('nav.addOrg')}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Add Asset */}
            <button
              onClick={onOpenIntakeModal}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all"
              style={{
                background: 'var(--accent-subtle)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-strong)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-subtle)';
              }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('nav.addAsset')}</span>
            </button>

            {/* Audit Report */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.report')}</span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all"
                style={{
                  background: showUserMenu ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <User className="w-4 h-4" />
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform"
                  style={{ transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <motion.div
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="absolute right-0 mt-2 w-48 rounded-xl z-20 overflow-hidden"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <div className="p-1.5">
                        <button
                          onClick={() => { onSelectTab('settings'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          }}
                        >
                          <Settings className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          <span>{t('nav.settings')}</span>
                        </button>
                        <div className="my-1" style={{ borderTop: '1px solid var(--border-subtle)' }} />
                        <button
                          onClick={() => { onLogout(); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                          style={{ color: 'var(--risk-critical)' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'var(--risk-critical-bg)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('nav.signOut')}</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ──────────────────────────────────── */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none -mb-px">
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className="relative flex items-center gap-2 px-3 py-3 text-[13px] font-medium whitespace-nowrap transition-all rounded-t-lg"
                style={{
                  color: isActive ? 'var(--nav-active)' : 'var(--nav-inactive)',
                  background: isActive ? 'var(--accent-subtle)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--nav-inactive)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                <tab.icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: isActive ? 'var(--nav-active)' : 'var(--text-muted)' }}
                />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'var(--gradient-brand)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
