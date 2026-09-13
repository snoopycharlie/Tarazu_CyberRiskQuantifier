import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, Layers, ChevronRight, TrendingDown, Network, Wallet,
  Info, ArrowUpRight
} from 'lucide-react';
import { DashboardSummary, Sheet } from '../../types';
import { formatInr } from '../../utils/format';
import { useLanguage } from '../../i18n/LanguageContext';
import { containerVariants, itemVariants, slideUpVariants } from '../../utils/animations';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  sheets: Sheet[];
  loading: boolean;
  onNavigateTab: (tab: string) => void;
  onSelectSheet: (sheet: Sheet) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  sheets,
  loading,
  onNavigateTab,
  onSelectSheet,
}) => {
  const [showEalExplainer, setShowEalExplainer] = useState(false);
  const { t } = useLanguage();

  if (loading || !summary) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{t('general.preparing')}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('general.loadingOrg')}</p>
      </div>
    );
  }

  const rbiPct = summary.compliance_rbi_csf.coverage_pct;
  const isoPct = summary.compliance_iso27001.coverage_pct;
  const avgCompliancePct = Math.round((rbiPct + isoPct) / 2);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* ── Page Header ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="page-eyebrow mb-1">
            {summary.org_name} · {t('dash.title')}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('dash.title')}
          </h1>
          <p className="text-base mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            {t('dash.subtitle')}{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{summary.org_name}</strong>{t('dash.subtitle2')}
          </p>
        </div>

        {/* Pillar Quick Links */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('pillar1')}
            className="btn-secondary px-3 py-1.5 text-xs rounded-full"
          >
            <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>{t('dash.riskby')}</span>
            <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button
            onClick={() => onNavigateTab('pillar2')}
            className="btn-secondary px-3 py-1.5 text-xs rounded-full"
          >
            <Network className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>{t('dash.howRisk')}</span>
            <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button
            onClick={() => onNavigateTab('pillar3')}
            className="btn-secondary px-3 py-1.5 text-xs rounded-full"
          >
            <Wallet className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>{t('dash.advisor')}</span>
            <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Hero Card — Annual Financial Exposure */}
        <div className="tarazu-card p-6 flex flex-col justify-between relative overflow-hidden" style={{ background: 'var(--risk-critical-bg)', borderColor: 'var(--risk-critical-border)' }}>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="section-label" style={{ color: 'var(--risk-critical)' }}>
                {t('dash.kpi.exposure')}
              </span>
              <button
                onClick={() => setShowEalExplainer(!showEalExplainer)}
                className="transition-colors"
                style={{ color: 'var(--risk-critical)' }}
                title="What does this mean?"
              >
                <Info className="w-4 h-4 opacity-70 hover:opacity-100" />
              </button>
            </div>
            <div className="metric-value mt-3" style={{ color: 'var(--risk-critical)' }}>
              {formatInr(summary.total_eal_inr)}
            </div>
            <span className="text-[11px] font-semibold mt-1 block" style={{ color: 'var(--risk-critical)', opacity: 0.85 }}>{t('dash.kpi.exposureTag')}</span>
          </div>

          <AnimatePresence mode="wait">
            {showEalExplainer ? (
              <motion.div 
                key="explainer"
                variants={slideUpVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative z-10 mt-5 p-4 rounded-xl text-sm leading-relaxed"
                style={{ background: 'var(--risk-critical)', color: '#ffffff' }}
              >
                {t('dash.exposure.explainer')}
              </motion.div>
            ) : (
              <motion.p
                key="desc"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs mt-4 leading-relaxed"
                style={{ color: 'var(--risk-critical)', opacity: 0.85 }}
              >
                {t('dash.kpi.exposureDesc')} <strong className="font-semibold">{summary.total_assets}</strong> {t('dash.kpi.exposureDesc2')}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Assets Monitored */}
        <div className="tarazu-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="section-label">{t('dash.kpi.monitored')}</span>
              <Layers className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="metric-value mt-3" style={{ color: 'var(--text-primary)' }}>
              {summary.total_assets}
            </div>
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('dash.kpi.monitoredDesc')} <strong style={{ color: 'var(--text-primary)' }}>{summary.sheets_breakdown.length}</strong> {t('dash.kpi.monitoredDesc2')}
          </p>
        </div>

        {/* Critical Vulnerabilities */}
        <div className="tarazu-card p-6 flex flex-col justify-between" style={{ borderLeft: '3px solid var(--risk-high)' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="section-label">{t('dash.kpi.critVulns')}</span>
              <AlertTriangle className="w-4 h-4" style={{ color: 'var(--risk-high)' }} />
            </div>
            <div className="metric-value mt-3" style={{ color: 'var(--text-primary)' }}>
              {summary.critical_vulnerabilities}
            </div>
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('dash.kpi.critVulnsDesc')}
          </p>
        </div>

        {/* Compliance Readiness */}
        <div className="tarazu-card p-6 flex flex-col justify-between" style={{ borderLeft: '3px solid var(--risk-low)' }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="section-label">{t('dash.kpi.compliance')}</span>
              <Shield className="w-4 h-4" style={{ color: 'var(--risk-low)' }} />
            </div>
            <div className="metric-value mt-3" style={{ color: 'var(--text-primary)' }}>
              {avgCompliancePct}%
            </div>
          </div>
          <div className="text-xs mt-3 flex items-center justify-between font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <span>RBI: {summary.compliance_rbi_csf.satisfied}/{summary.compliance_rbi_csf.total}</span>
            <span>ISO: {summary.compliance_iso27001.satisfied}/{summary.compliance_iso27001.total}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Infrastructure Segments ──────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{t('dash.sections.infra')}</h2>
          <button
            onClick={() => onNavigateTab('sheets')}
            className="text-xs font-semibold hover:underline flex items-center gap-1"
            style={{ color: 'var(--accent-primary)' }}
          >
            <span>{t('dash.sections.viewAll')}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.sheets_breakdown.map((s) => {
            const matchingSheet = sheets.find((item) => item.id === s.id);
            const pct = summary.total_eal_inr > 0
              ? Math.round((s.eal_inr / summary.total_eal_inr) * 100)
              : 0;
            return (
              <div
                key={s.id}
                onClick={() => {
                  if (matchingSheet) onSelectSheet(matchingSheet);
                }}
                className="tarazu-card p-5 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="section-label">{s.asset_count} {t('dash.segment.systems')}</span>
                    <span className="chip text-[10px]">
                      {s.type === 'combined' ? t('dash.segment.combined') : t('dash.segment.segment')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {s.name}
                  </h3>
                </div>
                <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{t('dash.segment.estimatedExposure')}</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatInr(s.eal_inr)}</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold mt-1.5 block" style={{ color: 'var(--text-muted)' }}>{pct}{t('dash.segment.ofTotal')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Bottom 2-col ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Top Risk Contributors */}
        <div className="tarazu-card p-0 overflow-hidden flex flex-col">
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-hover)' }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('dash.sections.topRisk')}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t('dash.sections.topRiskDesc')}</p>
            </div>
            <button
              onClick={() => onNavigateTab('sheets')}
              className="btn-ghost text-xs py-1.5 px-3"
            >
              {t('dash.sections.viewAll2')}
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {summary.top_risky_assets.map((asset, idx) => (
              <div key={asset.asset_id} className="p-4 flex items-center justify-between gap-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{asset.asset_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{asset.asset_type}</span>
                      {asset.top_cve && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold" style={{ background: 'var(--bg-page)', color: 'var(--text-muted)' }} title="Common Vulnerabilities and Exposures (CVE) identifier">
                          {asset.top_cve}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-sm font-bold block" style={{ color: 'var(--risk-critical)' }}>{formatInr(asset.eal_inr)}</span>
                  <span className="text-[11px] mt-0.5 block" style={{ color: 'var(--text-secondary)' }}>{asset.vuln_count} {asset.vuln_count === 1 ? t('dash.asset.weakness') : t('dash.asset.weaknesses')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Investment Recommendations */}
        <div className="tarazu-card p-0 overflow-hidden flex flex-col">
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-hover)' }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('dash.sections.topInvest')}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t('dash.sections.topInvestDesc')}</p>
            </div>
            <button
              onClick={() => onNavigateTab('pillar3')}
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
              style={{ color: 'var(--accent-secondary)' }}
            >
              <span>{t('dash.sections.fullAdvisor')}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {summary.top_roi_controls.map((ctrl, idx) => (
              <div key={ctrl.control_id} className="p-4 flex items-center justify-between gap-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{ctrl.control_name}</h4>
                    <span className="text-xs mt-0.5 block" style={{ color: 'var(--text-secondary)' }}>{t('dash.invest.cost')} {formatInr(ctrl.cost_inr)}</span>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="risk-badge-low text-[10px]">
                    {ctrl.roi_ratio.toFixed(1)}x {t('dash.invest.return')}
                  </span>
                  <span className="text-[11px] font-semibold mt-1 block" style={{ color: 'var(--text-muted)' }}>
                    {t('dash.invest.saves')} {formatInr(ctrl.risk_reduction_inr)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
