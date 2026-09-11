import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  Shield, AlertTriangle, Layers, ChevronRight, TrendingDown, Network, Wallet,
  Info, ChevronDown, ChevronUp, ArrowUpRight
} from 'lucide-react';
import { DashboardSummary, Sheet } from '../../types';
import { formatInr } from '../../utils/format';
import { useLanguage } from '../../i18n/LanguageContext';

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
        <div className="w-12 h-12 border-4 border-sienna border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate font-medium">{t('general.preparing')}</p>
        <p className="text-slate/60 text-xs mt-1">{t('general.loadingOrg')}</p>
      </div>
    );
  }

  const rbiPct = summary.compliance_rbi_csf.coverage_pct;
  const isoPct = summary.compliance_iso27001.coverage_pct;
  const avgCompliancePct = Math.round((rbiPct + isoPct) / 2);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

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
          <span className="text-xs font-semibold text-slate uppercase tracking-widest block mb-1">
            {summary.org_name} · {t('dash.title')}
          </span>
          <h1 className="font-editorial text-4xl md:text-5xl font-bold text-ink tracking-tight">
            {t('dash.title')}
          </h1>
          <p className="text-slate text-base mt-1 max-w-2xl">
            {t('dash.subtitle')}{' '}
            <strong className="text-ink">{summary.org_name}</strong>{t('dash.subtitle2')}
          </p>
        </div>

        {/* Pillar Quick Links */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('pillar1')}
            className="px-3.5 py-2 rounded-pill bg-fog border border-mist text-xs font-semibold text-ink hover:bg-mist transition flex items-center gap-1.5"
          >
            <TrendingDown className="w-3.5 h-3.5 text-sienna" />
            <span>{t('dash.riskby')}</span>
            <ChevronRight className="w-3 h-3 text-slate" />
          </button>
          <button
            onClick={() => onNavigateTab('pillar2')}
            className="px-3.5 py-2 rounded-pill bg-fog border border-mist text-xs font-semibold text-ink hover:bg-mist transition flex items-center gap-1.5"
          >
            <Network className="w-3.5 h-3.5 text-sienna" />
            <span>{t('dash.howRisk')}</span>
            <ChevronRight className="w-3 h-3 text-slate" />
          </button>
          <button
            onClick={() => onNavigateTab('pillar3')}
            className="px-3.5 py-2 rounded-pill bg-fog border border-mist text-xs font-semibold text-ink hover:bg-mist transition flex items-center gap-1.5"
          >
            <Wallet className="w-3.5 h-3.5 text-sienna" />
            <span>{t('dash.advisor')}</span>
            <ChevronRight className="w-3 h-3 text-slate" />
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Hero Card — Annual Financial Exposure */}
        <div className="p-6 rounded-xl flex flex-col justify-between relative overflow-hidden bg-risk-critical/5 border border-risk-critical/20 shadow-soft">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-sienna/80">
                {t('dash.kpi.exposure')}
              </span>
              <button
                onClick={() => setShowEalExplainer(!showEalExplainer)}
                className="text-sienna/60 hover:text-sienna transition"
                title="What does this mean?"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="font-editorial text-4xl font-bold text-sienna mt-3">
              {formatInr(summary.total_eal_inr)}
            </div>
            <span className="text-[11px] text-sienna/70 font-medium">{t('dash.kpi.exposureTag')}</span>
          </div>

          {showEalExplainer && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="relative z-10 mt-5 p-4 rounded-xl text-sm leading-relaxed bg-risk-critical/10 border border-risk-critical/20 text-risk-critical/90"
            >
              {t('dash.exposure.explainer')}
            </motion.div>
          )}

          {!showEalExplainer && (
            <p className="text-xs text-sienna/70 mt-3 leading-relaxed">
              {t('dash.kpi.exposureDesc')} {summary.total_assets} {t('dash.kpi.exposureDesc2')}
            </p>
          )}
        </div>

        {/* Assets Monitored */}
        <div className="steep-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate">{t('dash.kpi.monitored')}</span>
              <Layers className="w-4 h-4 text-slate" />
            </div>
            <div className="font-editorial text-4xl font-bold text-ink mt-3">
              {summary.total_assets}
            </div>
          </div>
          <p className="text-xs text-slate mt-3">
            {t('dash.kpi.monitoredDesc')} {summary.sheets_breakdown.length} {t('dash.kpi.monitoredDesc2')}
          </p>
        </div>

        {/* Critical Vulnerabilities */}
        <div className="steep-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate">{t('dash.kpi.critVulns')}</span>
              <AlertTriangle className="w-4 h-4 text-crimson" />
            </div>
            <div className="font-editorial text-4xl font-bold text-crimson mt-3">
              {summary.critical_vulnerabilities}
            </div>
          </div>
          <p className="text-xs text-slate mt-3">
            {t('dash.kpi.critVulnsDesc')}
          </p>
        </div>

        {/* Compliance Readiness */}
        <div className="steep-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate">{t('dash.kpi.compliance')}</span>
              <Shield className="w-4 h-4 text-emerald" />
            </div>
            <div className="font-editorial text-4xl font-bold text-ink mt-3">
              {avgCompliancePct}%
            </div>
          </div>
          <div className="text-xs text-slate mt-3 flex items-center justify-between">
            <span>RBI CSF: {summary.compliance_rbi_csf.satisfied}/{summary.compliance_rbi_csf.total}</span>
            <span>ISO 27001: {summary.compliance_iso27001.satisfied}/{summary.compliance_iso27001.total}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Infrastructure Segments ──────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl font-bold text-ink">{t('dash.sections.infra')}</h2>
          <button
            onClick={() => onNavigateTab('sheets')}
            className="text-xs font-semibold text-sienna hover:underline flex items-center gap-1"
          >
            <span>{t('dash.sections.viewAll')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
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
                  if (matchingSheet) {
                    onSelectSheet(matchingSheet);
                  }
                }}
                className="steep-card p-5 cursor-pointer hover:border-slate/40 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate uppercase">{s.asset_count} {t('dash.segment.systems')}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-fog border border-mist text-slate">
                      {s.type === 'combined' ? t('dash.segment.combined') : t('dash.segment.segment')}
                    </span>
                  </div>
                  <h3 className="font-editorial text-lg font-bold text-ink mt-2 group-hover:text-sienna transition">
                    {s.name}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-mist">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate">{t('dash.segment.estimatedExposure')}</span>
                    <span className="text-sm font-bold text-ink">{formatInr(s.eal_inr)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-mist rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sienna/60 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate mt-1 block">{pct}{t('dash.segment.ofTotal')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Bottom 2-col ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Top Risk Contributors */}
        <div className="steep-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-editorial text-xl font-bold text-ink">{t('dash.sections.topRisk')}</h2>
              <p className="text-xs text-slate mt-0.5">{t('dash.sections.topRiskDesc')}</p>
            </div>
            <button
              onClick={() => onNavigateTab('sheets')}
              className="text-xs font-semibold text-slate hover:text-ink transition"
            >
              {t('dash.sections.viewAll2')}
            </button>
          </div>
          <div className="divide-y divide-mist">
            {summary.top_risky_assets.map((asset, idx) => (
              <div key={asset.asset_id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-fog border border-mist flex items-center justify-center text-xs font-bold text-slate shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-ink truncate">{asset.asset_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate">{asset.asset_type}</span>
                      {asset.top_cve && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-mist text-slate" title="Common Vulnerabilities and Exposures (CVE) identifier">
                          {asset.top_cve}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-sm font-bold text-sienna block">{formatInr(asset.eal_inr)}</span>
                  <span className="text-[11px] text-slate">{asset.vuln_count} {asset.vuln_count === 1 ? t('dash.asset.weakness') : t('dash.asset.weaknesses')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Investment Recommendations */}
        <div className="steep-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-editorial text-xl font-bold text-ink">{t('dash.sections.topInvest')}</h2>
              <p className="text-xs text-slate mt-0.5">{t('dash.sections.topInvestDesc')}</p>
            </div>
            <button
              onClick={() => onNavigateTab('pillar3')}
              className="text-xs font-semibold text-sienna hover:underline flex items-center gap-1"
            >
              <span>{t('dash.sections.fullAdvisor')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-mist">
            {summary.top_roi_controls.map((ctrl, idx) => (
              <div key={ctrl.control_id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-peach text-sienna flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-ink truncate">{ctrl.control_name}</h4>
                    <span className="text-xs text-slate">{t('dash.invest.cost')} {formatInr(ctrl.cost_inr)}</span>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald/10 text-emerald block">
                    {ctrl.roi_ratio.toFixed(1)}x {t('dash.invest.return')}
                  </span>
                  <span className="text-[11px] text-slate mt-0.5 block">
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
