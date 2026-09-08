import React, { useState, useEffect } from 'react';
import { Layers, Plus, FileSpreadsheet, AlertTriangle, ShieldCheck, Cpu, ChevronRight, Eye } from 'lucide-react';
import { Sheet, Asset, CorrelationResult } from '../../types';
import { api } from '../../services/api';
import { RuleTraceModal } from '../common/RuleTraceModal';

interface SheetsViewProps {
  sheets: Sheet[];
  activeSheet: Sheet | null;
  onSelectSheet: (sheet: Sheet) => void;
  onRefreshSheets: () => void;
  onOpenIntakeModal: () => void;
}

export const SheetsView: React.FC<SheetsViewProps> = ({
  sheets,
  activeSheet,
  onSelectSheet,
  onRefreshSheets,
  onOpenIntakeModal,
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Trace Modal state
  const [activeTraceAsset, setActiveTraceAsset] = useState<Asset | null>(null);

  // Combine Sheet Modal
  const [showCombineModal, setShowCombineModal] = useState(false);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [combinedName, setCombinedName] = useState('');
  const [combining, setCombining] = useState(false);
  const [correlationResult, setCorrelationResult] = useState<CorrelationResult | null>(null);

  useEffect(() => {
    if (activeSheet) {
      loadAssets(activeSheet.id);
      if (activeSheet.type === 'combined') {
        loadCorrelation(activeSheet.id);
      } else {
        setCorrelationResult(null);
      }
    }
  }, [activeSheet]);

  const loadAssets = async (sheetId: string) => {
    try {
      setLoadingAssets(true);
      const data = await api.listAssets(sheetId);
      setAssets(data);
    } catch (err) {
      console.error('Failed to load sheet assets:', err);
    } finally {
      setLoadingAssets(false);
    }
  };

  const loadCorrelation = async (sheetId: string) => {
    try {
      const res = await api.getSheetCorrelation(sheetId);
      setCorrelationResult(res);
    } catch (err) {
      console.error('Failed to load correlation:', err);
    }
  };

  const handleCombineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSheet || selectedSourceIds.length < 2 || !combinedName.trim()) return;

    try {
      setCombining(true);
      const res = await api.combineSheets({
        org_id: activeSheet.org_id,
        name: combinedName.trim(),
        source_sheet_ids: selectedSourceIds,
      });
      setCorrelationResult(res);
      setShowCombineModal(false);
      onRefreshSheets();
    } catch (err: any) {
      alert(`Combine failed: ${err.message}`);
    } finally {
      setCombining(false);
    }
  };

  const formatInr = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate uppercase tracking-widest block mb-1">
            Segmented Asset Portfolios
          </span>
          <h1 className="font-editorial text-4xl md:text-5xl font-bold text-ink tracking-tight">
            Sheets & Asset Inventory
          </h1>
          <p className="text-slate text-base mt-1 max-w-2xl">
            Inspect individual assets, attached CVE vulnerabilities, and deterministic mathematical traces.
            Combine independent sheets to analyze cross-segment compounding risk vectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCombineModal(true)}
            className="px-4 py-2.5 rounded-pill bg-fog border border-mist text-ink text-xs font-semibold hover:bg-mist transition flex items-center gap-1.5 shadow-sm"
          >
            <Layers className="w-4 h-4 text-sienna" />
            <span>Create Combined Sheet</span>
          </button>
          <button
            onClick={onOpenIntakeModal}
            className="px-4 py-2.5 rounded-pill bg-ink text-paper text-xs font-semibold hover:bg-black transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-mist">
        {sheets.map((sheet) => {
          const isActive = activeSheet?.id === sheet.id;
          return (
            <button
              key={sheet.id}
              onClick={() => onSelectSheet(sheet)}
              className={`px-4 py-2 text-xs font-semibold rounded-pill transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-ink text-paper shadow-sm'
                  : 'bg-fog border border-mist text-slate hover:text-ink'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{sheet.name}</span>
              {sheet.type === 'combined' && (
                <span className="px-1.5 py-0.2 rounded-full bg-peach text-sienna text-[9px] uppercase font-bold">
                  Derived
                </span>
              )}
              {sheet.latest_eal_inr !== undefined && sheet.latest_eal_inr > 0 && (
                <span className="text-[10px] opacity-75 font-mono">({formatInr(sheet.latest_eal_inr)})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Correlation Agent Banner for Combined Sheets */}
      {correlationResult && (
        <div className="p-5 rounded-3xl bg-peach/50 border border-sienna/30 text-sienna space-y-2 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sienna/20">
                AI Correlation Agent Analysis
              </span>
              <span className="text-xs font-bold">
                {correlationResult.cross_edge_count} Cross-Segment Dependency Vectors
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sienna text-paper">
              {correlationResult.adjustment_pct > 0 ? `+${correlationResult.adjustment_pct}%` : `${correlationResult.adjustment_pct}%`} Compounding Risk
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 border-y border-sienna/20">
            <div>
              <span className="text-[11px] uppercase font-bold text-sienna/70 block">Naive Arithmetic Sum</span>
              <span className="font-editorial text-2xl font-bold text-ink">{formatInr(correlationResult.naive_sum_inr)}</span>
              <span className="text-[11px] text-sienna/80 block">Simple sum assuming 0 cross-segment lateral movement</span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-sienna/70 block">Interconnected Risk (Quantified)</span>
              <span className="font-editorial text-2xl font-bold text-sienna">{formatInr(correlationResult.adjusted_inr)}</span>
              <span className="text-[11px] text-sienna/80 block">Compounding factor accounted for lateral breach spread</span>
            </div>
          </div>

          {correlationResult.ai_narrative && (
            <p className="text-xs text-sienna/90 leading-relaxed italic">
              "{correlationResult.ai_narrative}"
            </p>
          )}
        </div>
      )}

      {/* Asset Inventory Table */}
      <div className="steep-card p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-editorial text-xl font-bold text-ink">{activeSheet?.name} Assets</h3>
            <p className="text-xs text-slate">Showing {assets.length} monitored assets with real-time EAL</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-fog border border-mist text-slate">
            {assets.length} Assets Registered
          </span>
        </div>

        {loadingAssets ? (
          <div className="py-16 text-center text-slate text-xs font-medium">Loading asset inventory...</div>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center text-slate text-xs">
            No assets registered in this sheet yet. Click "Add Asset" above to onboard an asset.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-mist text-slate uppercase">
                  <th className="py-3 px-3">Asset Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Criticality</th>
                  <th className="py-3 px-3">Rev Dep %</th>
                  <th className="py-3 px-3">Vulnerabilities</th>
                  <th className="py-3 px-3 text-right">Expected Annual Loss (₹)</th>
                  <th className="py-3 px-3 text-right">Explainability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {assets.map((asset) => {
                  const eal = asset.risk_score?.expected_annual_loss_inr || 0;
                  return (
                    <tr key={asset.id} className="hover:bg-fog/60 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-ink text-sm">{asset.name}</div>
                        {asset.metadata_json?.software && (
                          <div className="text-[11px] text-slate font-mono mt-0.5">
                            {asset.metadata_json.software} {asset.metadata_json.version}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate">{asset.asset_type}</td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          asset.criticality_tag === 'core_db' || asset.criticality_tag === 'payment_processing'
                            ? 'bg-crimson/10 text-crimson'
                            : 'bg-fog border border-mist text-slate'
                        }`}>
                          {asset.criticality_tag}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-ink">{asset.revenue_dependency_pct}%</td>
                      <td className="py-3.5 px-3">
                        {asset.vulnerabilities.length === 0 ? (
                          <span className="text-[11px] text-slate">No open CVEs</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {asset.vulnerabilities.map((v) => (
                              <span
                                key={v.id}
                                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  (v.cvss_score || 0) >= 9.0
                                    ? 'bg-crimson/15 text-crimson'
                                    : (v.cvss_score || 0) >= 7.0
                                    ? 'bg-amber/15 text-amber'
                                    : 'bg-mist text-slate'
                                }`}
                              >
                                {v.cve_id || 'Vuln'} {v.cvss_score ? `(${v.cvss_score})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-sm text-sienna block">{formatInr(eal)}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {asset.risk_score ? (
                          <button
                            onClick={() => setActiveTraceAsset(asset)}
                            className="px-3 py-1 rounded-pill bg-fog border border-mist text-ink hover:bg-mist text-[11px] font-semibold transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-slate" />
                            <span>Rule Trace</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rule Trace Modal */}
      {activeTraceAsset && activeTraceAsset.risk_score && (
        <RuleTraceModal
          isOpen={true}
          onClose={() => setActiveTraceAsset(null)}
          title={activeTraceAsset.name}
          subtitle={`Type: ${activeTraceAsset.asset_type} · Criticality: ${activeTraceAsset.criticality_tag} · ${activeTraceAsset.revenue_dependency_pct}% Revenue Dependency`}
          ealInr={activeTraceAsset.risk_score.expected_annual_loss_inr}
          ruleTrace={activeTraceAsset.risk_score.rule_trace}
          aiNarrative={activeTraceAsset.risk_score.ai_narrative}
          aiAdjustmentPct={activeTraceAsset.risk_score.ai_adjustment_pct}
          aiMode={activeTraceAsset.risk_score.ai_mode}
        />
      )}

      {/* Combine Sheet Modal */}
      {showCombineModal && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-mist shadow-elevated">
            <h3 className="font-editorial text-2xl font-bold text-ink mb-1">Create Combined Sheet</h3>
            <p className="text-xs text-slate mb-4">
              Select 2 or more base sheets. The AI Correlation Agent will analyze cross-segment network edges
              and compute compounding risk vs arithmetic naive sum.
            </p>

            <form onSubmit={handleCombineSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate uppercase block mb-1">Combined Sheet Name</label>
                <input
                  type="text"
                  placeholder="e.g. IT & Core Banking Interconnect"
                  value={combinedName}
                  onChange={(e) => setCombinedName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate uppercase block mb-2">Select Source Sheets to Combine (Min 2)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sheets.filter((s) => s.type === 'base').map((s) => {
                    const isChecked = selectedSourceIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          isChecked ? 'bg-peach/30 border-sienna/40' : 'bg-fog border-mist'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSourceIds([...selectedSourceIds, s.id]);
                              } else {
                                setSelectedSourceIds(selectedSourceIds.filter((id) => id !== s.id));
                              }
                            }}
                            className="rounded text-sienna accent-sienna"
                          />
                          <span className="font-semibold text-ink">{s.name}</span>
                        </div>
                        <span className="text-[11px] text-slate">{s.asset_count} assets</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-mist">
                <button
                  type="button"
                  onClick={() => setShowCombineModal(false)}
                  className="px-4 py-2 rounded-pill bg-fog border border-mist text-slate hover:text-ink font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={combining || selectedSourceIds.length < 2 || !combinedName.trim()}
                  className="px-5 py-2 rounded-pill bg-ink text-paper font-semibold hover:bg-black transition disabled:opacity-50"
                >
                  {combining ? 'Analyzing Interconnections...' : 'Combine & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
