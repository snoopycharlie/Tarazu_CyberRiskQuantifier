import React, { useState, useEffect } from 'react';
import {
  Building, Building2, ShieldAlert, ChevronDown, ChevronUp, TrendingUp
} from 'lucide-react';
import { DemoComparison } from '../../types';
import { api } from '../../services/api';
import { formatInr } from '../../utils/format';

export const Pillar1ComparisonView: React.FC = () => {
  const [data, setData] = useState<DemoComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrace, setShowTrace] = useState(false);

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
        <div className="w-10 h-10 border-4 border-cyber-blue/20 border-t-cyber-blue rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate font-medium">Comparing risk across organizations…</p>
        <p className="text-smoke text-xs mt-1">Running business context analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <span className="text-xs font-bold text-slate uppercase tracking-widest block mb-2">
          Why Context Matters
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-ink tracking-tight">
          Risk Changes With Business Size
        </h1>
        <p className="text-slate text-base mt-3 max-w-3xl">
          Traditional security scanners label the same vulnerability as{' '}
          <span className="font-bold text-risk-critical">"Critical"</span> for everyone.
          Tarazu goes further — it calculates the actual financial exposure based on your{' '}
          <strong className="text-ink">organization's size, revenue, and regulatory context</strong>.
        </p>
      </div>

      {/* Shared Vulnerability Banner */}
      <div className="tarazu-card p-6 bg-surface border-risk-critical-border">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-risk-critical-bg border border-risk-critical-border flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-risk-critical" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm font-bold text-risk-critical">CVE-2023-4966</span>
                <span className="px-2 py-0.5 rounded-full bg-risk-critical text-white text-xs font-bold">
                  Severity 9.4 / 10
                </span>
                <span className="text-sm text-slate">Citrix Bleed — Unauthorized Session Hijacking</span>
              </div>
              <h3 className="font-bold text-ink text-lg mt-1">Core Banking Database Cluster (Oracle 19c)</h3>
              <p className="text-sm text-slate mt-1">
                Same vulnerability — <strong>30% revenue dependency</strong>, tagged as business-critical, unpatched for{' '}
                <strong>75 days</strong>.
              </p>
            </div>
          </div>
          <div className="text-right whitespace-nowrap">
            <span className="text-xs text-slate block uppercase tracking-wider font-semibold">Same Vulnerability</span>
            <span className="text-xs font-semibold text-risk-low bg-risk-low-bg border border-risk-low-border px-3 py-1 rounded-full inline-block mt-2">
              Applied to Both Organizations
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Small Business Card */}
        <div className="tarazu-card p-8 flex flex-col justify-between hover:border-border-strong hover:shadow-md transition-all">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-border-dim">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border-dim flex items-center justify-center text-slate">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-lg">{data.msme_org.name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-2 border border-border-dim text-slate mt-1 inline-block">
                    Micro, Small & Medium Enterprise (MSME) · {data.msme_org.sector}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate uppercase tracking-wider">Small Scale</span>
            </div>

            {/* Organization Profile */}
            <div className="grid grid-cols-2 gap-4 py-5 border-b border-border-dim text-sm">
              <div>
                <span className="text-slate block mb-1">Annual Revenue</span>
                <span className="font-bold text-ink text-base">₹15 Crore</span>
              </div>
              <div>
                <span className="text-slate block mb-1">Employees</span>
                <span className="font-bold text-ink text-base">{data.msme_org.employee_count} staff</span>
              </div>
            </div>

            {/* Calculated Exposure */}
            <div className="py-8">
              <span className="text-xs uppercase font-bold tracking-wider text-slate">
                Estimated Annual Financial Exposure
              </span>
              <div className="text-4xl md:text-5xl font-bold text-ink mt-2 tracking-tight">
                {formatInr(data.msme_eal_inr)}
              </div>
              <p className="text-sm text-slate mt-3 leading-relaxed">
                Exposure scaled to ₹15 Crore operational revenue. Contained breach impact without systemic financial contagion.
              </p>
            </div>

            {/* Key Factors */}
            <div className="space-y-3 pt-4">
              <span className="text-xs font-bold text-slate uppercase tracking-wider block">Key Risk Factors:</span>
              {data.msme_rule_trace.slice(0, 3).map((r, i) => (
                <div key={i} className="text-sm p-3 rounded-xl bg-surface-2 border border-border-dim flex justify-between items-center">
                  <span className="text-ink truncate font-medium">{r.description}</span>
                  <span className="font-bold text-cyber-blue shrink-0 ml-3">+{formatInr(r.contribution_inr)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Large Enterprise Card */}
        <div className="tarazu-card p-8 flex flex-col justify-between bg-cyber-blue/5 border-cyber-blue/20 hover:border-cyber-blue/40 hover:shadow-glow-blue transition-all">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-cyber-blue/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyber-blue text-white shadow-glow-blue flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-cyber-blue text-lg">{data.enterprise_org.name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyber-blue/10 border border-cyber-blue/20 text-cyber-blue mt-1 inline-block">
                    Enterprise · {data.enterprise_org.sector}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-cyber-blue uppercase tracking-wider">Large Scale</span>
            </div>

            {/* Organization Profile */}
            <div className="grid grid-cols-2 gap-4 py-5 border-b border-cyber-blue/20 text-sm">
              <div>
                <span className="text-cyber-blue/70 block mb-1">Annual Revenue</span>
                <span className="font-bold text-cyber-blue text-base">₹5,000 Crore</span>
              </div>
              <div>
                <span className="text-cyber-blue/70 block mb-1">Employees</span>
                <span className="font-bold text-cyber-blue text-base">8,500 staff</span>
              </div>
            </div>

            {/* Calculated Exposure */}
            <div className="py-8">
              <span className="text-xs uppercase font-bold tracking-wider text-cyber-blue/80">
                Estimated Annual Financial Exposure
              </span>
              <div className="text-4xl md:text-5xl font-bold text-cyber-blue mt-2 tracking-tight">
                {formatInr(data.enterprise_eal_inr)}
              </div>
              <p className="text-sm text-cyber-blue/80 mt-3 leading-relaxed">
                Exposure scaled to ₹5,000 Crore revenue, with high customer breach disclosure liability and regulatory penalty exposure.
              </p>
            </div>

            {/* Key Factors */}
            <div className="space-y-3 pt-4">
              <span className="text-xs font-bold text-cyber-blue uppercase tracking-wider block">Key Risk Factors:</span>
              {data.enterprise_rule_trace.slice(0, 3).map((r, i) => (
                <div key={i} className="text-sm p-3 rounded-xl bg-white/10 dark:bg-black/10 border border-cyber-blue/20 flex justify-between text-cyber-blue items-center">
                  <span className="truncate font-medium">{r.description}</span>
                  <span className="font-bold shrink-0 ml-3">+{formatInr(r.contribution_inr)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scaling Ratio Callout */}
      <div className="p-8 rounded-2xl bg-surface-2 border border-border-dim flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-cyber-blue/10 border border-cyber-blue/20 text-cyber-blue flex items-center justify-center text-2xl font-bold shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-ink text-xl">
              {data.scaling_factor}× Difference — Same Vulnerability
            </h3>
            <p className="text-sm text-slate mt-2 max-w-2xl leading-relaxed">{data.explanation}</p>
          </div>
        </div>
        <button
          onClick={() => setShowTrace(!showTrace)}
          className="btn-primary shrink-0"
        >
          <span>{showTrace ? 'Hide' : 'See'} Breakdown</span>
          {showTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Calculation Breakdown Table */}
      {showTrace && (
        <div className="tarazu-card p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div>
            <h3 className="text-2xl font-bold text-ink tracking-tight">Calculation Breakdown</h3>
            <p className="text-sm text-slate mt-2">
              Each row shows a risk factor and how much it contributes to the financial exposure for each organization.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border-dim text-slate uppercase text-xs tracking-wider">
                  <th className="py-4 px-4 font-bold">Risk Factor</th>
                  <th className="py-4 px-4 text-right font-bold">Small Business Impact</th>
                  <th className="py-4 px-4 text-right font-bold">Enterprise Impact</th>
                  <th className="py-4 px-4 font-bold">Why Different?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dim">
                {data.enterprise_rule_trace.map((entRule) => {
                  const msmeMatch = data.msme_rule_trace.find((m) => m.rule_id === entRule.rule_id);
                  return (
                    <tr key={entRule.rule_id} className="hover:bg-surface-2 transition-colors">
                      <td className="py-4 px-4 font-semibold text-ink">{entRule.description}</td>
                      <td className="py-4 px-4 text-right font-medium text-slate">
                        {msmeMatch ? formatInr(msmeMatch.contribution_inr) : '—'}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-cyber-blue">
                        {formatInr(entRule.contribution_inr)}
                      </td>
                      <td className="py-4 px-4 text-slate text-xs max-w-xs leading-relaxed">{entRule.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
