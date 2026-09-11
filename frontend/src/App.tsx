import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Organization, Sheet, DashboardSummary } from './types';
import { api } from './services/api';
import { Navbar } from './components/common/Navbar';
import { LoginPage } from './components/common/LoginPage';
import { DemoGuide } from './components/common/DemoGuide';
import { getSession, DemoUser } from './utils/auth';
import { loadSettings } from './utils/settings';
import { LanguageProvider } from './i18n/LanguageContext';

// Lazy-loaded views
const DashboardView = lazy(() =>
  import('./components/dashboard/DashboardView').then(({ DashboardView }) => ({ default: DashboardView }))
);
const Pillar1ComparisonView = lazy(() =>
  import('./components/pillar1/Pillar1ComparisonView').then(({ Pillar1ComparisonView }) => ({ default: Pillar1ComparisonView }))
);
const Pillar2GraphView = lazy(() =>
  import('./components/pillar2/Pillar2GraphView').then(({ Pillar2GraphView }) => ({ default: Pillar2GraphView }))
);
const Pillar3AdvisorView = lazy(() =>
  import('./components/pillar3/Pillar3AdvisorView').then(({ Pillar3AdvisorView }) => ({ default: Pillar3AdvisorView }))
);
const WhatIfView = lazy(() =>
  import('./components/whatif/WhatIfView').then(({ WhatIfView }) => ({ default: WhatIfView }))
);
const SheetsView = lazy(() =>
  import('./components/sheets/SheetsView').then(({ SheetsView }) => ({ default: SheetsView }))
);
const ComplianceView = lazy(() =>
  import('./components/compliance/ComplianceView').then(({ ComplianceView }) => ({ default: ComplianceView }))
);
const PlatformModulesView = lazy(() =>
  import('./components/modules/PlatformModulesView').then(({ PlatformModulesView }) => ({ default: PlatformModulesView }))
);
const AssetIntakeModal = lazy(() =>
  import('./components/intake/AssetIntakeModal').then(({ AssetIntakeModal }) => ({ default: AssetIntakeModal }))
);
const AuditReportModal = lazy(() =>
  import('./components/report/AuditReportModal').then(({ AuditReportModal }) => ({ default: AuditReportModal }))
);
const NewOrgModal = lazy(() =>
  import('./components/common/NewOrgModal').then(({ NewOrgModal }) => ({ default: NewOrgModal }))
);
const SettingsView = lazy(() =>
  import('./components/common/SettingsView').then(({ SettingsView }) => ({ default: SettingsView }))
);

export const App: React.FC = () => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // App state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [activeSheet, setActiveSheet] = useState<Sheet | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Demo guide
  const [showDemoGuide, setShowDemoGuide] = useState(false);

  // Modals
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNewOrgModal, setShowNewOrgModal] = useState(false);

  // Check auth session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      setCurrentUser(session);
    }
    setAuthChecked(true);
  }, []);

  // Apply stored settings on mount
  useEffect(() => {
    const settings = loadSettings();
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    // Respect default page setting
    if (settings.defaultPage && settings.defaultPage !== 'dashboard') {
      setActiveTab(settings.defaultPage);
    }
  }, []);

  // Init app data once authenticated
  useEffect(() => {
    if (currentUser) {
      initApp();
    }
  }, [currentUser]);

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
        const defaultSheet =
          sheetsData.find(
            (s) =>
              s.name.includes('Payment') ||
              s.name.includes('Corporate') ||
              s.name.includes('Core Banking')
          ) || sheetsData[0];
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

  const handleLogin = (user: DemoUser) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Don't render until auth is checked
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fog">
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(59,130,246,0.2)', borderTopColor: '#3b82f6' }}
        />
      </div>
    );
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <LanguageProvider>
    <div className="min-h-screen flex flex-col font-sans bg-fog text-ink">
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
        onStartDemoGuide={() => setShowDemoGuide(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="py-32 text-center">
              <div
                className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4 border-cyber-blue/20 border-t-cyber-blue"
              />
              <p className="text-sm font-medium text-slate">Preparing your workspace…</p>
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
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
              activeSheetId={activeSheet?.id || sheets[0]?.id || ''}
              onSelectSheet={(id) => {
                const s = sheets.find((item) => item.id === id);
                if (s) setActiveSheet(s);
              }}
            />
          )}

          {activeTab === 'pillar3' && <Pillar3AdvisorView currentOrg={currentOrg} />}

          {activeTab === 'whatif' && <WhatIfView currentOrg={currentOrg} />}

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
            <PlatformModulesView
              currentOrg={currentOrg}
              sheets={sheets}
              onRefreshTelemetry={handleRefreshSheets}
            />
          )}

            {activeTab === 'settings' && (
              <SettingsView currentUser={currentUser} onLogout={handleLogout} />
            )}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="py-4 mt-8 text-xs border-t border-mist bg-fog/60 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">Tarazu</span>
            <span>·</span>
            <span>AI-Powered Cyber Risk Platform</span>
          </div>
          <div className="flex items-center gap-2 text-smoke">
            <span>FAIR-Calibrated</span>
            <span>·</span>
            <span>Rules-Before-AI</span>
            <span>·</span>
            <span>NIST NVD API v2.0</span>
          </div>
        </div>
      </footer>

      {/* Demo Guide Overlay */}
      <DemoGuide
        isOpen={showDemoGuide}
        onClose={() => setShowDemoGuide(false)}
        onNavigate={setActiveTab}
      />

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
    </LanguageProvider>
  );
};
