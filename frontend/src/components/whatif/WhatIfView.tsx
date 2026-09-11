import React, { useState, useEffect } from 'react';
import { Sliders, TrendingDown, TrendingUp, RefreshCw, Info, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Control, WhatIfResult, Organization } from '../../types';
import { api } from '../../services/api';
import { formatInr } from '../../utils/format';
import { useLanguage } from '../../i18n/LanguageContext';

interface WhatIfViewProps {
  currentOrg: Organization | null;
}

export const WhatIfView: React.FC<WhatIfViewProps> = ({ currentOrg }) => {
  const [controls, setControls] = useState<Control[]>([]);
  const [toggledStatuses, setToggledStatuses] = useState<Record<string, string>>({});
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [loadingControls, setLoadingControls] = useState(false);
  const [loadingWhatIf, setLoadingWhatIf] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (currentOrg) {
      loadControls();
    }
  }, [currentOrg]);

  const loadControls = async () => {
    if (!currentOrg) return;
    try {
      setLoadingControls(true);
      const ctrls = await api.listControls(currentOrg.id);
      setControls(ctrls);
      const initToggles: Record<string, string> = {};
      ctrls.forEach((c) => {
        initToggles[c.id] = c.status;
      });
      setToggledStatuses(initToggles);
    } catch (err) {
      console.error('Failed to load controls:', err);
    } finally {
      setLoadingControls(false);
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

  const handleResetToggles = async () => {
    if (!currentOrg) return;
    const reset: Record<string, string> = {};
    controls.forEach((c) => {
      reset[c.id] = c.status;
    });
    setToggledStatuses(reset);
    setWhatIfResult(null);
  };

  // Group controls by status
  const absentControls = controls.filter((c) => c.status === 'absent' || c.status === 'partial');
  const presentControls = controls.filter((c) => c.status === 'present');

  const hasChanges = controls.some((c) => toggledStatuses[c.id] !== c.status);

  if (loadingControls) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-sienna border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate font-medium">{t('general.loading')}</p>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="py-24 text-center">
        <Sliders className="w-12 h-12 text-slate/40 mx-auto mb-4" />
        <p className="text-slate text-sm">Select an organization to run a What-If scenario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate uppercase tracking-widest block mb-1">
            {t('whatif.tag')}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-ink tracking-tight">
            {t('whatif.title')}
          </h1>
          <p className="text-slate text-base mt-1 max-w-2xl">
            {t('whatif.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleResetToggles}
              className="px-4 py-2.5 rounded-pill bg-fog border border-mist text-ink text-xs font-semibold hover:bg-mist transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('whatif.reset')}</span>
            </button>
          )}
        </div>
      </div>

      {/* How It Works — expandable */}
      <div className="steep-card p-5">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sienna" />
            <span className="text-sm font-semibold text-ink">{t('whatif.howWorks')}</span>
          </div>
          {showHowItWorks ? (
            <ChevronUp className="w-4 h-4 text-slate" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate" />
          )}
        </button>
        {showHowItWorks && (
          <div className="mt-4 text-xs text-slate leading-relaxed space-y-2 border-t border-mist pt-4">
            <p>
              Each security control in your organization reduces your estimated financial exposure by a certain amount.
              When you toggle a control:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-ink">Turning a control ON</strong> simulates what happens if you implement that security measure.</li>
              <li><strong className="text-ink">Turning a control OFF</strong> shows the exposure increase if a control is removed or fails.</li>
            </ul>
            <p>
              The simulation recalculates your estimated annual financial exposure in real-time based on the FAIR risk model.
              This analysis does not change your actual configuration — it is purely for planning purposes.
            </p>
          </div>
        )}
      </div>

      {/* Results Banner — visible when changes are made */}
      {whatIfResult && (
        <div className="p-6 rounded-3xl bg-peach/50 border border-sienna/30 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-sienna uppercase tracking-wider">
                {loadingWhatIf ? t('whatif.recalculating') : t('whatif.result')}
              </span>
              <h2 className="text-3xl font-bold text-sienna mt-1">
                {whatIfResult.delta_inr >= 0
                  ? `${t('whatif.save')} ${formatInr(whatIfResult.delta_inr)}`
                  : `${t('whatif.moreExposure')} ${formatInr(Math.abs(whatIfResult.delta_inr))}`}
              </h2>
              <p className="text-xs text-sienna/80 mt-1">
                {whatIfResult.delta_inr >= 0
                  ? `Your estimated annual exposure reduces by ${whatIfResult.delta_pct.toFixed(1)}%`
                  : `Your estimated annual exposure increases by ${Math.abs(whatIfResult.delta_pct).toFixed(1)}%`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[11px] uppercase font-bold text-sienna/70 block">{t('whatif.before')}</div>
                <div className="text-xl font-bold text-ink">
                  {formatInr(whatIfResult.original_eal_inr)}
                </div>
                <div className="text-[11px] text-sienna/70">{t('whatif.currentExposure')}</div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-sienna/50" />
              </div>
              <div>
                <div className="text-[11px] uppercase font-bold text-sienna/70 block">{t('whatif.after')}</div>
                <div className={`text-xl font-bold ${whatIfResult.delta_inr >= 0 ? 'text-emerald' : 'text-crimson'}`}>
                  {formatInr(whatIfResult.new_eal_inr)}
                </div>
                <div className="text-[11px] text-sienna/70">{t('whatif.withChanges')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls — Missing / Partial Controls (most useful for What-If) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-ink">Security Controls</h2>
          <p className="text-xs text-slate">Click any control to toggle it on or off</p>
        </div>

        {/* Absent / Partial — more interesting for what-if */}
        {absentControls.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate uppercase tracking-wider">
              Not Yet Implemented — Toggle to see potential savings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {absentControls.map((ctrl) => {
                const toggled = toggledStatuses[ctrl.id];
                const isPresent = toggled === 'present';
                return (
                  <ControlToggleCard
                    key={ctrl.id}
                    ctrl={ctrl}
                    isPresent={isPresent}
                    originalStatus={ctrl.status}
                    onToggle={() => handleToggleControl(ctrl.id, toggled || ctrl.status)}
                    loading={loadingWhatIf}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Present controls */}
        {presentControls.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate uppercase tracking-wider">
              Currently Implemented — Toggle off to see exposure impact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {presentControls.map((ctrl) => {
                const toggled = toggledStatuses[ctrl.id];
                const isPresent = toggled === 'present';
                return (
                  <ControlToggleCard
                    key={ctrl.id}
                    ctrl={ctrl}
                    isPresent={isPresent}
                    originalStatus={ctrl.status}
                    onToggle={() => handleToggleControl(ctrl.id, toggled || ctrl.status)}
                    loading={loadingWhatIf}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="p-4 rounded-2xl bg-fog border border-mist flex items-start gap-3 text-xs text-slate">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          This simulation does not modify your actual security configuration or compliance audit results.
          It is designed for planning purposes — to help you evaluate the financial impact of security 
          decisions before committing capital.
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Control Toggle Card
// ─────────────────────────────────────────────────────────────────────────────
interface ControlToggleCardProps {
  ctrl: Control;
  isPresent: boolean;
  originalStatus: string;
  onToggle: () => void;
  loading: boolean;
}

const ControlToggleCard: React.FC<ControlToggleCardProps> = ({
  ctrl,
  isPresent,
  originalStatus,
  onToggle,
  loading,
}) => {
  const hasChanged = (isPresent && originalStatus !== 'present') || (!isPresent && originalStatus === 'present');

  return (
    <div
      onClick={loading ? undefined : onToggle}
      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-3 relative ${
        isPresent
          ? 'bg-emerald/5 border-emerald/30'
          : 'bg-fog border-mist hover:border-slate/40'
      } ${loading ? 'opacity-70 cursor-wait' : ''}`}
    >
      {/* Changed indicator */}
      {hasChanged && (
        <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
          isPresent ? 'bg-emerald' : 'bg-crimson'
        }`} />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className={`text-xs font-bold leading-tight ${isPresent ? 'text-emerald' : 'text-ink'}`}>
            {ctrl.name}
          </h4>
          {ctrl.cost_inr > 0 && (
            <span className="text-[11px] text-slate block mt-0.5">
              Implementation cost: {formatInr(ctrl.cost_inr)}
            </span>
          )}
        </div>

        {/* Toggle switch */}
        <div
          className={`w-10 h-5.5 rounded-full transition-colors relative shrink-0 mt-0.5 ${
            isPresent ? 'bg-emerald' : 'bg-slate/30'
          }`}
          style={{ minWidth: '2.5rem', height: '1.375rem' }}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-[3px] shadow-sm ${
              isPresent ? 'translate-x-[22px]' : 'translate-x-[3px]'
            }`}
          />
        </div>
      </div>

      {/* Risk reduction indicator */}
      {ctrl.risk_reduction_inr > 0 && (
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${
          isPresent ? 'text-emerald' : 'text-slate'
        }`}>
          {isPresent ? (
            <>
              <TrendingDown className="w-3 h-3" />
              <span>Reduces exposure by {formatInr(ctrl.risk_reduction_inr)}</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-3 h-3 text-slate/60" />
              <span className="text-slate/70">Could reduce {formatInr(ctrl.risk_reduction_inr)}</span>
            </>
          )}
        </div>
      )}

      {/* Status label */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isPresent
            ? 'bg-emerald/10 text-emerald'
            : originalStatus === 'partial'
            ? 'bg-amber/10 text-amber'
            : 'bg-mist text-slate'
        }`}>
          {isPresent
            ? 'Active'
            : originalStatus === 'partial'
            ? 'Partially Implemented'
            : 'Not Implemented'}
        </span>
        {hasChanged && (
          <span className={`text-[10px] font-bold ${isPresent ? 'text-emerald' : 'text-crimson'}`}>
            {isPresent ? '+ Added in scenario' : '− Removed in scenario'}
          </span>
        )}
      </div>
    </div>
  );
};
