import React from 'react';
import { X, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { RuleTraceItem } from '../../types';

interface RuleTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  ealInr: number;
  ruleTrace: RuleTraceItem[];
  aiNarrative?: string | null;
  aiAdjustmentPct?: number | null;
  aiMode?: string;
}

export const RuleTraceModal: React.FC<RuleTraceModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  ealInr,
  ruleTrace,
  aiNarrative,
  aiAdjustmentPct,
  aiMode,
}) => {
  if (!isOpen) return null;

  const formatInr = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full border border-mist shadow-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-mist bg-fog flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-peach text-sienna tracking-wide">
                EXPLAINABILITY TRACE
              </span>
              <span className="text-xs text-slate">Audit-Ready Mathematical Breakdown</span>
            </div>
            <h2 className="text-2xl font-bold text-ink mt-1">{title}</h2>
            {subtitle && <p className="text-xs text-slate mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-mist/60 hover:bg-mist flex items-center justify-center text-slate hover:text-ink transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Callout */}
        <div className="px-6 py-4 bg-peach/40 border-b border-peach/50 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-medium text-sienna tracking-wider">Quantified Financial Risk (EAL)</span>
            <div className="text-3xl font-bold text-sienna">{formatInr(ealInr)}</div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate block">Triggered Rules</span>
            <span className="text-lg font-bold text-ink">{ruleTrace.length} Active Rules</span>
          </div>
        </div>

        {/* AI Narrative if present */}
        {aiNarrative && (
          <div className="mx-6 mt-5 p-4 rounded-2xl bg-fog border border-mist flex items-start gap-3">
            <Cpu className="w-5 h-5 text-sienna shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                  {aiMode === 'ai_assisted' ? 'Groq Llama-3.3 Calibration' : 'Deterministic Rules Engine Summary'}
                </h4>
                {aiAdjustmentPct !== undefined && aiAdjustmentPct !== null && aiAdjustmentPct !== 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-peach text-sienna">
                    {aiAdjustmentPct > 0 ? `+${aiAdjustmentPct}%` : `${aiAdjustmentPct}%`} Bounded Calibration
                  </span>
                )}
              </div>
              <p className="text-sm text-ink/80 mt-1 leading-relaxed">{aiNarrative}</p>
            </div>
          </div>
        )}

        {/* Trace List */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3">
          <h3 className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">
            Deterministic Rule Sequence ({ruleTrace.length})
          </h3>
          {ruleTrace.map((rule, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-fog border border-mist hover:border-slate/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-mist text-ink">
                    {rule.rule_id}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    rule.rule_tier === 'sector' ? 'bg-amber/20 text-amber' : 'bg-slate/10 text-slate'
                  }`}>
                    {rule.rule_tier}
                  </span>
                </div>
                {rule.contribution_inr > 0 && (
                  <span className="text-sm font-bold text-sienna whitespace-nowrap">
                    +{formatInr(rule.contribution_inr)}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-semibold text-ink mt-2">{rule.description}</h4>
              <p className="text-xs text-slate mt-1 leading-normal">{rule.reason}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-fog border-t border-mist flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-pill bg-ink text-paper text-sm font-medium hover:bg-black transition"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
};
