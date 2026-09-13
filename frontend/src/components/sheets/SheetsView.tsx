import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, FileSpreadsheet, Eye, Info } from 'lucide-react';
import { Sheet, Asset, CorrelationResult } from '../../types';
import { api } from '../../services/api';
import { RuleTraceModal } from '../common/RuleTraceModal';
import { formatInr } from '../../utils/format';
import { useLanguage } from '../../i18n/LanguageContext';
import { containerVariants, itemVariants } from '../../utils/animations';

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
  const { t } = useLanguage();

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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="page-eyebrow mb-2">
            {t('sheets.title')}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('sheets.title')}
          </h1>
          <p className="text-base mt-3 max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('sheets.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCombineModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border"
            style={{ 
              background: 'var(--bg-surface)', 
              borderColor: 'var(--border-subtle)', 
              color: 'var(--text-primary)' 
            }}
          >
            <Layers className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span>{t('sheets.createCombined')}</span>
          </button>
          <button
            onClick={onOpenIntakeModal}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>{t('sheets.addAsset')}</span>
          </button>
        </div>
      </motion.div>

      {/* Sheet Tabs */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 overflow-x-auto pb-3 pt-2 scrollbar-none border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {sheets.map((sheet) => {
          const isActive = activeSheet?.id === sheet.id;
          return (
            <button
              key={sheet.id}
              onClick={() => onSelectSheet(sheet)}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2.5 whitespace-nowrap border`}
              style={isActive ? {
                background: 'var(--accent-subtle)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
                boxShadow: 'var(--shadow-sm)'
              } : {
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              <FileSpreadsheet className="w-4 h-4" style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
              <span>{sheet.name}</span>
              {sheet.type === 'combined' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold" style={{
                  background: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  opacity: isActive ? 1 : 0.8
                }}>
                  {t('sheets.combined')}
                </span>
              )}
              {sheet.latest_eal_inr !== undefined && sheet.latest_eal_inr > 0 && (
                <span className="text-[11px] font-mono ml-1 opacity-70">
                  ({formatInr(sheet.latest_eal_inr)})
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Combined Risk Analysis Banner — for combined sheets */}
      <AnimatePresence>
        {correlationResult && (
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="tarazu-card p-6 space-y-4"
            style={{
              background: 'rgba(249, 115, 22, 0.05)',
              borderColor: 'rgba(249, 115, 22, 0.2)'
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: 'rgba(249, 115, 22, 0.2)', color: 'var(--risk-high)' }}>
                  {t('sheets.crossSegment')}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {correlationResult.cross_edge_count} {correlationResult.cross_edge_count !== 1 ? t('sheets.connectionPlural') : t('sheets.connections')}
                </span>
              </div>
              {correlationResult.adjustment_pct !== 0 && (
                <span className="text-sm font-bold px-3 py-1 rounded-full shadow-sm text-white" style={{ background: 'var(--risk-high)' }}>
                  +{correlationResult.adjustment_pct}{t('sheets.addRisk')}
                </span>
              )}
            </div>

            {/* Insight message */}
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--risk-high)', opacity: 0.7 }} />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {getCorrelationMessage(correlationResult)}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: 'rgba(249, 115, 22, 0.1)' }}>
              <div>
                <span className="section-label block mb-1">
                  Simple Sum (No Connections)
                </span>
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatInr(correlationResult.naive_sum_inr)}
                </span>
                <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)' }}>
                  What the exposure would be if systems were isolated
                </span>
              </div>
              <div>
                <span className="section-label block mb-1">
                  Connected Risk (Actual Estimate)
                </span>
                <span className="text-2xl font-bold" style={{ color: 'var(--risk-high)' }}>
                  {formatInr(correlationResult.adjusted_inr)}
                </span>
                <span className="text-xs mt-1 block" style={{ color: 'var(--text-muted)' }}>
                  {correlationResult.adjustment_pct === 0
                    ? 'Same as simple sum — connections do not amplify risk'
                    : 'Higher because breaches can spread between connected systems'}
                </span>
              </div>
            </div>

            {correlationResult.ai_narrative && (
              <p className="text-sm leading-relaxed italic border-t pt-4" style={{ color: 'var(--text-secondary)', borderColor: 'rgba(249, 115, 22, 0.1)' }}>
                "{correlationResult.ai_narrative}"
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset Inventory Table */}
      <motion.div variants={itemVariants} className="tarazu-card p-0 overflow-hidden">
        <div className="p-6 md:p-8 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface-hover)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{activeSheet?.name}</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {assets.length} system{assets.length !== 1 ? 's' : ''} in this segment — showing estimated annual financial exposure per system
              </p>
            </div>
            <span className="text-sm font-semibold px-3 py-1.5 rounded-lg border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
              {assets.length} Systems
            </span>
          </div>
        </div>

        {loadingAssets ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('general.loading')}</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="m-8 py-24 text-center text-sm rounded-xl border border-dashed" style={{ background: 'var(--bg-surface-hover)', borderColor: 'var(--border-strong)' }}>
            <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{t('sheets.noAssets')}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              {t('sheets.addFirst')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b-2 uppercase text-xs tracking-wider" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th className="py-4 px-6 font-bold">{t('sheets.col.system')}</th>
                  <th className="py-4 px-4 font-bold">{t('sheets.col.type')}</th>
                  <th className="py-4 px-4 font-bold">{t('sheets.col.criticality')}</th>
                  <th className="py-4 px-4 font-bold">Business Dependency</th>
                  <th className="py-4 px-4 font-bold">{t('sheets.col.weaknesses')}</th>
                  <th className="py-4 px-4 text-right font-bold">{t('sheets.col.exposure')}</th>
                  <th className="py-4 px-6 text-right font-bold">{t('sheets.col.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {assets.map((asset) => {
                  const eal = asset.risk_score?.expected_annual_loss_inr || 0;
                  return (
                    <tr key={asset.id} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="py-4 px-6">
                        <div className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{asset.name}</div>
                        {asset.metadata_json?.software && (
                          <div className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                            {asset.metadata_json.software} {asset.metadata_json.version}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>{asset.asset_type.replace(/_/g, ' ')}</td>
                      <td className="py-4 px-4">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={
                          asset.criticality_tag === 'core_db' || asset.criticality_tag === 'payment_processing'
                            ? { background: 'rgba(244, 63, 94, 0.1)', color: 'var(--risk-critical)' }
                            : { background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }
                        }>
                          {asset.criticality_tag.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{asset.revenue_dependency_pct}%</td>
                      <td className="py-4 px-4">
                        {asset.vulnerabilities.length === 0 ? (
                          <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--risk-low)' }}>No open vulnerabilities</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {asset.vulnerabilities.map((v) => (
                              <span
                                key={v.id}
                                title={v.description}
                                className="font-mono text-xs font-bold px-2 py-1 rounded"
                                style={
                                  (v.cvss_score || 0) >= 9.0
                                    ? { background: 'rgba(244, 63, 94, 0.1)', color: 'var(--risk-critical)' }
                                    : (v.cvss_score || 0) >= 7.0
                                    ? { background: 'rgba(249, 115, 22, 0.1)', color: 'var(--risk-high)' }
                                    : { background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }
                                }
                              >
                                {v.cve_id || 'Vuln'} {v.cvss_score ? `(${v.cvss_score})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-base block" style={{ color: eal > 0 ? 'var(--risk-high)' : 'var(--text-muted)' }}>
                          {formatInr(eal)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {asset.risk_score && asset.risk_score.rule_trace.length > 0 ? (
                          <button
                            onClick={() => setActiveTraceAsset(asset)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                          >
                            <Eye className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                            <span>{t('sheets.viewTrace')}</span>
                          </button>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl max-w-lg w-full p-8 border shadow-2xl" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
            <h3 className="text-2xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Combine Infrastructure Segments
            </h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Select 2 or more segments to combine into a single view. The system will analyze whether
              risk compounds across connected systems, or remains isolated.
            </p>

            <form onSubmit={handleCombineSubmit} className="space-y-6 text-sm">
              <div>
                <label className="section-label block mb-2">Combined View Name</label>
                <input
                  type="text"
                  placeholder="e.g. Corporate IT & Core Banking"
                  value={combinedName}
                  onChange={(e) => setCombinedName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border focus:ring-2 outline-none transition-all"
                  style={{ 
                    background: 'var(--bg-surface)', 
                    borderColor: 'var(--border-subtle)', 
                    color: 'var(--text-primary)' 
                  }}
                />
              </div>

              <div>
                <label className="section-label block mb-3">
                  Select Segments to Combine (at least 2)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                  {sheets.filter((s) => s.type === 'base').map((s) => {
                    const isChecked = selectedSourceIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all"
                        style={isChecked ? {
                          background: 'var(--accent-subtle)',
                          borderColor: 'var(--accent-primary)',
                          boxShadow: 'var(--shadow-sm)'
                        } : {
                          background: 'var(--bg-surface-hover)',
                          borderColor: 'var(--border-subtle)'
                        }}
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
                            className="w-4 h-4 rounded"
                            style={{ accentColor: 'var(--accent-primary)' }}
                          />
                          <span className="font-semibold" style={{ color: isChecked ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{s.name}</span>
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{s.asset_count} systems</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setShowCombineModal(false)}
                  className="px-5 py-2.5 rounded-lg border font-semibold transition-colors"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
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
    </motion.div>
  );
};
