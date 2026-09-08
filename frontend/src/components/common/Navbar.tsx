import { Building2, FileText, PlusCircle, Scale } from 'lucide-react';
import { Organization } from '../../types';

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
}) => {
  const formatInr = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const navTabs = [
    { id: 'dashboard', label: 'Executive Overview' },
    { id: 'pillar1', label: 'Pillar 1: Org Scaling' },
    { id: 'pillar2', label: 'Pillar 2: Blast Radius' },
    { id: 'pillar3', label: 'Pillar 3: Advisor & What-If' },
    { id: 'sheets', label: 'Assets & Sheets' },
    { id: 'compliance', label: 'Compliance Audit' },
    { id: 'modules', label: 'Platform Modules' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-mist">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-sienna flex items-center justify-center text-paper shadow-sm">
              <Scale className="w-5 h-5 text-peach" />
            </div>
            <div>
              <span className="font-editorial text-2xl font-bold tracking-tight text-ink">Tarazu</span>
              <p className="text-xs text-slate tracking-wide">Continuous Cyber Risk Financial Quantification</p>
            </div>
          </div>

          {/* Org Selector & Status */}
          <div className="flex items-center gap-4">

            {/* Total EAL Badge */}
            {totalEal > 0 && (
              <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-peach/60 border border-sienna/20 text-xs">
                <span className="text-slate font-medium">Exposure:</span>
                <span className="font-bold text-sienna">{formatInr(totalEal)}</span>
              </div>
            )}

            {/* Organization Dropdown */}
            <div className="relative flex items-center gap-2 bg-fog border border-mist rounded-pill px-3 py-1.5">
              <Building2 className="w-4 h-4 text-slate" />
              <select
                className="bg-transparent text-sm font-medium text-ink focus:outline-none cursor-pointer pr-2"
                value={currentOrg?.id || ''}
                onChange={(e) => {
                  const found = organizations.find((o) => o.id === e.target.value);
                  if (found) onSelectOrg(found);
                }}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.sector} · {org.size_tier})
                  </option>
                ))}
              </select>
              <button
                onClick={onOpenNewOrgModal}
                title="Create New Organization"
                className="text-slate hover:text-ink transition p-0.5"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={onOpenIntakeModal}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-ink text-paper text-sm font-medium hover:bg-black transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Asset</span>
            </button>

            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-fog border border-mist text-ink text-sm font-medium hover:bg-mist transition shadow-sm"
            >
              <FileText className="w-4 h-4 text-sienna" />
              <span className="hidden sm:inline">Audit Report</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <nav className="flex space-x-1 border-t border-mist/60 overflow-x-auto py-2 scrollbar-none">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-pill whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-ink text-paper shadow-sm'
                    : 'text-slate hover:text-ink hover:bg-mist/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
