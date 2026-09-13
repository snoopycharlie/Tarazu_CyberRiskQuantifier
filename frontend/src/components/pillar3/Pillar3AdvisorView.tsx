import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { OptimizeResult, Organization } from '../../types';
import { api } from '../../services/api';
import { formatInr } from '../../utils/format';
import { useLanguage } from '../../i18n/LanguageContext';
import { containerVariants, itemVariants, slideUpVariants } from '../../utils/animations';

interface Pillar3AdvisorViewProps {
  currentOrg: Organization | null;
}

export const Pillar3AdvisorView: React.FC<Pillar3AdvisorViewProps> = ({ currentOrg }) => {
  const [budget, setBudget] = useState(5000000); // ₹50 Lakh default
  const [optResult, setOptResult] = useState<OptimizeResult | null>(null);
  const [loadingOpt, setLoadingOpt] = useState(false);
  const [showHowCalculated, setShowHowCalculated] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (currentOrg) {
      loadOptimization();
    }
  }, [currentOrg, budget]);

  const loadOptimization = async () => {
    if (!currentOrg) return;
    try {
      setLoadingOpt(true);
      const opt = await api.optimizeControls(currentOrg.id, budget);
      setOptResult(opt);
    } catch (err) {
      console.error('Failed to load advisor data:', err);
    } finally {
      setLoadingOpt(false);
    }
  };

  if (!currentOrg) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select an organization to view investment recommendations.</p>
      </div>
    );
  }

  const BUDGET_PRESETS = [
    { value: 2500000, label: '₹25 Lakh' },
    { value: 5000000, label: '₹50 Lakh' },
    { value: 10000000, label: '₹1 Crore' },
    { value: 15000000, label: '₹1.5 Crore' },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <span className="page-eyebrow mb-1">
          {t('advisor.title')}
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {t('advisor.title')}
        </h1>
        <p className="text-base mt-2 max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
          {t('advisor.subtitle')}
        </p>
      </motion.div>

      {/* Budget Selector */}
      <motion.div variants={itemVariants} className="tarazu-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <span className="section-label">{t('advisor.budget')}</span>
            <h3 className="text-3xl font-bold mt-1" style={{ color: 'var(--accent-primary)' }}>{formatInr(budget)}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {t('advisor.budgetDesc')}
            </p>
          </div>
          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            {BUDGET_PRESETS.map((preset) => {
              const isActive = budget === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => setBudget(preset.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border"
                  style={isActive ? {
                    background: 'var(--accent-primary)',
                    borderColor: 'var(--accent-primary)',
                    color: 'white'
                  } : {
                    background: 'var(--bg-surface-hover)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <input
            type="range"
            min="500000"
            max="20000000"
            step="250000"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ 
              background: 'var(--border-subtle)',
              accentColor: 'var(--accent-primary)'
            }}
          />
          <div className="flex justify-between text-[11px] mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
            <span>₹5 Lakh</span>
            <span>₹50 Lakh</span>
            <span>₹1 Crore</span>
            <span>₹2 Crore</span>
          </div>
        </div>
      </motion.div>

      {/* Loading */}
      {loadingOpt && (
        <motion.div variants={itemVariants} className="py-12 text-center">
          <div className="w-8 h-8 border-4 rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('advisor.loading')}</p>
        </motion.div>
      )}

      {/* Optimizer Results */}
      {!loadingOpt && optResult && (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          {/* KPI + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Summary KPI */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="tarazu-card p-6" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>
                  {t('advisor.reduction')}
                </span>
                <div className="metric-value mt-2" style={{ color: 'var(--accent-primary)' }}>
                  {formatInr(optResult.total_risk_reduction_inr)}
                </div>
                <div className="mt-4 pt-4 border-t space-y-1.5 text-xs font-medium" style={{ borderColor: 'rgba(56, 189, 248, 0.2)', color: 'var(--accent-primary)' }}>
                  <div className="flex justify-between">
                    <span>{t('advisor.budgetUsed')}</span>
                    <span className="font-bold">{formatInr(optResult.total_cost_inr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('advisor.improvements')}</span>
                    <span className="font-bold">{optResult.selected_controls.length}</span>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              {optResult.ai_rationale && (
                <div className="tarazu-card p-5" style={{ background: 'var(--bg-surface-hover)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                      {t('advisor.aiAnalysis')}
                    </h4>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{optResult.ai_rationale}</p>
                </div>
              )}

              {/* How it was calculated */}
              <div className="tarazu-card p-4">
                <button
                  onClick={() => setShowHowCalculated(!showHowCalculated)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{t('advisor.howCalc')}</span>
                  </div>
                  {showHowCalculated ? (
                    <ChevronUp className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                  )}
                </button>
                <AnimatePresence>
                  {showHowCalculated && (
                    <motion.div 
                      variants={slideUpVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="mt-3 text-xs space-y-2 leading-relaxed border-t pt-3"
                      style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
                    >
                      <p>{t('advisor.calcDesc1')}</p>
                      <p>{t('advisor.calcDesc2')}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Return on Security Investment Curve */}
            <motion.div variants={itemVariants} className="lg:col-span-2 tarazu-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {t('advisor.rosiCurve')}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {t('advisor.rosiDesc')}
                    </p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={optResult.rosi_curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rosiGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis
                        dataKey="cumulative_investment_inr"
                        tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                        stroke="var(--text-muted)"
                        fontSize={11}
                      />
                      <YAxis
                        tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`}
                        stroke="var(--text-muted)"
                        fontSize={11}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatInr(Number(value)), t('advisor.reduction')]}
                        labelFormatter={(label: any) => `${t('advisor.budgetUsed')} ${formatInr(Number(label))}`}
                        contentStyle={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderRadius: '12px',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          boxShadow: 'var(--shadow-elevated)',
                        }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative_risk_reduction_inr"
                        stroke="var(--accent-primary)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#rosiGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-3 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>
                <span>{t('advisor.steep')}</span>
                <span>{t('advisor.flat')}</span>
              </div>
            </motion.div>
          </div>

          {/* Recommended Improvements Table */}
          <motion.div variants={itemVariants} className="tarazu-card p-0 overflow-hidden">
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface-hover)' }}>
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {t('advisor.improvements')}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t('advisor.subtitle')}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b uppercase" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th className="py-3 px-6">{t('advisor.table.improvement')}</th>
                    <th className="py-3 px-4 text-right">{t('advisor.table.cost')}</th>
                    <th className="py-3 px-4 text-right">{t('advisor.table.reduction')}</th>
                    <th className="py-3 px-4 text-right">{t('advisor.table.roi')}</th>
                    <th className="py-3 px-6 text-center">{t('advisor.table.priority')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {optResult.selected_controls.map((c, idx) => (
                    <tr key={c.control_id} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="py-4 px-6">
                        <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.control_name}</div>
                      </td>
                      <td className="py-4 px-4 text-right" style={{ color: 'var(--text-secondary)' }}>{formatInr(c.cost_inr)}</td>
                      <td className="py-4 px-4 text-right font-bold" style={{ color: 'var(--risk-critical)' }}>
                        {formatInr(c.risk_reduction_inr)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold risk-badge-low px-2 py-0.5">
                          {c.roi_ratio.toFixed(1)}× {t('general.return')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>
                          {t('advisor.priority')}{idx + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};
