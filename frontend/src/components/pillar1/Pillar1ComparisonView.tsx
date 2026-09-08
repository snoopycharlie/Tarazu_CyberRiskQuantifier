import React, { useState, useEffect } from 'react';
import { Scale, Building, Building2, ArrowRight, ShieldAlert, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { DemoComparison, RuleTraceItem } from '../../types';
import { api } from '../../services/api';

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
      console.error('Failed to load demo comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatInr = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-sienna border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate">Simulating organizational scaling engine across MSME and Enterprise tiers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-peach text-sienna tracking-wide">
            DEMO PILLAR #1
          </span>
          <span className="text-xs text-slate">Organizational Context Sensitivity</span>
        </div>
        <h1 className="font-editorial text-4xl md:text-5xl font-bold text-ink tracking-tight">
          Identical Vulnerability · Divergent ₹ Risk
        </h1>
        <p className="text-slate text-base mt-2 max-w-3xl">
          Traditional scanners label a CVSS 9.4 CVE as simply <span className="font-bold text-crimson">"Critical"</span> for everyone.
          Tarazu replaces vague colors with mathematically sound Indian Rupee loss expectancies calibrated to revenue scale,
          employee footprint, and regulatory exposure.
        </p>
      </div>

      {/* Shared Vulnerability Banner */}
      <div className="steep-card p-6 bg-paper border-sienna/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-crimson/10 text-crimson flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-crimson">CVE-2023-4966</span>
                <span className="px-2 py-0.5 rounded-full bg-crimson text-paper text-xs font-bold">CVSS 9.4</span>
                <span className="text-xs text-slate">Citrix Bleed · Unauthenticated Session Hijacking</span>
              </div>
              <h3 className="font-bold text-ink text-base mt-1">Core Banking Database Cluster (Oracle 19c)</h3>
              <p className="text-xs text-slate mt-0.5">
                Asset parameters: <strong>30% Revenue Dependency</strong>, Tagged <code>core_db</code>, Unpatched for <strong>75 Days</strong>.
              </p>
            </div>
          </div>
          <div className="text-right whitespace-nowrap">
            <span className="text-xs text-slate block uppercase tracking-wider">Identical CVE Across Both Orgs</span>
            <span className="text-xs font-semibold text-emerald bg-emerald/10 px-3 py-1 rounded-full inline-block mt-1">
              Zero Parameter Discrepancy
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MSME Card */}
        <div className="steep-card p-6 border-slate/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-mist">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fog border border-mist flex items-center justify-center text-slate">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">{data.msme_org.name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-mist text-slate">
                    Tier: {data.msme_org.size_tier} · {data.msme_org.sector}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-slate">Small Scale</span>
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-2 gap-3 py-4 border-b border-mist text-xs">
              <div>
                <span className="text-slate block">Annual Revenue</span>
                <span className="font-bold text-ink text-sm">₹15.0 Crore</span>
              </div>
              <div>
                <span className="text-slate block">Employees</span>
                <span className="font-bold text-ink text-sm">{data.msme_org.employee_count} staff</span>
              </div>
            </div>

            {/* Calculated EAL */}
            <div className="py-6">
              <span className="text-xs uppercase font-bold tracking-wider text-slate">Expected Annual Loss (EAL)</span>
              <div className="font-editorial text-4xl font-bold text-ink mt-1">
                {formatInr(data.msme_eal_inr)}
              </div>
              <p className="text-xs text-slate mt-2">
                Single Loss Expectancy scaled to ₹15 Cr operational turnover. Manageable breach radius without systemic market contagion.
              </p>
            </div>

            {/* Top Rules Fired */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate uppercase tracking-wider block">Key Triggered Rules:</span>
              {data.msme_rule_trace.slice(0, 3).map((r, i) => (
                <div key={i} className="text-xs p-2 rounded-xl bg-fog border border-mist flex justify-between">
                  <span className="text-ink truncate font-medium">{r.description}</span>
                  <span className="font-bold text-sienna shrink-0 ml-2">+{formatInr(r.contribution_inr)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise Card */}
        <div className="steep-card-peach p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-sienna/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sienna text-paper flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-peach" />
                </div>
                <div>
                  <h3 className="font-bold text-sienna text-base">{data.enterprise_org.name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sienna/15 text-sienna">
                    Tier: {data.enterprise_org.size_tier} · {data.enterprise_org.sector}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-sienna">Tier-1 Scale</span>
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-2 gap-3 py-4 border-b border-sienna/20 text-xs text-sienna/90">
              <div>
                <span className="text-sienna/70 block">Annual Revenue</span>
                <span className="font-bold text-sienna text-sm">₹5,000 Crore</span>
              </div>
              <div>
                <span className="text-sienna/70 block">Employees</span>
                <span className="font-bold text-sienna text-sm">8,500 staff</span>
              </div>
            </div>

            {/* Calculated EAL */}
            <div className="py-6">
              <span className="text-xs uppercase font-bold tracking-wider text-sienna/80">Expected Annual Loss (EAL)</span>
              <div className="font-editorial text-4xl font-bold text-sienna mt-1">
                {formatInr(data.enterprise_eal_inr)}
              </div>
              <p className="text-xs text-sienna/80 mt-2">
                Single Loss Expectancy scaled to ₹5,000 Cr turnover, high customer breach disclosure liabilities, and RBI regulatory penalties.
              </p>
            </div>

            {/* Top Rules Fired */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-sienna uppercase tracking-wider block">Key Triggered Rules:</span>
              {data.enterprise_rule_trace.slice(0, 3).map((r, i) => (
                <div key={i} className="text-xs p-2 rounded-xl bg-white/60 border border-sienna/20 flex justify-between text-sienna">
                  <span className="truncate font-medium">{r.description}</span>
                  <span className="font-bold shrink-0 ml-2">+{formatInr(r.contribution_inr)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scaling Ratio Callout Banner */}
      <div className="p-6 rounded-3xl bg-fog border border-mist flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-peach text-sienna flex items-center justify-center font-editorial text-2xl font-bold shrink-0">
            {data.scaling_factor}x
          </div>
          <div>
            <h3 className="font-bold text-ink text-base">Mathematical Scaling Ratio ({data.scaling_factor}x)</h3>
            <p className="text-xs text-slate mt-1 max-w-2xl leading-relaxed">{data.explanation}</p>
          </div>
        </div>
        <button
          onClick={() => setShowTrace(!showTrace)}
          className="px-4 py-2.5 rounded-pill bg-ink text-paper text-xs font-semibold hover:bg-black transition flex items-center gap-2 whitespace-nowrap"
        >
          <span>{showTrace ? 'Hide' : 'Inspect'} Comparative Trace</span>
          {showTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Comparative Rule Trace Table */}
      {showTrace && (
        <div className="steep-card p-6 space-y-4 animate-in fade-in duration-200">
          <h3 className="font-editorial text-xl font-bold text-ink">Side-by-Side Deterministic Rule Sequence</h3>
          <p className="text-xs text-slate">Detailed breakdown showing exact mathematical parameters evaluated by the FAIR rules engine.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-mist text-slate uppercase">
                  <th className="py-2.5 px-3">Rule ID</th>
                  <th className="py-2.5 px-3">Rule Description</th>
                  <th className="py-2.5 px-3 text-right">MSME Impact</th>
                  <th className="py-2.5 px-3 text-right">Enterprise Impact</th>
                  <th className="py-2.5 px-3">Mathematical Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {data.enterprise_rule_trace.map((entRule) => {
                  const msmeMatch = data.msme_rule_trace.find((m) => m.rule_id === entRule.rule_id);
                  return (
                    <tr key={entRule.rule_id} className="hover:bg-fog/60 transition">
                      <td className="py-3 px-3 font-mono font-bold text-ink">{entRule.rule_id}</td>
                      <td className="py-3 px-3 font-medium text-ink">{entRule.description}</td>
                      <td className="py-3 px-3 text-right font-semibold text-slate">
                        {msmeMatch ? formatInr(msmeMatch.contribution_inr) : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-sienna">
                        {formatInr(entRule.contribution_inr)}
                      </td>
                      <td className="py-3 px-3 text-slate text-[11px] max-w-xs">{entRule.reason}</td>
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
