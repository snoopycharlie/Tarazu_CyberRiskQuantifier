import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, Cpu } from 'lucide-react';
import { RuleTraceItem } from '../../types';
import { backdropVariants, modalVariants } from '../../utils/animations';

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
  const formatInr = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
          style={{ background: 'rgba(8,14,26,0.75)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="tarazu-modal max-w-3xl w-full"
          >
            {/* Header */}
            <div
              className="px-6 py-5 flex items-start justify-between gap-4"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-md"
                    style={{
                      background: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      border: '1px solid var(--accent-primary)',
                    }}
                  >
                    Explainability Trace
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Audit-Ready Mathematical Breakdown
                  </span>
                </div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
                >
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-hover)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* EAL Callout */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{
                background: 'var(--risk-critical-bg)',
                borderBottom: '1px solid var(--risk-critical-border)',
              }}
            >
              <div>
                <p className="section-label mb-1" style={{ color: 'var(--risk-critical)' }}>
                  Quantified Financial Risk (EAL)
                </p>
                <div
                  className="metric-value"
                  style={{ color: 'var(--risk-critical)' }}
                >
                  {formatInr(ealInr)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>Triggered Rules</span>
                <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {ruleTrace.length} Active
                </span>
              </div>
            </div>

            {/* AI Narrative */}
            {aiNarrative && (
              <div className="mx-6 mt-5">
                <div
                  className="p-4 rounded-xl flex items-start gap-3"
                  style={{
                    background: 'var(--accent-subtle)',
                    border: '1px solid var(--accent-primary)',
                  }}
                >
                  <Cpu className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                        {aiMode === 'ai_assisted' ? 'Groq Llama-3.3 Calibration' : 'Deterministic Rules Engine Summary'}
                      </h4>
                      {aiAdjustmentPct !== undefined && aiAdjustmentPct !== null && aiAdjustmentPct !== 0 && (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                          style={{
                            background: 'var(--accent-subtle)',
                            color: 'var(--accent-primary)',
                            border: '1px solid var(--accent-primary)',
                          }}
                        >
                          {aiAdjustmentPct > 0 ? `+${aiAdjustmentPct}%` : `${aiAdjustmentPct}%`} Bounded Calibration
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {aiNarrative}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Trace List */}
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-2">
              <h3 className="section-label mb-3">
                Deterministic Rule Sequence ({ruleTrace.length})
              </h3>
              {ruleTrace.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl transition-all"
                  style={{
                    background: 'var(--bg-surface-hover)',
                    border: `1px solid var(--border-subtle)`,
                    borderLeft: `3px solid ${rule.rule_tier === 'sector' ? 'var(--risk-high)' : 'var(--accent-primary)'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-[11px] font-bold px-2 py-0.5 rounded"
                        style={{
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {rule.rule_id}
                      </span>
                      <span
                        className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                        style={
                          rule.rule_tier === 'sector'
                            ? { background: 'var(--risk-high-bg)', color: 'var(--risk-high)', border: '1px solid var(--risk-high-border)' }
                            : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }
                        }
                      >
                        {rule.rule_tier}
                      </span>
                    </div>
                    {rule.contribution_inr > 0 && (
                      <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--risk-critical)' }}>
                        +{formatInr(rule.contribution_inr)}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>
                    {rule.description}
                  </h4>
                  <p className="text-xs mt-1 leading-normal" style={{ color: 'var(--text-secondary)' }}>
                    {rule.reason}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 flex justify-end"
              style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-hover)' }}
            >
              <button onClick={onClose} className="btn-secondary">
                Close Trace
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
