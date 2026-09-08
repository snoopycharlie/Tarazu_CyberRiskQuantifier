import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, TrendingUp, Check, X, Shield, Cpu, RefreshCw, AlertCircle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';
import { Control, OptimizeResult, WhatIfResult, Organization } from '../../types';
import { api } from '../../services/api';

interface Pillar3AdvisorViewProps {
  currentOrg: Organization | null;
}

export const Pillar3AdvisorView: React.FC<Pillar3AdvisorViewProps> = ({ currentOrg }) => {
  const [budget, setBudget] = useState(5000000); // ₹50 Lakh default
  const [controls, setControls] = useState<Control[]>([]);
  const [optResult, setOptResult] = useState<OptimizeResult | null>(null);
  const [loadingOpt, setLoadingOpt] = useState(false);

  // What-If Simulation State
  const [toggledStatuses, setToggledStatuses] = useState<Record<string, string>>({});
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [loadingWhatIf, setLoadingWhatIf] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      loadControlsAndOptimize();
    }
  }, [currentOrg, budget]);

  const loadControlsAndOptimize = async () => {
    if (!currentOrg) return;
    try {
      setLoadingOpt(true);
      const [ctrls, opt] = await Promise.all([
        api.listControls(currentOrg.id),
        api.optimizeControls(currentOrg.id, budget),
      ]);
      setControls(ctrls);
      setOptResult(opt);

      // Initialize What-If state with actual control statuses
      const initToggles: Record<string, string> = {};
      ctrls.forEach((c) => {
        initToggles[c.id] = c.status;
      });
      setToggledStatuses(initToggles);
    } catch (err) {
      console.error('Failed to load optimizer data:', err);
    } finally {
      setLoadingOpt(false);
    }
  };

  const handleToggleControl = async (controlId: string, currentStatus: string) => {
    if (!currentOrg) return;
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    const updated = { ...toggledStatuses, [controlId]: newStatus };
    setToggledStatuses(updated);

    try {
      setLoadingWhatIf(true);
      const res = await api.whatIfSimulation(currentOrg.id, updated);
      setWhatIfResult(res);
    } catch (err) {
      console.error('What-If simulation failed:', err);
    } finally {
      setLoadingWhatIf(false);
    }
  };

  const formatInr = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-peach text-sienna tracking-wide">
            DEMO PILLAR #3
          </span>
          <span className="text-xs text-slate">Knapsack Optimization & Dynamic What-If</span>
        </div>
        <h1 className="font-editorial text-4xl md:text-5xl font-bold text-ink tracking-tight">
          Capital Allocation & ROSI Curves
        </h1>
        <p className="text-slate text-base mt-2 max-w-3xl">
          Cybersecurity budgets are finite. The greedy knapsack optimizer selects maximum risk-reducing controls
          per rupee invested, while the live What-If simulator demonstrates instantaneous financial recalibration.
        </p>
      </div>

      {/* SECTION 1: Interactive Knapsack Budget Optimizer */}
      <div className="space-y-6">
        <div className="steep-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-mist">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate">Investment Budget Slider</span>
              <h3 className="font-editorial text-3xl font-bold text-sienna mt-1">{formatInr(budget)}</h3>
              <p className="text-xs text-slate mt-0.5">Move slider to simulate different capital allocation envelopes.</p>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              {[2500000, 5000000, 10000000, 15000000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setBudget(preset)}
                  className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition ${
                    budget === preset
                      ? 'bg-ink text-paper'
                      : 'bg-fog border border-mist text-slate hover:text-ink'
                  }`}
                >
                  {formatInr(preset)}
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
              <span>₹5 Lakh (Minimum)</span>
              <span>₹50 Lakh (Typical Mid-Tier)</span>
              <span>₹1 Crore</span>
              <span>₹2 Crore (Enterprise Expansion)</span>
            </div>
          </div>
        </div>

        {/* Optimizer Output: ROSI Curve & Metrics */}
        {optResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KPI Summary Card */}
            <div className="space-y-4">
              <div className="steep-card-peach p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-sienna/80">Optimal Risk Reduction</span>
                <div className="font-editorial text-4xl font-bold text-sienna mt-2">
                  {formatInr(optResult.total_risk_reduction_inr)}
                </div>
                <div className="mt-4 pt-4 border-t border-sienna/20 flex justify-between text-xs text-sienna font-medium">
                  <span>Utilized Budget:</span>
                  <span className="font-bold">{formatInr(optResult.total_cost_inr)}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-sienna font-medium">
                  <span>Selected Controls:</span>
                  <span className="font-bold">{optResult.selected_controls.length} Security Controls</span>
                </div>
              </div>

              {/* AI Advisor Rationale */}
              {optResult.ai_rationale && (
                <div className="steep-card p-5 bg-paper border-mist">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-sienna" />
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                      {optResult.ai_mode === 'ai_assisted' ? 'Groq Advisor Tradeoff Analysis' : 'Rules-Based Optimization Summary'}
                    </h4>
                  </div>
                  <p className="text-xs text-ink/80 leading-relaxed">{optResult.ai_rationale}</p>
                </div>
              )}
            </div>

            {/* Recharts ROSI Curve */}
            <div className="lg:col-span-2 steep-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-ink">ROSI Investment Efficiency Curve</h3>
                    <p className="text-xs text-slate">Return on Security Investment: Cumulative CaPEx vs Cumulative Risk Reduction</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-fog border border-mist text-slate">
                    Diminishing Returns Frontier
                  </span>
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
                        formatter={(value: any) => [formatInr(Number(value)), 'Risk Reduction']}
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
                <span>Steepest slope = Highest ROI initial fixes (MFA, EDR)</span>
                <span>Flattening slope = Advanced edge controls (ZTNA, Red Teaming)</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Bundle Table */}
        {optResult && (
          <div className="steep-card p-6">
            <h3 className="font-editorial text-xl font-bold text-ink mb-3">Optimal Security Control Portfolio</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-mist text-slate uppercase">
                    <th className="py-2.5 px-3">Control Name</th>
                    <th className="py-2.5 px-3 text-right">Implementation Cost</th>
                    <th className="py-2.5 px-3 text-right">Quantified Risk Reduction</th>
                    <th className="py-2.5 px-3 text-right">ROI Ratio</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {optResult.selected_controls.map((c) => (
                    <tr key={c.control_id} className="hover:bg-fog/60 transition">
                      <td className="py-3 px-3 font-semibold text-ink">{c.control_name}</td>
                      <td className="py-3 px-3 text-right text-slate">{formatInr(c.cost_inr)}</td>
                      <td className="py-3 px-3 text-right font-bold text-sienna">{formatInr(c.risk_reduction_inr)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold px-2 py-0.5 rounded-full bg-emerald/10 text-emerald">
                          {c.roi_ratio.toFixed(1)}x
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-peach text-sienna">
                          Recommended
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Live What-If Simulation Panel */}
      <div className="steep-card p-6 border-slate/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-mist">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-ink text-paper tracking-wider">
                LIVE WHAT-IF ENGINE
              </span>
              <span className="text-xs text-slate">Instantaneous In-Memory Recalibration</span>
            </div>
            <h2 className="font-editorial text-2xl md:text-3xl font-bold text-ink mt-1">
              Toggle Controls & Measure Real-Time Financial Delta
            </h2>
            <p className="text-xs text-slate mt-0.5">
              Flip any control switch below. The engine re-quantifies all 32 assets and reports the net ₹ EAL impact instantly.
            </p>
          </div>
          {whatIfResult && (
            <div className="flex items-center gap-4 bg-fog p-3 rounded-2xl border border-mist">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate block">Simulation Delta</span>
                <span className={`text-xl font-editorial font-bold ${
                  whatIfResult.delta_inr >= 0 ? 'text-emerald' : 'text-crimson'
                }`}>
                  {whatIfResult.delta_inr >= 0 ? `-${formatInr(whatIfResult.delta_inr)}` : `+${formatInr(Math.abs(whatIfResult.delta_inr))}`}
                </span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                whatIfResult.delta_inr >= 0 ? 'bg-emerald/10 text-emerald' : 'bg-crimson/10 text-crimson'
              }`}>
                {whatIfResult.delta_inr >= 0 ? `▼ ${whatIfResult.delta_pct}%` : `▲ ${Math.abs(whatIfResult.delta_pct)}%`}
              </span>
            </div>
          )}
        </div>

        {/* Live Toggles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {controls.slice(0, 9).map((ctrl) => {
            const isPresent = toggledStatuses[ctrl.id] === 'present';
            return (
              <div
                key={ctrl.id}
                onClick={() => handleToggleControl(ctrl.id, toggledStatuses[ctrl.id] || ctrl.status)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  isPresent
                    ? 'bg-peach/30 border-sienna/30 text-sienna'
                    : 'bg-fog border-mist text-slate hover:border-slate/40'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <h4 className={`text-xs font-bold truncate ${isPresent ? 'text-sienna' : 'text-ink'}`}>
                    {ctrl.name}
                  </h4>
                  <span className="text-[11px] block mt-0.5">
                    Est. Cost: {formatInr(ctrl.cost_inr)}
                  </span>
                </div>
                {/* iOS-style toggle switch */}
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    isPresent ? 'bg-sienna' : 'bg-slate/30'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform transform absolute top-0.5 ${
                      isPresent ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* What-If Comparison Summary */}
        {whatIfResult && (
          <div className="mt-6 p-4 rounded-2xl bg-fog border border-mist flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate block">Original EAL</span>
                <span className="font-bold text-ink text-sm">{formatInr(whatIfResult.original_eal_inr)}</span>
              </div>
              <span className="text-slate font-bold">→</span>
              <div>
                <span className="text-slate block">Simulated New EAL</span>
                <span className="font-bold text-sienna text-sm">{formatInr(whatIfResult.new_eal_inr)}</span>
              </div>
            </div>
            <p className="text-slate text-[11px] max-w-md">
              Simulated state does not alter production compliance audits. Allows CISOs to demonstrate exact ROI to board committees before expenditure approval.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
