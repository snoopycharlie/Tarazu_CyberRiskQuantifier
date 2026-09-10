import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, FileCheck, CheckCircle2, AlertTriangle, Sparkles, Filter } from 'lucide-react';
import { ComplianceSummary, Organization } from '../../types';
import { api } from '../../services/api';

interface ComplianceViewProps {
  currentOrg: Organization | null;
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({ currentOrg }) => {
  const [framework, setFramework] = useState<'RBI_CSF' | 'ISO27001'>('RBI_CSF');
  const [data, setData] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'satisfied' | 'gap'>('all');

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
      console.error('Failed to load compliance audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGaps = data?.gaps_list.filter((g) => {
    if (filterStatus === 'all') return true;
    return g.status === filterStatus;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate uppercase tracking-widest block mb-1">
            Regulatory Compliance
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-ink tracking-tight">
            Compliance Readiness
          </h1>
          <p className="text-slate text-base mt-1 max-w-2xl">
            See how your organization's current security controls align with India's Reserve Bank Cyber Security
            Framework (RBI CSF) and the international ISO 27001:2022 information security standard.
          </p>
        </div>

        {/* Framework Switcher Tabs */}
        <div className="flex items-center gap-2 bg-fog p-1 rounded-pill border border-mist">
          <button
            onClick={() => setFramework('RBI_CSF')}
            className={`px-4 py-2 rounded-pill text-xs font-semibold transition ${
              framework === 'RBI_CSF'
                ? 'bg-ink text-paper shadow-sm'
                : 'text-slate hover:text-ink'
            }`}
          >
            RBI Cyber Security Framework
          </button>
          <button
            onClick={() => setFramework('ISO27001')}
            className={`px-4 py-2 rounded-pill text-xs font-semibold transition ${
              framework === 'ISO27001'
                ? 'bg-ink text-paper shadow-sm'
                : 'text-slate hover:text-ink'
            }`}
          >
            ISO 27001:2022 Annex A
          </button>
        </div>
      </div>

      {loading || !data ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-sienna border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate text-sm font-medium">Checking compliance requirements…</p>
          <p className="text-slate/60 text-xs mt-1">Mapping security controls to framework clauses</p>
        </div>
      ) : (
        <>
          {/* Audit Readiness Progress Card */}
          <div className="steep-card p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-mist">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate">Framework Readiness Score</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <h3 className="text-4xl font-bold text-sienna">{data.coverage_pct}%</h3>
                  <span className="text-xs text-slate font-medium">
                    {data.satisfied} of {data.total_clauses} clauses satisfied
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
                  <span className="text-emerald font-semibold">{data.satisfied} Satisfied</span>
                  <span className="text-crimson font-semibold">{data.gaps} Unaddressed Gaps</span>
                </div>
              </div>
            </div>

            {/* AI Compliance Narrative */}
            {data.ai_narrative && (
              <div className="mt-5 p-4 rounded-2xl bg-peach/40 border border-sienna/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-sienna shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-sienna uppercase tracking-wider mb-1">
                    AI Compliance Summary
                  </h4>
                  <p className="text-xs text-sienna/90 leading-relaxed">{data.ai_narrative}</p>
                </div>
              </div>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-ink">Requirements Review</h3>
            <div className="flex items-center gap-1 bg-fog p-1 rounded-pill border border-mist text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-pill font-medium transition ${
                  filterStatus === 'all' ? 'bg-ink text-paper' : 'text-slate hover:text-ink'
                }`}
              >
                All ({data.total_clauses})
              </button>
              <button
                onClick={() => setFilterStatus('satisfied')}
                className={`px-3 py-1 rounded-pill font-medium transition ${
                  filterStatus === 'satisfied' ? 'bg-emerald text-paper' : 'text-slate hover:text-ink'
                }`}
              >
                Satisfied ({data.satisfied})
              </button>
              <button
                onClick={() => setFilterStatus('gap')}
                className={`px-3 py-1 rounded-pill font-medium transition ${
                  filterStatus === 'gap' ? 'bg-crimson text-paper' : 'text-slate hover:text-ink'
                }`}
              >
                Open Gaps ({data.gaps})
              </button>
            </div>
          </div>

          {/* Clause Table */}
          <div className="steep-card p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-mist text-slate uppercase">
                    <th className="py-2.5 px-3">Clause Reference</th>
                    <th className="py-2.5 px-3">Clause Title</th>
                    <th className="py-2.5 px-3">Mapped Security Control</th>
                    <th className="py-2.5 px-3 text-center">Audit Status</th>
                    <th className="py-2.5 px-3">Regulatory Impact</th>
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
                          <span className="italic text-slate/80">No corresponding control deployed</span>
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
                              <span>Satisfied</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Needs Attention</span>
                            </>
                          )}
                        </span>
                      </td>
                       <td className="py-3 px-3 text-slate text-[11px]">
                         {item.status === 'satisfied' ? (
                           <span className="text-emerald">Requirement Met</span>
                         ) : (
                           <span className="text-crimson font-medium">Needs Attention — may require remediation</span>
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
