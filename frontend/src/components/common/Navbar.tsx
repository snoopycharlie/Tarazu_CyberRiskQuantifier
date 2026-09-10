import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, FileText, PlusCircle, Scale, Settings, LogOut, ChevronDown,
  LayoutDashboard, BarChart3, Network, Layers, Brain, GitBranch, Shield, Wrench, User,
  AlertTriangle,
} from 'lucide-react';
import { Organization } from '../../types';
import { DemoGuideButton } from './DemoGuide';
import { formatInrCompact } from '../../utils/format';

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

interface NavTab {
  id: string;
  label: string;
  icon: React.ElementType;
  group: string;
}

const NAV_TABS: NavTab[] = [
  { id: 'dashboard', label: 'Dashboard',         icon: LayoutDashboard, group: 'overview' },
  { id: 'pillar1',   label: 'Risk by Size',       icon: BarChart3,       group: 'analyze' },
  { id: 'pillar2',   label: 'Risk Spread',         icon: Network,         group: 'analyze' },
  { id: 'sheets',    label: 'Assets',             icon: Layers,          group: 'analyze' },
  { id: 'pillar3',   label: 'Advisor',            icon: Brain,           group: 'action' },
  { id: 'whatif',    label: 'What-If',            icon: GitBranch,       group: 'action' },
  { id: 'compliance',label: 'Compliance',         icon: Shield,          group: 'govern' },
  { id: 'modules',   label: 'Tools',              icon: Wrench,          group: 'govern' },
];

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

  return (
    <header className="sticky top-0 z-40 bg-page/90 backdrop-blur-md border-b border-border-dim shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Top Bar ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button
            className="flex items-center gap-3 group flex-shrink-0"
            onClick={() => onSelectTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyber-blue shadow-glow-blue transition-transform group-hover:scale-105">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-bold text-xl text-ink tracking-tight leading-none">
                Tarazu
              </span>
              <p className="text-[11px] font-medium text-slate leading-none mt-1 uppercase tracking-wider">
                Risk Platform
              </p>
            </div>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-3">

            {/* Financial Exposure Badge */}
            {totalEal > 0 && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-risk-critical-bg border border-risk-critical-border text-sm">
                <AlertTriangle className="w-4 h-4 text-risk-critical" />
                <span className="text-slate font-medium">Exposure:</span>
                <span className="font-bold text-risk-critical">
                  {formatInrCompact(totalEal)}
                </span>
              </div>
            )}

            {/* Demo Guide */}
            <DemoGuideButton onClick={onStartDemoGuide} />

            {/* Organization selector */}
            <div className="relative">
              <button
                onClick={() => setShowOrgMenu(!showOrgMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface hover:bg-surface-2 border border-border-dim text-ink transition-all"
              >
                <Building2 className="w-4 h-4 text-cyber-blue" />
                <span className="max-w-[140px] truncate hidden sm:block">
                  {currentOrg?.name || 'Select Org'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate" />
              </button>

              {showOrgMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowOrgMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl z-20 overflow-hidden bg-surface-3 border border-border-dim shadow-elevated animate-in slide-in-from-top-2">
                    <div className="p-2">
                      {organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => { onSelectOrg(org); setShowOrgMenu(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
                            currentOrg?.id === org.id 
                              ? 'bg-cyber-blue/10 text-cyber-blue' 
                              : 'text-ink hover:bg-surface-2'
                          }`}
                        >
                          <Building2 className={`w-4 h-4 shrink-0 ${currentOrg?.id === org.id ? 'text-cyber-blue' : 'text-slate'}`} />
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{org.name}</div>
                            <div className="text-xs text-slate mt-0.5">{org.size_tier} · {org.sector}</div>
                          </div>
                        </button>
                      ))}
                      <div className="mt-1 pt-1 border-t border-border-dim">
                        <button
                          onClick={() => { onOpenNewOrgModal(); setShowOrgMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-slate hover:text-cyber-blue hover:bg-surface-2 transition-all"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span className="font-medium">Add Organization</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Add Asset */}
            <button
              onClick={onOpenIntakeModal}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-cyber-blue/10 border border-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue/20 hover:border-cyber-blue/40 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Asset</span>
            </button>

            {/* Audit Report */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-surface hover:bg-surface-2 border border-border-dim text-ink transition-all"
            >
              <FileText className="w-4 h-4 text-slate" />
              <span className="hidden sm:inline">Report</span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-surface hover:bg-surface-2 border border-border-dim text-ink transition-all"
              >
                <User className="w-4 h-4 text-slate" />
                <ChevronDown className="w-4 h-4 text-slate" />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl z-20 overflow-hidden bg-surface-3 border border-border-dim shadow-elevated animate-in slide-in-from-top-2">
                    <div className="p-1.5">
                      <button
                        onClick={() => { onSelectTab('settings'); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-ink hover:bg-surface-2 transition-all font-medium"
                      >
                        <Settings className="w-4 h-4 text-slate" />
                        <span>Settings</span>
                      </button>
                      <div className="my-1 border-t border-border-dim" />
                      <button
                        onClick={() => { onLogout(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-risk-critical hover:bg-risk-critical-bg transition-all font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ──────────────────────────────────────── */}
        <nav className="flex items-center gap-6 overflow-x-auto scrollbar-none pt-2 pb-0 relative">
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex items-center gap-2 pb-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-cyber-blue'
                    : 'text-slate hover:text-ink'
                }`}
              >
                <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyber-blue' : 'text-slate'}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-blue"
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
