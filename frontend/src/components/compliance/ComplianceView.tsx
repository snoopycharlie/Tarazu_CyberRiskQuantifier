import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { ComplianceSummary, Organization } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

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
  }, [currentOrg]);

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

  const activeFramework = FRAMEWORK_OPTIONS.find(f => f.id === framework);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate uppercase tracking-widest block mb-1">
            Regulatory Compliance
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-ink tracking-tight">
            {t('compliance.title')}
          </h1>
          <p className="text-slate text-base mt-1 max-w-2xl">
            {t('compliance.subtitle')}
          </p>
        </div>
      </div>

      {/* Framework Tabs */}
      <div className="flex flex-wrap gap-2">
        {FRAMEWORK_OPTIONS.map((fw) => (
          <button
            key={fw.id}
            onClick={() => setFramework(fw.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
              framework === fw.id
                ? 'bg-ink text-paper border-ink shadow-sm'
                : 'bg-fog border-mist text-slate hover:text-ink hover:border-slate/30'
            }`}
          >
            <div className="font-bold">{fw.label}</div>
            <div className={`text-[10px] mt-0.5 ${framework === fw.id ? 'text-paper/60' : 'text-slate/70'}`}>
              {fw.desc}
            </div>
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-sienna border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate text-sm font-medium">{t('compliance.loading')}</p>
          <p className="text-slate/60 text-xs mt-1">{t('compliance.loadingDesc')}</p>
        </div>
      ) : (
        <>
          {/* Readiness Score Card */}
          <div className="steep-card p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-mist">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate">{t('compliance.score')}</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <h3 className="text-4xl font-bold text-sienna">{data.coverage_pct}%</h3>
                  <span className="text-xs text-slate font-medium">
                    {data.satisfied} {t('compliance.of')} {data.total_clauses} {t('compliance.clauses')}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 max-w-md">
                <div className="w-full h-3 bg-mist rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sienna transition-all duration-500 rounded-full"
                    style={{ width: `${data.coverage_pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate mt-2 font-medium">
                  <span className="text-emerald font-semibold">{data.satisfied} {t('compliance.satisfied')}</span>
                  <span className="text-crimson font-semibold">{data.gaps} {t('compliance.gaps')}</span>
                </div>
              </div>
            </div>

            {/* Smart Summary */}
            {data.ai_narrative && (
              <div className="mt-5 p-4 rounded-2xl bg-peach/40 border border-sienna/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-sienna shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-sienna uppercase tracking-wider mb-1">
                    {t('compliance.aiSummary')}
                  </h4>
                  <p className="text-xs text-sienna/90 leading-relaxed">{data.ai_narrative}</p>
                </div>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-ink">{t('compliance.requirementsReview')}</h3>
            <div className="flex items-center gap-1 bg-fog p-1 rounded-pill border border-mist text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-pill font-medium transition ${
                  filterStatus === 'all' ? 'bg-ink text-paper' : 'text-slate hover:text-ink'
                }`}
              >
                {t('compliance.all')} ({data.total_clauses})
              </button>
              <button
                onClick={() => setFilterStatus('satisfied')}
                className={`px-3 py-1 rounded-pill font-medium transition ${
                  filterStatus === 'satisfied' ? 'bg-emerald text-paper' : 'text-slate hover:text-ink'
                }`}
              >
                {t('compliance.satisfied')} ({data.satisfied})
              </button>
              <button
                onClick={() => setFilterStatus('gap')}
                className={`px-3 py-1 rounded-pill font-medium transition ${
                  filterStatus === 'gap' ? 'bg-crimson text-paper' : 'text-slate hover:text-ink'
                }`}
              >
                {t('compliance.gaps')} ({data.gaps})
              </button>
            </div>
          </div>

          {/* Requirements Table */}
          <div className="steep-card p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-mist text-slate uppercase">
                    <th className="py-2.5 px-3">{t('compliance.col.clause')}</th>
                    <th className="py-2.5 px-3">{t('compliance.col.title')}</th>
                    <th className="py-2.5 px-3">{t('compliance.col.control')}</th>
                    <th className="py-2.5 px-3 text-center">{t('compliance.col.status')}</th>
                    <th className="py-2.5 px-3">{t('compliance.col.impact')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {filteredGaps.map((item) => (
                    <tr key={item.id} className="hover:bg-fog/60 transition">
                      <td className="py-3 px-3 font-mono font-bold text-ink">{item.clause_ref}</td>
                      <td className="py-3 px-3 font-semibold text-ink max-w-xs">{item.clause_title}</td>
                      <td className="py-3 px-3 text-slate">
                        {item.control_name ? (
                          <span className="font-medium text-ink">{item.control_name}</span>
                        ) : (
                          <span className="italic text-slate/80">{t('compliance.noControl')}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          item.status === 'satisfied'
                            ? 'bg-emerald/10 text-emerald'
                            : 'bg-crimson/10 text-crimson'
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
                      <td className="py-3 px-3 text-slate text-[11px]">
                        {item.status === 'satisfied' ? (
                          <span className="text-emerald">{t('compliance.met')}</span>
                        ) : (
                          <span className="text-crimson font-medium">{t('compliance.needsAttention')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
