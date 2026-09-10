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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-slate uppercase tracking-widest block mb-2">
            Infrastructure Inventory
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-ink tracking-tight">
            Assets & Infrastructure
          </h1>
          <p className="text-slate text-base mt-3 max-w-2xl leading-relaxed">
            Review your systems and vulnerabilities, and see the estimated financial impact each one creates.
            Combine segments to analyze how risk compounds across connected systems.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCombineModal(true)}
            className="px-4 py-2 rounded-lg bg-surface hover:bg-surface-2 border border-border-dim text-ink text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
          >
            <Layers className="w-4 h-4 text-cyber-blue" />
            <span>Create Combined View</span>
          </button>
          <button
            onClick={onOpenIntakeModal}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-2 scrollbar-none border-b border-border-dim">
        {sheets.map((sheet) => {
          const isActive = activeSheet?.id === sheet.id;
          return (
            <button
              key={sheet.id}
              onClick={() => onSelectSheet(sheet)}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2.5 whitespace-nowrap border ${
                isActive
                  ? 'bg-cyber-blue/10 border-cyber-blue/30 text-cyber-blue shadow-sm'
                  : 'bg-surface hover:bg-surface-2 border-border-dim text-slate hover:text-ink'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${isActive ? 'text-cyber-blue' : 'text-slate'}`} />
              <span>{sheet.name}</span>
              {sheet.type === 'combined' && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${isActive ? 'bg-cyber-blue/20 text-cyber-blue' : 'bg-mist text-slate'}`}>
                  Combined
                </span>
              )}
              {sheet.latest_eal_inr !== undefined && sheet.latest_eal_inr > 0 && (
                <span className={`text-[11px] font-mono ml-1 ${isActive ? 'opacity-90' : 'opacity-70'}`}>
                  ({formatInr(sheet.latest_eal_inr)})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Combined Risk Analysis Banner — for combined sheets */}
      {correlationResult && (
        <div className="tarazu-card p-6 bg-risk-high/5 border-risk-high/20 text-ink space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-risk-high/20 text-risk-high">
                Combined Risk Analysis
              </span>
              <span className="text-sm font-medium text-ink">
                {correlationResult.cross_edge_count} cross-segment connection{correlationResult.cross_edge_count !== 1 ? 's' : ''} found
              </span>
            </div>
            {correlationResult.adjustment_pct !== 0 && (
              <span className="text-sm font-bold px-3 py-1 rounded-full bg-risk-high text-white shadow-sm">
                +{correlationResult.adjustment_pct}% additional risk from connections
              </span>
            )}
          </div>

          {/* Insight message */}
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-risk-high/70" />
            <p className="text-sm text-slate leading-relaxed">
              {getCorrelationMessage(correlationResult)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-risk-high/10">
            <div>
              <span className="text-xs uppercase font-bold text-slate block mb-1">
                Simple Sum (No Connections)
              </span>
              <span className="text-2xl font-bold text-ink">
                {formatInr(correlationResult.naive_sum_inr)}
              </span>
              <span className="text-xs text-slate mt-1 block">
                What the exposure would be if systems were isolated
              </span>
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-slate block mb-1">
                Connected Risk (Actual Estimate)
              </span>
              <span className="text-2xl font-bold text-risk-high">
                {formatInr(correlationResult.adjusted_inr)}
              </span>
              <span className="text-xs text-slate mt-1 block">
                {correlationResult.adjustment_pct === 0
                  ? 'Same as simple sum — connections do not amplify risk'
                  : 'Higher because breaches can spread between connected systems'}
              </span>
            </div>
          </div>

          {correlationResult.ai_narrative && (
            <p className="text-sm text-slate leading-relaxed italic border-t border-risk-high/10 pt-4">
              "{correlationResult.ai_narrative}"
            </p>
          )}
        </div>
      )}

      {/* Asset Inventory Table */}
      <div className="tarazu-card p-6 md:p-8 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h3 className="text-2xl font-bold text-ink tracking-tight">{activeSheet?.name}</h3>
            <p className="text-sm text-slate mt-1">
              {assets.length} system{assets.length !== 1 ? 's' : ''} in this segment — showing estimated annual financial exposure per system
            </p>
          </div>
          <span className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-surface-2 border border-border-dim text-slate">
            {assets.length} Systems
          </span>
        </div>

        {loadingAssets ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-4 border-cyber-blue/20 border-t-cyber-blue rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate text-sm font-medium">Loading your infrastructure…</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="py-24 text-center text-slate text-sm bg-surface-2 rounded-xl border border-dashed border-border-strong">
            <p className="font-semibold text-ink text-base">No systems registered yet.</p>
            <p className="text-sm mt-2 text-slate">
              Click <strong className="text-ink">"Add Asset"</strong> above to register a system or device to this segment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border-dim text-slate uppercase text-xs tracking-wider">
                  <th className="py-4 px-4 font-bold">System Name</th>
                  <th className="py-4 px-4 font-bold">Type</th>
                  <th className="py-4 px-4 font-bold">Criticality</th>
                  <th className="py-4 px-4 font-bold">Business Dependency</th>
                  <th className="py-4 px-4 font-bold">Known Vulnerabilities</th>
                  <th className="py-4 px-4 text-right font-bold">Est. Annual Exposure</th>
                  <th className="py-4 px-4 text-right font-bold">Calculation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dim">
                {assets.map((asset) => {
                  const eal = asset.risk_score?.expected_annual_loss_inr || 0;
                  return (
                    <tr key={asset.id} className="hover:bg-surface-2 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-ink text-base">{asset.name}</div>
                        {asset.metadata_json?.software && (
                          <div className="text-xs text-slate font-mono mt-1">
                            {asset.metadata_json.software} {asset.metadata_json.version}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate capitalize">{asset.asset_type.replace(/_/g, ' ')}</td>
                      <td className="py-4 px-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          asset.criticality_tag === 'core_db' || asset.criticality_tag === 'payment_processing'
                            ? 'bg-risk-critical/10 text-risk-critical'
                            : 'bg-surface-2 border border-border-dim text-slate'
                        }`}>
                          {asset.criticality_tag.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-ink">{asset.revenue_dependency_pct}%</td>
                      <td className="py-4 px-4">
                        {asset.vulnerabilities.length === 0 ? (
                          <span className="text-xs text-risk-low font-bold bg-risk-low/10 px-2 py-1 rounded">No open vulnerabilities</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {asset.vulnerabilities.map((v) => (
                              <span
                                key={v.id}
                                title={v.description}
                                className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                                  (v.cvss_score || 0) >= 9.0
                                    ? 'bg-risk-critical/10 text-risk-critical'
                                    : (v.cvss_score || 0) >= 7.0
                                    ? 'bg-risk-high/10 text-risk-high'
                                    : 'bg-surface-3 text-slate'
                                }`}
                              >
                                {v.cve_id || 'Vuln'} {v.cvss_score ? `(${v.cvss_score})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`font-bold text-base block ${eal > 0 ? 'text-risk-high' : 'text-slate'}`}>
                          {formatInr(eal)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {asset.risk_score && asset.risk_score.rule_trace.length > 0 ? (
                          <button
                            onClick={() => setActiveTraceAsset(asset)}
                            className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-2 border border-border-dim text-ink text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyber-blue" />
                            <span>See Calculation</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate">—</span>
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
          subtitle={`Type: ${activeTraceAsset.asset_type.replace(/_/g, ' ')} · Criticality: ${activeTraceAsset.criticality_tag.replace(/_/g, ' ')} · ${activeTraceAsset.revenue_dependency_pct}% Business Dependency`}
          ealInr={activeTraceAsset.risk_score.expected_annual_loss_inr}
          ruleTrace={activeTraceAsset.risk_score.rule_trace}
          aiNarrative={activeTraceAsset.risk_score.ai_narrative}
          aiAdjustmentPct={activeTraceAsset.risk_score.ai_adjustment_pct}
          aiMode={activeTraceAsset.risk_score.ai_mode}
        />
      )}

      {/* Combine Sheet Modal */}
      {showCombineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-lg w-full p-8 border border-border-dim shadow-2xl">
            <h3 className="text-2xl font-bold text-ink mb-2 tracking-tight">
              Combine Infrastructure Segments
            </h3>
            <p className="text-sm text-slate mb-6 leading-relaxed">
              Select 2 or more segments to combine into a single view. The system will analyze whether
              risk compounds across connected systems, or remains isolated.
            </p>

            <form onSubmit={handleCombineSubmit} className="space-y-6 text-sm">
              <div>
                <label className="font-bold text-slate uppercase text-xs tracking-wider block mb-2">Combined View Name</label>
                <input
                  type="text"
                  placeholder="e.g. Corporate IT & Core Banking"
                  value={combinedName}
                  onChange={(e) => setCombinedName(e.target.value)}
                  required
                  className="cyber-input"
                />
              </div>

              <div>
                <label className="font-bold text-slate uppercase text-xs tracking-wider block mb-3">
                  Select Segments to Combine (at least 2)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                  {sheets.filter((s) => s.type === 'base').map((s) => {
                    const isChecked = selectedSourceIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked ? 'bg-cyber-blue/5 border-cyber-blue/40 shadow-sm' : 'bg-surface-2 border-border-dim hover:border-border-strong'
                        }`}
                      >
                        <div className="flex items-center gap-3">
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
                            className="w-4 h-4 rounded border-border-strong text-cyber-blue focus:ring-cyber-blue/30"
                          />
                          <span className={`font-semibold ${isChecked ? 'text-cyber-blue' : 'text-ink'}`}>{s.name}</span>
                        </div>
                        <span className="text-xs text-slate font-medium">{s.asset_count} systems</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border-dim">
                <button
                  type="button"
                  onClick={() => setShowCombineModal(false)}
                  className="px-5 py-2.5 rounded-lg bg-surface hover:bg-surface-2 border border-border-dim text-slate hover:text-ink font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={combining || selectedSourceIds.length < 2 || !combinedName.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
