import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Organization, Sheet, DashboardSummary } from './types';
import { api } from './services/api';
import { Navbar } from './components/common/Navbar';

const DashboardView = lazy(() => import('./components/dashboard/DashboardView').then(({ DashboardView }) => ({ default: DashboardView })));
const Pillar1ComparisonView = lazy(() => import('./components/pillar1/Pillar1ComparisonView').then(({ Pillar1ComparisonView }) => ({ default: Pillar1ComparisonView })));
const Pillar2GraphView = lazy(() => import('./components/pillar2/Pillar2GraphView').then(({ Pillar2GraphView }) => ({ default: Pillar2GraphView })));
const Pillar3AdvisorView = lazy(() => import('./components/pillar3/Pillar3AdvisorView').then(({ Pillar3AdvisorView }) => ({ default: Pillar3AdvisorView })));
const SheetsView = lazy(() => import('./components/sheets/SheetsView').then(({ SheetsView }) => ({ default: SheetsView })));
const ComplianceView = lazy(() => import('./components/compliance/ComplianceView').then(({ ComplianceView }) => ({ default: ComplianceView })));
const PlatformModulesView = lazy(() => import('./components/modules/PlatformModulesView').then(({ PlatformModulesView }) => ({ default: PlatformModulesView })));
const AssetIntakeModal = lazy(() => import('./components/intake/AssetIntakeModal').then(({ AssetIntakeModal }) => ({ default: AssetIntakeModal })));
const AuditReportModal = lazy(() => import('./components/report/AuditReportModal').then(({ AuditReportModal }) => ({ default: AuditReportModal })));
const NewOrgModal = lazy(() => import('./components/common/NewOrgModal').then(({ NewOrgModal }) => ({ default: NewOrgModal })));

export const App: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [activeSheet, setActiveSheet] = useState<Sheet | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Screen / Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNewOrgModal, setShowNewOrgModal] = useState(false);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      setLoading(true);
      const orgs = await api.listOrganizations();
      setOrganizations(orgs);

      // Prefer "Suraksha Finance Ltd" if available
      const suraksha = orgs.find((o) => o.name.includes('Suraksha')) || orgs[0] || null;
      if (suraksha) {
        setCurrentOrg(suraksha);
        await loadOrgTelemetry(suraksha.id);
      }
    } catch (err) {
      console.error('Failed to initialize Tarazu app:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgTelemetry = async (orgId: string) => {
    try {
      const [sheetsData, dashData] = await Promise.all([
        api.listSheets(orgId),
        api.getDashboard(orgId),
      ]);
      setSheets(sheetsData);
      setDashboard(dashData);

      if (sheetsData.length > 0) {
        // Default to Payment Systems, Corporate IT or first sheet
        const defaultSheet = sheetsData.find((s) => s.name.includes('Payment') || s.name.includes('Corporate') || s.name.includes('Core Banking')) || sheetsData[0];
        setActiveSheet(defaultSheet);
      }
    } catch (err) {
      console.error('Failed to load org telemetry:', err);
    }
  };

  const handleSelectOrg = async (org: Organization) => {
    setCurrentOrg(org);
    setLoading(true);
    await loadOrgTelemetry(org.id);
    setLoading(false);
  };

  const handleRefreshSheets = async () => {
    if (currentOrg) {
      await loadOrgTelemetry(currentOrg.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-fog text-ink font-sans">
      {/* Top Navigation */}
      <Navbar
        currentOrg={currentOrg}
        organizations={organizations}
        onSelectOrg={handleSelectOrg}
        onOpenNewOrgModal={() => setShowNewOrgModal(true)}
        onOpenIntakeModal={() => setShowIntakeModal(true)}
        onOpenReportModal={() => setShowReportModal(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalEal={dashboard?.total_eal_inr || 0}
        aiMode={dashboard?.ai_mode || 'rules_only'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="py-16 text-center text-sm text-slate">Loading workspace…</div>}>
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={dashboard}
            sheets={sheets}
            loading={loading}
            onNavigateTab={setActiveTab}
            onSelectSheet={(sheet) => {
              setActiveSheet(sheet);
              setActiveTab('sheets');
            }}
          />
        )}

        {activeTab === 'pillar1' && <Pillar1ComparisonView />}

        {activeTab === 'pillar2' && (
          <Pillar2GraphView
            sheets={sheets}
            activeSheetId={activeSheet?.id || (sheets[0]?.id || '')}
            onSelectSheet={(id) => {
              const s = sheets.find((item) => item.id === id);
              if (s) setActiveSheet(s);
            }}
          />
        )}

        {activeTab === 'pillar3' && <Pillar3AdvisorView currentOrg={currentOrg} />}

        {activeTab === 'sheets' && (
          <SheetsView
            sheets={sheets}
            activeSheet={activeSheet}
            onSelectSheet={setActiveSheet}
            onRefreshSheets={handleRefreshSheets}
            onOpenIntakeModal={() => setShowIntakeModal(true)}
          />
        )}

        {activeTab === 'compliance' && <ComplianceView currentOrg={currentOrg} />}

        {(activeTab === 'modules' || activeTab === 'stubs') && (
          <PlatformModulesView currentOrg={currentOrg} sheets={sheets} onRefreshTelemetry={handleRefreshSheets} />
        )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-mist bg-white/70 py-6 mt-12 text-xs text-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-editorial font-bold text-ink">Tarazu</span>
            <span>·</span>
            <span>AI-Powered Continuous Cyber Risk Quantification Platform</span>
            <span>·</span>
            <span className="font-semibold text-sienna">SIH26105</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Rules-Before-AI Architecture</span>
            <span>·</span>
            <span>FAIR-Calibrated Financial Engine</span>
            <span>·</span>
            <span>NIST NVD Real API v2.0</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <Suspense fallback={null}>
        {showIntakeModal && (
          <AssetIntakeModal
            isOpen
            onClose={() => setShowIntakeModal(false)}
            sheets={sheets.filter((s) => s.type === 'base')}
            currentSheetId={activeSheet?.id}
            onAssetCreated={handleRefreshSheets}
          />
        )}

        {showReportModal && currentOrg && (
          <AuditReportModal
            isOpen
            onClose={() => setShowReportModal(false)}
            orgId={currentOrg.id}
          />
        )}

        {showNewOrgModal && (
          <NewOrgModal
            isOpen
            onClose={() => setShowNewOrgModal(false)}
            onOrgCreated={(newOrg) => {
              setOrganizations([newOrg, ...organizations]);
              handleSelectOrg(newOrg);
            }}
          />
        )}
      </Suspense>
    </div>
  );
};
