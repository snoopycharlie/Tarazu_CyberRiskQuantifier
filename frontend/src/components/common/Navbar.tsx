import React, { useState } from 'react';
import { Building2, FileText, PlusCircle, Scale, Settings, LogOut, ChevronDown } from 'lucide-react';
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

interface NavGroup {
  label: string;
  tabs: { id: string; label: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    tabs: [{ id: 'dashboard', label: 'Dashboard' }],
  },
  {
    label: 'Understand Risk',
    tabs: [
      { id: 'pillar1', label: 'Risk by Business Size' },
      { id: 'pillar2', label: 'How Risk Spreads' },
      { id: 'sheets', label: 'Assets & Infrastructure' },
    ],
  },
  {
    label: 'Take Action',
    tabs: [
      { id: 'pillar3', label: 'Investment Advisor' },
      { id: 'whatif', label: 'What-If Analysis' },
    ],
  },
  {
    label: 'Governance',
    tabs: [
      { id: 'compliance', label: 'Compliance' },
      { id: 'modules', label: 'Platform Tools' },
    ],
  },
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

  // Flat list of all tabs for easy lookup
  const allTabs = NAV_GROUPS.flatMap((g) => g.tabs);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-mist">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onSelectTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-sienna flex items-center justify-center text-paper shadow-sm group-hover:bg-ink transition">
              <Scale className="w-5 h-5 text-peach" />
            </div>
            <div>
              <span className="font-editorial text-xl font-bold tracking-tight text-ink">Tarazu</span>
              <p className="text-[10px] text-slate tracking-wide hidden sm:block">
                AI-Powered Cyber Risk Platform
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Total Financial Exposure Badge */}
            {totalEal > 0 && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-peach/60 border border-sienna/20 text-xs">
                <span className="text-slate font-medium">Annual Exposure:</span>
                <span className="font-bold text-sienna">{formatInrCompact(totalEal)}</span>
              </div>
            )}

            {/* Demo Guide Button */}
            <DemoGuideButton onClick={onStartDemoGuide} />

            {/* Organization Selector */}
            <div className="relative flex items-center gap-2 bg-fog border border-mist rounded-pill px-3 py-1.5">
              <Building2 className="w-4 h-4 text-slate shrink-0" />
              <select
                className="bg-transparent text-sm font-medium text-ink focus:outline-none cursor-pointer pr-2 max-w-[160px] sm:max-w-none"
                value={currentOrg?.id || ''}
                onChange={(e) => {
                  const found = organizations.find((o) => o.id === e.target.value);
                  if (found) onSelectOrg(found);
                }}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.size_tier})
                  </option>
                ))}
              </select>
              <button
                onClick={onOpenNewOrgModal}
                title="Add Organization"
                className="text-slate hover:text-ink transition p-0.5"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Add Asset */}
            <button
              onClick={onOpenIntakeModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-ink text-paper text-xs font-semibold hover:bg-black transition shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Asset</span>
            </button>

            {/* Audit Report */}
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-fog border border-mist text-ink text-xs font-semibold hover:bg-mist transition shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-sienna" />
              <span className="hidden sm:inline">Audit Report</span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1 px-2.5 py-2 rounded-pill bg-fog border border-mist text-ink text-xs font-semibold hover:bg-mist transition"
              >
                <Settings className="w-3.5 h-3.5 text-slate" />
                <ChevronDown className="w-3 h-3 text-slate" />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-mist shadow-elevated z-20 overflow-hidden">
                    <button
                      onClick={() => { onSelectTab('settings'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-ink hover:bg-fog transition text-left"
                    >
                      <Settings className="w-4 h-4 text-slate" />
                      <span>Settings</span>
                    </button>
                    <div className="border-t border-mist" />
                    <button
                      onClick={() => { onLogout(); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-crimson hover:bg-crimson/5 transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tab Bar — grouped */}
        <nav className="flex items-start gap-4 border-t border-mist/60 overflow-x-auto py-2 scrollbar-none">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="flex items-center gap-1 shrink-0">
              {/* Group separator */}
              {gi > 0 && (
                <div className="w-px h-5 bg-mist mx-1 self-center" />
              )}
              {/* Group label — subtle */}
              <span className="text-[10px] font-bold text-slate/50 uppercase tracking-wider mr-1 hidden xl:block self-center">
                {group.label}
              </span>
              {group.tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-pill whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-ink text-paper shadow-sm'
                        : 'text-slate hover:text-ink hover:bg-mist/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
};
