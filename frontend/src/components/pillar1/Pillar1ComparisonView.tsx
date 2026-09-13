import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, Building2, ShieldAlert, ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react';
import { DemoComparison } from '../../types';
import { api } from '../../services/api';
import { formatInr } from '../../utils/format';
import { useLanguage } from '../../i18n/LanguageContext';
import { containerVariants, itemVariants, slideUpVariants } from '../../utils/animations';

export const Pillar1ComparisonView: React.FC = () => {
  const [data, setData] = useState<DemoComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrace, setShowTrace] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const res = await api.getDemoComparison();
      setData(res);
    } catch (err) {
      console.error('Failed to load comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-32 text-center">
        <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>{t('pillar1.loading')}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Running business context analysis</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <span className="page-eyebrow mb-2">
          {t('pillar1.tag')}
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {t('pillar1.title')}
        </h1>
        <p className="text-base mt-3 max-w-3xl" style={{ color: 'var(--text-secondary)' }}>
          {t('pillar1.desc1')}{' '}
          <span className="font-bold" style={{ color: 'var(--risk-critical)' }}>{t('pillar1.criticalTag')}</span>{' '}
          {t('pillar1.desc2')}
        </p>
      </motion.div>

      {/* Shared Vulnerability Banner */}
      <motion.div variants={itemVariants} className="tarazu-card p-6" style={{ background: 'var(--bg-surface)', borderColor: 'var(--risk-critical-border)' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--risk-critical-bg)', border: '1px solid var(--risk-critical-border)' }}>
              <ShieldAlert className="w-6 h-6" style={{ color: 'var(--risk-critical)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold" style={{ color: 'var(--risk-critical)' }}>CVE-2023-4966</span>
                <span className="risk-badge-critical text-[10px]">
                  Severity 9.4 / 10
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Citrix Bleed — Unauthorized Session Hijacking</span>
              </div>
              <h3 className="font-bold text-lg mt-1" style={{ color: 'var(--text-primary)' }}>Core Banking Database Cluster (Oracle 19c)</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Same vulnerability — <strong style={{ color: 'var(--text-primary)' }}>30% revenue dependency</strong>, tagged as business-critical, unpatched for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>75 days</strong>.
              </p>
            </div>
          </div>
          <div className="text-right whitespace-nowrap">
            <span className="section-label block">{t('pillar1.sameVuln')}</span>
            <span className="risk-badge-low px-3 py-1 mt-2 inline-block">
              {t('pillar1.bothOrgs')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Side-by-Side Comparison */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Small Business Card */}
        <div className="tarazu-card p-8 flex flex-col justify-between transition-shadow hover:shadow-md">
          <div>
            <div className="flex items-center justify-between pb-5 border-b" style={{ borderColor: 'var(--border-dim)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-dim)', color: 'var(--text-secondary)' }}>
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{data.msme_org.name}</h3>
                  <span className="chip text-[10px] mt-1 inline-block">
                    Micro, Small & Medium Enterprise (MSME) · {data.msme_org.sector}
                  </span>
                </div>
              </div>
              <span className="section-label">Small Scale</span>
            </div>

            {/* Organization Profile */}
            <div className="grid grid-cols-2 gap-4 py-5 border-b text-sm" style={{ borderColor: 'var(--border-dim)' }}>
              <div>
                <span className="block mb-1" style={{ color: 'var(--text-secondary)' }}>Annual Revenue</span>
                <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>₹15 Crore</span>
              </div>
              <div>
                <span className="block mb-1" style={{ color: 'var(--text-secondary)' }}>Employees</span>
                <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{data.msme_org.employee_count} staff</span>
              </div>
            </div>

            {/* Calculated Exposure */}
            <div className="py-8">
              <span className="section-label">
                Estimated Annual Financial Exposure
              </span>
              <div className="metric-value mt-2" style={{ color: 'var(--text-primary)' }}>
                {formatInr(data.msme_eal_inr)}
              </div>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Exposure scaled to ₹15 Crore operational revenue. Contained breach impact without systemic financial contagion.
              </p>
            </div>

            {/* Key Factors */}
            <div className="space-y-3 pt-4">
              <span className="section-label block mb-3">Key Risk Factors:</span>
              {data.msme_rule_trace.slice(0, 3).map((r, i) => (
                <div key={i} className="text-sm p-3 rounded-xl flex justify-between items-center" style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-dim)' }}>
                  <span className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>{r.description}</span>
                  <span className="font-bold shrink-0 ml-3" style={{ color: 'var(--accent-primary)' }}>+{formatInr(r.contribution_inr)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Large Enterprise Card */}
        <div className="tarazu-card p-8 flex flex-col justify-between transition-all" style={{ background: 'var(--accent-subtle)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
          <div>
            <div className="flex items-center justify-between pb-5 border-b" style={{ borderColor: 'rgba(56, 189, 248, 0.2)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--accent-primary)', boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)' }}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--accent-primary)' }}>{data.enterprise_org.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', color: 'var(--accent-primary)' }}>
                    Enterprise · {data.enterprise_org.sector}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>Large Scale</span>
            </div>

            {/* Organization Profile */}
            <div className="grid grid-cols-2 gap-4 py-5 border-b text-sm" style={{ borderColor: 'rgba(56, 189, 248, 0.2)' }}>
              <div>
                <span className="block mb-1" style={{ color: 'var(--text-primary)', opacity: 0.7 }}>Annual Revenue</span>
                <span className="font-bold text-base" style={{ color: 'var(--accent-primary)' }}>₹5,000 Crore</span>
              </div>
              <div>
                <span className="block mb-1" style={{ color: 'var(--text-primary)', opacity: 0.7 }}>Employees</span>
                <span className="font-bold text-base" style={{ color: 'var(--accent-primary)' }}>8,500 staff</span>
              </div>
            </div>

            {/* Calculated Exposure */}
            <div className="py-8">
              <span className="text-xs uppercase font-bold tracking-wider" style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>
                Estimated Annual Financial Exposure
              </span>
              <div className="metric-value mt-2" style={{ color: 'var(--accent-primary)' }}>
                {formatInr(data.enterprise_eal_inr)}
              </div>
              <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-primary)', opacity: 0.8 }}>
                Exposure scaled to ₹5,000 Crore revenue, with high customer breach disclosure liability and regulatory penalty exposure.
              </p>
            </div>

            {/* Key Factors */}
            <div className="space-y-3 pt-4">
              <span className="text-xs font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--accent-primary)' }}>Key Risk Factors:</span>
              {data.enterprise_rule_trace.slice(0, 3).map((r, i) => (
                <div key={i} className="text-sm p-3 rounded-xl flex justify-between items-center" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', color: 'var(--accent-primary)' }}>
                  <span className="truncate font-medium">{r.description}</span>
                  <span className="font-bold shrink-0 ml-3">+{formatInr(r.contribution_inr)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scaling Ratio Callout */}
      <motion.div variants={itemVariants} className="p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm" style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-dim)' }}>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0" style={{ background: 'var(--accent-subtle)', border: '1px solid rgba(56, 189, 248, 0.2)', color: 'var(--accent-primary)' }}>
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              {data.scaling_factor}× Difference — Same Vulnerability
            </h3>
            <p className="text-sm mt-2 max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{data.explanation}</p>
          </div>
        </div>
        <button
          onClick={() => setShowTrace(!showTrace)}
          className="btn-primary shrink-0 flex items-center gap-2"
        >
          <span>{showTrace ? 'Hide' : 'See'} Breakdown</span>
          {showTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </motion.div>

      {/* Calculation Breakdown Table */}
      <AnimatePresence>
        {showTrace && (
          <motion.div 
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="tarazu-card p-8 space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Calculation Breakdown</h3>
              <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                Each row shows a risk factor and how much it contributes to the financial exposure for each organization.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 uppercase text-xs tracking-wider" style={{ borderColor: 'var(--border-dim)', color: 'var(--text-muted)' }}>
                    <th className="py-4 px-4 font-bold">Risk Factor</th>
                    <th className="py-4 px-4 text-right font-bold">Small Business Impact</th>
                    <th className="py-4 px-4 text-right font-bold">Enterprise Impact</th>
                    <th className="py-4 px-4 font-bold">Why Different?</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-dim)' }}>
                  {data.enterprise_rule_trace.map((entRule) => {
                    const msmeMatch = data.msme_rule_trace.find((m) => m.rule_id === entRule.rule_id);
                    return (
                      <tr key={entRule.rule_id} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="py-4 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{entRule.description}</td>
                        <td className="py-4 px-4 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {msmeMatch ? formatInr(msmeMatch.contribution_inr) : '—'}
                        </td>
                        <td className="py-4 px-4 text-right font-bold" style={{ color: 'var(--accent-primary)' }}>
                          {formatInr(entRule.contribution_inr)}
                        </td>
                        <td className="py-4 px-4 text-xs max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{entRule.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
