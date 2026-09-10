import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Info } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { OptimizeResult, Organization } from '../../types';
import { api } from '../../services/api';
import { formatInr, formatInrCompact } from '../../utils/format';

interface Pillar3AdvisorViewProps {
  currentOrg: Organization | null;
}

export const Pillar3AdvisorView: React.FC<Pillar3AdvisorViewProps> = ({ currentOrg }) => {
  const [budget, setBudget] = useState(5000000); // ₹50 Lakh default
  const [optResult, setOptResult] = useState<OptimizeResult | null>(null);
  const [loadingOpt, setLoadingOpt] = useState(false);
  const [showHowCalculated, setShowHowCalculated] = useState(false);

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
        <p className="text-slate text-sm">Select an organization to view investment recommendations.</p>
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <span className="text-xs font-semibold text-slate uppercase tracking-widest block mb-1">
          Security Investment Planning
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-ink tracking-tight">
          Investment Advisor
        </h1>
        <p className="text-slate text-base mt-2 max-w-3xl">
          With limited security budget, where should you spend it for maximum impact?
          Set your available budget and see which security improvements give you the best return.
        </p>
      </div>

      {/* Budget Selector */}
      <div className="steep-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-mist">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate">Available Security Budget</span>
            <h3 className="text-3xl font-bold text-sienna mt-1">{formatInr(budget)}</h3>
            <p className="text-xs text-slate mt-0.5">
              Adjust the slider to see recommendations for different budget levels.
            </p>
          </div>
          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setBudget(preset.value)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition ${
                  budget === preset.value
                    ? 'bg-ink text-paper'
                    : 'bg-fog border border-mist text-slate hover:text-ink'
                }`}
              >
                {preset.label}
              </button>
            ))}
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
            className="w-full h-2 bg-mist rounded-lg appearance-none cursor-pointer accent-sienna"
          />
          <div className="flex justify-between text-[11px] text-slate mt-2 font-medium">
            <span>₹5 Lakh</span>
            <span>₹50 Lakh</span>
            <span>₹1 Crore</span>
            <span>₹2 Crore</span>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loadingOpt && (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-4 border-sienna border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate text-sm font-medium">Finding optimal security improvements…</p>
        </div>
      )}

      {/* Optimizer Results */}
      {!loadingOpt && optResult && (
        <>
          {/* KPI + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary KPI */}
            <div className="space-y-4">
              <div className="steep-card-peach p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-sienna/80">
                  Potential Exposure Reduction
                </span>
                <div className="text-4xl font-bold text-sienna mt-2">
                  {formatInr(optResult.total_risk_reduction_inr)}
                </div>
                <div className="mt-4 pt-4 border-t border-sienna/20 space-y-1.5 text-xs text-sienna font-medium">
                  <div className="flex justify-between">
                    <span>Budget Used:</span>
                    <span className="font-bold">{formatInr(optResult.total_cost_inr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Improvements Selected:</span>
                    <span className="font-bold">{optResult.selected_controls.length}</span>
                  </div>
                </div>
              </div>

              {/* AI Analysis — no "Groq" */}
              {optResult.ai_rationale && (
                <div className="steep-card p-5 bg-paper border-mist">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-sienna" />
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                      AI Investment Analysis
                    </h4>
                  </div>
                  <p className="text-xs text-ink/80 leading-relaxed">{optResult.ai_rationale}</p>
                </div>
              )}

              {/* How it was calculated */}
              <div className="steep-card p-4">
                <button
                  onClick={() => setShowHowCalculated(!showHowCalculated)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-slate" />
                    <span className="text-xs font-semibold text-slate">How was this calculated?</span>
                  </div>
                  {showHowCalculated ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate" />
                  )}
                </button>
                {showHowCalculated && (
                  <div className="mt-3 text-xs text-slate space-y-2 leading-relaxed border-t border-mist pt-3">
                    <p>
                      Each security improvement has an estimated implementation cost and a risk reduction value.
                      The advisor selects the combination of improvements that reduces your financial exposure the most
                      within your available budget.
                    </p>
                    <p>
                      This approach prioritizes high-impact, cost-efficient improvements first — so you get maximum
                      benefit from every rupee spent.
                    </p>
                    <p className="text-[11px] text-slate/70">
                      Technical note: Uses a greedy optimization algorithm based on the FAIR risk model.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Return on Security Investment Curve */}
            <div className="lg:col-span-2 steep-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-ink">
                      Return on Security Investment (ROSI) Curve
                    </h3>
                    <p className="text-xs text-slate mt-0.5">
                      Cumulative Capital Expenditure (CapEx) vs. cumulative risk exposure reduction
                    </p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={optResult.rosi_curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rosiGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbe1d1" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#fbe1d1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f2f2f3" />
                      <XAxis
                        dataKey="cumulative_investment_inr"
                        tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                        stroke="#777b86"
                        fontSize={11}
                      />
                      <YAxis
                        tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`}
                        stroke="#777b86"
                        fontSize={11}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatInr(Number(value)), 'Exposure Reduction']}
                        labelFormatter={(label: any) => `Investment: ${formatInr(Number(label))}`}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '16px',
                          border: '1px solid #f2f2f3',
                          fontSize: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative_risk_reduction_inr"
                        stroke="#5d2a1a"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#rosiGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate pt-3 border-t border-mist">
                <span>Steep curve = High-value early improvements (patch management, EDR)</span>
                <span>Flatter curve = Advanced controls with diminishing returns</span>
              </div>
            </div>
          </div>

          {/* Recommended Improvements Table */}
          <div className="steep-card p-6">
            <h3 className="text-xl font-bold text-ink mb-1">
              Recommended Security Improvements
            </h3>
            <p className="text-xs text-slate mb-4">
              These improvements provide the best return on your security investment within your budget.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-mist text-slate uppercase">
                    <th className="py-2.5 px-3">Improvement</th>
                    <th className="py-2.5 px-3 text-right">Implementation Cost</th>
                    <th className="py-2.5 px-3 text-right">Estimated Exposure Reduction</th>
                    <th className="py-2.5 px-3 text-right">Return on Investment</th>
                    <th className="py-2.5 px-3 text-center">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {optResult.selected_controls.map((c, idx) => (
                    <tr key={c.control_id} className="hover:bg-fog/60 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-ink">{c.control_name}</div>
                      </td>
                      <td className="py-3 px-3 text-right text-slate">{formatInr(c.cost_inr)}</td>
                      <td className="py-3 px-3 text-right font-bold text-sienna">
                        {formatInr(c.risk_reduction_inr)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold px-2 py-0.5 rounded-full bg-emerald/10 text-emerald">
                          {c.roi_ratio.toFixed(1)}× return
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-peach text-sienna">
                          Priority #{idx + 1}
                        </span>
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
