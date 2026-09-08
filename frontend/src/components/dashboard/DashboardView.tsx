import React from 'react';
import { Shield, AlertTriangle, TrendingUp, Layers, ArrowUpRight, CheckCircle2, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { DashboardSummary, Sheet } from '../../types';

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
  if (loading || !summary) {
    return (
      <div className="py-24 text-center">
        <div className="w-12 h-12 border-4 border-sienna border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate font-medium">Quantifying organizational cyber risk profile...</p>
      </div>
    );
  }

  const formatInr = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Editorial Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate uppercase tracking-widest block mb-1">
            Executive Cyber Risk Posture
          </span>
          <h1 className="font-editorial text-4xl md:text-5xl font-bold text-ink tracking-tight">
            Financial Loss Quantification
          </h1>
          <p className="text-slate text-base mt-1 max-w-2xl">
            Mathematical quantification of cyber exposure for <strong>{summary.org_name}</strong> across all IT segments,
            mapping asset criticality and unpatched vulnerabilities directly to financial liability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('pillar1')}
            className="px-4 py-2 rounded-pill bg-fog border border-mist text-xs font-semibold text-ink hover:bg-mist transition flex items-center gap-1.5"
          >
            <span>Demo Pillar #1</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate" />
          </button>
          <button
            onClick={() => onNavigateTab('pillar2')}
            className="px-4 py-2 rounded-pill bg-fog border border-mist text-xs font-semibold text-ink hover:bg-mist transition flex items-center gap-1.5"
          >
            <span>Demo Pillar #2</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate" />
          </button>
          <button
            onClick={() => onNavigateTab('pillar3')}
            className="px-4 py-2 rounded-pill bg-fog border border-mist text-xs font-semibold text-ink hover:bg-mist transition flex items-center gap-1.5"
          >
            <span>Demo Pillar #3</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total EAL — Hero Card */}
        <div className="steep-card-peach p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-sienna/80">Expected Annual Loss</span>
              <span className="px-2 py-0.5 rounded-full bg-sienna/15 text-[11px] font-bold text-sienna">EAL</span>
            </div>
            <div className="font-editorial text-4xl font-bold text-sienna mt-4">
              {formatInr(summary.total_eal_inr)}
            </div>
          </div>
          <p className="text-xs text-sienna/80 mt-4 leading-relaxed">
            FAIR model annual loss expectancy based on 32 monitored assets and active CVE vulnerabilities.
          </p>
        </div>

        {/* Monitored Assets */}
        <div className="steep-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate">Monitored Assets</span>
              <Layers className="w-4 h-4 text-slate" />
            </div>
            <div className="font-editorial text-4xl font-bold text-ink mt-4">
              {summary.total_assets}
            </div>
          </div>
          <p className="text-xs text-slate mt-4">
            Spread across {summary.sheets_breakdown.length} infrastructure sheets (Core Banking, Cloud, IT).
          </p>
        </div>

        {/* Critical Vulnerabilities */}
        <div className="steep-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate">Critical CVEs (≥9.0)</span>
              <AlertTriangle className="w-4 h-4 text-crimson" />
            </div>
            <div className="font-editorial text-4xl font-bold text-crimson mt-4">
              {summary.critical_vulnerabilities}
            </div>
          </div>
          <p className="text-xs text-slate mt-4">
            High-exploitability vulnerabilities unpatched beyond policy SLA threshold.
          </p>
        </div>

        {/* Compliance Posture */}
        <div className="steep-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate">Compliance Audit</span>
              <Shield className="w-4 h-4 text-emerald" />
            </div>
            <div className="font-editorial text-4xl font-bold text-ink mt-4">
              {summary.compliance_rbi_csf.coverage_pct}%
            </div>
          </div>
          <div className="text-xs text-slate mt-4 flex items-center justify-between">
            <span>RBI CSF: {summary.compliance_rbi_csf.satisfied}/{summary.compliance_rbi_csf.total}</span>
            <span>ISO 27001: {summary.compliance_iso27001.satisfied}/{summary.compliance_iso27001.total}</span>
          </div>
        </div>
      </div>

      {/* Sheets Distribution Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl font-bold text-ink">Infrastructure Segments & Sheets</h2>
          <button
            onClick={() => onNavigateTab('sheets')}
            className="text-xs font-semibold text-sienna hover:underline flex items-center gap-1"
          >
            <span>Manage All Sheets</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.sheets_breakdown.map((s) => {
            const matchingSheet = sheets.find((item) => item.id === s.id);
            return (
              <div
                key={s.id}
                onClick={() => {
                  if (matchingSheet) {
                    onSelectSheet(matchingSheet);
                    onNavigateTab('sheets');
                  }
                }}
                className="steep-card p-5 cursor-pointer hover:border-slate/40 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate uppercase">{s.asset_count} Assets</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-fog border border-mist text-slate">
                      {s.type}
                    </span>
                  </div>
                  <h3 className="font-editorial text-lg font-bold text-ink mt-2 group-hover:text-sienna transition">
                    {s.name}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-mist flex items-center justify-between">
                  <span className="text-xs text-slate">Risk Exposure</span>
                  <span className="text-sm font-bold text-ink">{formatInr(s.eal_inr)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Tables: Top Riskiest Assets & Top Quick Wins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Riskiest Assets */}
        <div className="steep-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-editorial text-xl font-bold text-ink">Top Riskiest Assets</h2>
              <p className="text-xs text-slate">Assets driving maximum financial loss exposure</p>
            </div>
            <button
              onClick={() => onNavigateTab('sheets')}
              className="text-xs font-semibold text-slate hover:text-ink transition"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-mist">
            {summary.top_risky_assets.map((asset, idx) => (
              <div key={asset.asset_id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-fog border border-mist flex items-center justify-center text-xs font-bold text-slate">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-ink truncate">{asset.asset_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate">{asset.asset_type}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-crimson/10 text-crimson">
                        {asset.criticality_tag}
                      </span>
                      {asset.top_cve && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-mist text-slate">
                          {asset.top_cve}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-sm font-bold text-sienna block">{formatInr(asset.eal_inr)}</span>
                  <span className="text-[11px] text-slate">{asset.vuln_count} CVEs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Quick-Win Controls */}
        <div className="steep-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-editorial text-xl font-bold text-ink">Highest ROI Security Fixes</h2>
              <p className="text-xs text-slate">Knapsack optimized controls by capital efficiency</p>
            </div>
            <button
              onClick={() => onNavigateTab('pillar3')}
              className="text-xs font-semibold text-sienna hover:underline flex items-center gap-1"
            >
              <span>Optimizer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-mist">
            {summary.top_roi_controls.map((ctrl, idx) => (
              <div key={ctrl.control_id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-peach text-sienna flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-ink truncate">{ctrl.control_name}</h4>
                    <span className="text-xs text-slate">Cost: {formatInr(ctrl.cost_inr)}</span>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald/10 text-emerald block">
                    {ctrl.roi_ratio.toFixed(1)}x ROI
                  </span>
                  <span className="text-[11px] text-slate mt-0.5 block">
                    Reduces {formatInr(ctrl.risk_reduction_inr)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
