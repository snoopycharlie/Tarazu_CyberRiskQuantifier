import React, { useState, useEffect } from 'react';
import { Layers, Plus, FileSpreadsheet, Eye, Info } from 'lucide-react';
import { Sheet, Asset, CorrelationResult } from '../../types';
import { api } from '../../services/api';
import { RuleTraceModal } from '../common/RuleTraceModal';
import { formatInr } from '../../utils/format';

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
      alert(`Could not combine sheets: ${err.message}`);
    } finally {
      setCombining(false);
    }
  };

  // ─── Correlation banner message — handles 0% case gracefully ───────────────
  const getCorrelationMessage = (result: CorrelationResult): string => {
    if (result.cross_edge_count === 0) {
      return 'No cross-segment connections found between these systems. They appear to be isolated from each other — so risk does not compound.';
    }
    if (result.adjustment_pct === 0) {
      return `${result.cross_edge_count} cross-segment connections found, but the analysis shows no additional compounding risk between these segments.`;
    }
    return `${result.cross_edge_count} connections found between segments. Risk compounds because a breach in one system can propagate to the other.`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate uppercase tracking-widest block mb-1">
            Infrastructure Inventory
          </span>
          <h1 className="font-editorial text-4xl md:text-5xl font-bold text-ink tracking-tight">
            Assets & Infrastructure
          </h1>
          <p className="text-slate text-base mt-1 max-w-2xl">
            Review your systems and vulnerabilities, and see the estimated financial impact each one creates.
            Combine segments to analyze how risk compounds across connected systems.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCombineModal(true)}
            className="px-4 py-2.5 rounded-pill bg-fog border border-mist text-ink text-xs font-semibold hover:bg-mist transition flex items-center gap-1.5 shadow-sm"
          >
            <Layers className="w-4 h-4 text-sienna" />
            <span>Create Combined View</span>
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
                  Combined
                </span>
              )}
              {sheet.latest_eal_inr !== undefined && sheet.latest_eal_inr > 0 && (
                <span className="text-[10px] opacity-75 font-mono">
                  ({formatInr(sheet.latest_eal_inr)})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Combined Risk Analysis Banner — for combined sheets */}
      {correlationResult && (
        <div className="p-5 rounded-3xl bg-peach/50 border border-sienna/30 text-sienna space-y-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sienna/20">
                Combined Risk Analysis
              </span>
              <span className="text-xs font-medium text-sienna/90">
                {correlationResult.cross_edge_count} cross-segment connection{correlationResult.cross_edge_count !== 1 ? 's' : ''} found
              </span>
            </div>
            {correlationResult.adjustment_pct !== 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sienna text-paper">
                +{correlationResult.adjustment_pct}% additional risk from connections
              </span>
            )}
          </div>

          {/* Insight message */}
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-sienna/70" />
            <p className="text-xs text-sienna/90 leading-relaxed">
              {getCorrelationMessage(correlationResult)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-sienna/20">
            <div>
              <span className="text-[11px] uppercase font-bold text-sienna/70 block">
                Simple Sum (No Connections)
              </span>
              <span className="font-editorial text-2xl font-bold text-ink">
                {formatInr(correlationResult.naive_sum_inr)}
              </span>
              <span className="text-[11px] text-sienna/80 block">
                What the exposure would be if systems were isolated
              </span>
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-sienna/70 block">
                Connected Risk (Actual Estimate)
              </span>
              <span className="font-editorial text-2xl font-bold text-sienna">
                {formatInr(correlationResult.adjusted_inr)}
              </span>
              <span className="text-[11px] text-sienna/80 block">
                {correlationResult.adjustment_pct === 0
                  ? 'Same as simple sum — connections do not amplify risk'
                  : 'Higher because breaches can spread between connected systems'}
              </span>
            </div>
          </div>

          {correlationResult.ai_narrative && (
            <p className="text-xs text-sienna/90 leading-relaxed italic border-t border-sienna/20 pt-3">
              "{correlationResult.ai_narrative}"
            </p>
          )}
        </div>
      )}

      {/* Asset Inventory Table */}
      <div className="steep-card p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-editorial text-xl font-bold text-ink">{activeSheet?.name}</h3>
            <p className="text-xs text-slate">
              {assets.length} system{assets.length !== 1 ? 's' : ''} in this segment — showing estimated annual financial exposure per system
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-fog border border-mist text-slate">
            {assets.length} Systems
          </span>
        </div>

        {loadingAssets ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-sienna border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate text-sm font-medium">Loading your infrastructure…</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center text-slate text-sm">
            <p className="font-semibold text-ink">No systems registered yet.</p>
            <p className="text-xs mt-1 text-slate">
              Click <strong>"Add Asset"</strong> above to register a system or device to this segment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-mist text-slate uppercase">
                  <th className="py-3 px-3">System Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Criticality</th>
                  <th className="py-3 px-3">Business Dependency</th>
                  <th className="py-3 px-3">Known Vulnerabilities</th>
                  <th className="py-3 px-3 text-right">Est. Annual Exposure</th>
                  <th className="py-3 px-3 text-right">Calculation</th>
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
                          {asset.criticality_tag.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-ink">{asset.revenue_dependency_pct}%</td>
                      <td className="py-3.5 px-3">
                        {asset.vulnerabilities.length === 0 ? (
                          <span className="text-[11px] text-emerald font-medium">No open vulnerabilities</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {asset.vulnerabilities.map((v) => (
                              <span
                                key={v.id}
                                title={v.description}
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
                        <span className={`font-bold text-sm block ${eal > 0 ? 'text-sienna' : 'text-slate'}`}>
                          {formatInr(eal)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {asset.risk_score && asset.risk_score.rule_trace.length > 0 ? (
                          <button
                            onClick={() => setActiveTraceAsset(asset)}
                            className="px-3 py-1 rounded-pill bg-fog border border-mist text-ink hover:bg-mist text-[11px] font-semibold transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-slate" />
                            <span>See Calculation</span>
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
          subtitle={`Type: ${activeTraceAsset.asset_type} · Criticality: ${activeTraceAsset.criticality_tag.replace(/_/g, ' ')} · ${activeTraceAsset.revenue_dependency_pct}% Business Dependency`}
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
            <h3 className="font-editorial text-2xl font-bold text-ink mb-1">
              Combine Infrastructure Segments
            </h3>
            <p className="text-xs text-slate mb-4">
              Select 2 or more segments to combine into a single view. The system will analyze whether
              risk compounds across connected systems, or remains isolated.
            </p>

            <form onSubmit={handleCombineSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate uppercase block mb-1">Combined View Name</label>
                <input
                  type="text"
                  placeholder="e.g. Corporate IT & Core Banking"
                  value={combinedName}
                  onChange={(e) => setCombinedName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate uppercase block mb-2">
                  Select Segments to Combine (at least 2)
                </label>
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
                        <span className="text-[11px] text-slate">{s.asset_count} systems</span>
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
                  {combining ? 'Analyzing Connections…' : 'Combine & Analyze Risk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
