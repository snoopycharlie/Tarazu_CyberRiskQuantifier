import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { ComplianceSummary, Organization } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { containerVariants, itemVariants } from '../../utils/animations';

interface ComplianceViewProps {
  currentOrg: Organization | null;
}

type FrameworkId = 'RBI_CSF' | 'ISO27001' | 'HIPAA' | 'GDPR_DPDPA' | 'PCI_DSS' | 'NIST_CSF';

interface FrameworkOption {
  id: FrameworkId;
  label: string;
  desc: string;
  sector?: string; // highlight for certain sectors
}

const FRAMEWORK_OPTIONS: FrameworkOption[] = [
  { id: 'RBI_CSF',   label: 'RBI Cyber Security Framework', desc: 'For Indian banks & financial institutions' },
  { id: 'ISO27001',  label: 'ISO 27001:2022',               desc: 'International information security standard' },
  { id: 'HIPAA',     label: 'HIPAA Security Rule',          desc: 'US healthcare data protection', sector: 'Healthcare' },
  { id: 'GDPR_DPDPA',label: 'GDPR / India DPDP Act',       desc: 'Personal data protection regulations' },
  { id: 'PCI_DSS',   label: 'PCI DSS v4.0',                desc: 'Payment card industry security standard' },
  { id: 'NIST_CSF',  label: 'NIST CSF 2.0',                desc: 'US National cybersecurity framework' },
];

export const ComplianceView: React.FC<ComplianceViewProps> = ({ currentOrg }) => {
  const { t } = useLanguage();
  const [framework, setFramework] = useState<FrameworkId>('RBI_CSF');
  const [data, setData] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'satisfied' | 'gap'>('all');

  // Auto-select HIPAA for healthcare orgs
  useEffect(() => {
    if (currentOrg?.sector === 'Healthcare' && framework === 'RBI_CSF') {
      setFramework('HIPAA');
    }
  }, [currentOrg, framework]);

  useEffect(() => {
    if (currentOrg) {
      loadCompliance(framework);
    }
  }, [currentOrg, framework]);

  const loadCompliance = async (fw: string) => {
    if (!currentOrg) return;
    try {
      setLoading(true);
      const res = await api.getComplianceFramework(currentOrg.id, fw);
      setData(res);
    } catch (err) {
      console.error('Failed to load compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGaps = data?.gaps_list.filter((g) => {
    if (filterStatus === 'all') return true;
    return g.status === filterStatus;
  }) || [];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Editorial Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="page-eyebrow mb-1">
            Regulatory Compliance
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('compliance.title')}
          </h1>
          <p className="text-base mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            {t('compliance.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Framework Tabs */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {FRAMEWORK_OPTIONS.map((fw) => {
          const isActive = framework === fw.id;
          return (
            <button
              key={fw.id}
              onClick={() => setFramework(fw.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                isActive ? 'shadow-sm' : 'hover:border-slate-500/30'
              }`}
              style={isActive ? {
                background: 'var(--bg-elevated)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--text-primary)'
              } : {
                background: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              <div className="font-bold">{fw.label}</div>
              <div className="text-[10px] mt-0.5" style={{ opacity: isActive ? 0.7 : 0.6 }}>
                {fw.desc}
              </div>
            </button>
          );
        })}
      </motion.div>

      {loading || !data ? (
        <motion.div variants={itemVariants} className="py-24 text-center">
          <div className="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{t('compliance.loading')}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{t('compliance.loadingDesc')}</p>
        </motion.div>
      ) : (
        <>
          {/* Readiness Score Card */}
          <motion.div variants={itemVariants} className="tarazu-card p-6 border-l-4" style={{ borderLeftColor: 'var(--accent-primary)' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <span className="section-label">{t('compliance.score')}</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <h3 className="text-4xl font-bold" style={{ color: 'var(--accent-primary)' }}>{data.coverage_pct}%</h3>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {data.satisfied} {t('compliance.of')} {data.total_clauses} {t('compliance.clauses')}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 max-w-md">
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${data.coverage_pct}%`, background: 'var(--accent-primary)' }}
                  />
                </div>
                <div className="flex justify-between text-[11px] mt-2 font-medium">
                  <span className="font-semibold" style={{ color: 'var(--risk-low)' }}>{data.satisfied} {t('compliance.satisfied')}</span>
                  <span className="font-semibold" style={{ color: 'var(--risk-high)' }}>{data.gaps} {t('compliance.gaps')}</span>
                </div>
              </div>
            </div>

            {/* Smart Summary */}
            {data.ai_narrative && (
              <div className="mt-5 p-4 rounded-xl flex items-start gap-3" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-primary)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--accent-primary)' }}>
                    {t('compliance.aiSummary')}
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)', opacity: 0.9 }}>{data.ai_narrative}</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Filter Bar */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('compliance.requirementsReview')}</h3>
            <div className="flex items-center gap-1 p-1 rounded-full border text-xs" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  filterStatus === 'all' ? 'text-white' : 'hover:text-white'
                }`}
                style={filterStatus === 'all' ? { background: 'var(--accent-primary)' } : { color: 'var(--text-secondary)' }}
              >
                {t('compliance.all')} ({data.total_clauses})
              </button>
              <button
                onClick={() => setFilterStatus('satisfied')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  filterStatus === 'satisfied' ? 'text-black' : 'hover:text-white'
                }`}
                style={filterStatus === 'satisfied' ? { background: 'var(--risk-low)' } : { color: 'var(--text-secondary)' }}
              >
                {t('compliance.satisfied')} ({data.satisfied})
              </button>
              <button
                onClick={() => setFilterStatus('gap')}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  filterStatus === 'gap' ? 'text-black' : 'hover:text-white'
                }`}
                style={filterStatus === 'gap' ? { background: 'var(--risk-high)' } : { color: 'var(--text-secondary)' }}
              >
                {t('compliance.gaps')} ({data.gaps})
              </button>
            </div>
          </motion.div>

          {/* Requirements Table */}
          <motion.div variants={itemVariants} className="tarazu-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b uppercase" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th className="py-3 px-4">{t('compliance.col.clause')}</th>
                    <th className="py-3 px-4">{t('compliance.col.title')}</th>
                    <th className="py-3 px-4">{t('compliance.col.control')}</th>
                    <th className="py-3 px-4 text-center">{t('compliance.col.status')}</th>
                    <th className="py-3 px-4">{t('compliance.col.impact')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {filteredGaps.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="py-3 px-4 font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{item.clause_ref}</td>
                      <td className="py-3 px-4 font-semibold max-w-xs" style={{ color: 'var(--text-primary)' }}>{item.clause_title}</td>
                      <td className="py-3 px-4">
                        {item.control_name ? (
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.control_name}</span>
                        ) : (
                          <span className="italic" style={{ color: 'var(--text-muted)' }}>{t('compliance.noControl')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          item.status === 'satisfied' ? 'risk-badge-low' : 'risk-badge-high'
                        }`}>
                          {item.status === 'satisfied' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t('general.satisfied')}</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>{t('general.gap')}</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {item.status === 'satisfied' ? (
                          <span style={{ color: 'var(--risk-low)' }}>{t('compliance.met')}</span>
                        ) : (
                          <span className="font-medium" style={{ color: 'var(--risk-high)' }}>{t('compliance.needsAttention')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};
