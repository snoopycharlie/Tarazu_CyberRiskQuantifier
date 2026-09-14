import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowRight, Activity, Info, TrendingDown, TrendingUp, AlertCircle, PlayCircle, Plus } from 'lucide-react';
import { Control, WhatIfResult, Organization, Asset, ScenarioChange } from '../../types';
import { api } from '../../services/api';
import { formatInr, formatMoney } from '../../utils/format';
import { loadSettings } from '../../utils/settings';
import { useLanguage } from '../../i18n/LanguageContext';
import { containerVariants, itemVariants, slideUpVariants } from '../../utils/animations';
import { SCENARIO_LIBRARY, ScenarioTemplate } from './ScenarioLibrary';

interface WhatIfViewProps {
  currentOrg: Organization | null;
}

export const WhatIfView: React.FC<WhatIfViewProps> = ({ currentOrg }) => {
  const [controls, setControls] = useState<Control[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // Selection
  const [activeScenario, setActiveScenario] = useState<ScenarioTemplate | null>(null);
  
  // Input State Map for the active scenario (e.g. slider values, asset dropdowns)
  const [inputState, setInputState] = useState<Record<string, any>>({});
  
  // Cyber Risk Policy Toggles State (when in custom controls mode)
  const [toggledControls, setToggledControls] = useState<Record<string, string>>({});

  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (currentOrg) {
      loadData();
    }
  }, [currentOrg]);

  const loadData = async () => {
    if (!currentOrg) return;
    try {
      setLoading(true);
      const { currency } = loadSettings();
      const loadedControls = await api.listControls(currentOrg.id, currency || 'INR');
      setControls(loadedControls);
      
      const sheets = await api.listSheets(currentOrg.id);
      if (sheets.length > 0) {
        const firstSheetAssets = await api.listAssets(sheets[0].id);
        setAssets(firstSheetAssets);
      }
    } catch (err) {
      console.error('Failed to load what-if dependencies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScenario = (scenario: ScenarioTemplate) => {
    setActiveScenario(scenario);
    setWhatIfResult(null);
    setToggledControls({});
    
    // Initialize defaults
    const defaults: Record<string, any> = {};
    scenario.inputs.forEach(inp => {
      if (inp.default_num !== undefined) defaults[inp.id] = inp.default_num;
      if (inp.type === 'asset_select') defaults[inp.id] = '';
    });
    setInputState(defaults);
  };

  const handleToggleControl = (controlId: string, originalStatus: string) => {
    setToggledControls(prev => {
      const current = prev[controlId] || originalStatus;
      return {
        ...prev,
        [controlId]: current === 'present' ? 'absent' : 'present'
      };
    });
  };

  const handleRunSimulation = async () => {
    if (!currentOrg || !activeScenario) return;
    try {
      setLoading(true);
      const { currency } = loadSettings();
      
      // Build changes array based on inputs and static changes
      const changes: ScenarioChange[] = [...(activeScenario.static_changes || [])];
      
      activeScenario.inputs.forEach(inp => {
        const val = inputState[inp.id];
        if (inp.type === 'slider' && val !== undefined) {
          changes.push({
            change_type: inp.change_type,
            target_id: inp.target_id,
            value_num: val
          });
        } else if (inp.type === 'asset_select' && val) {
          changes.push({
            change_type: inp.change_type,
            target_id: val,
            value_str: 'unavailable'
          });
        }
      });
      
      // Add toggled controls (if in custom control mode)
      if (activeScenario.id === 'crp_policy_enforce') {
        Object.entries(toggledControls).forEach(([cId, state]) => {
          changes.push({
            change_type: 'control_toggle',
            target_id: cId,
            value_str: state
          });
        });
      }

      const res = await api.whatIfSimulation(
        currentOrg.id,
        {
          scenario_id: activeScenario.id,
          changes
        },
        undefined,
        currency || 'INR'
      );
      // Attach currency to result for consistent formatting in UI
      res.currency = currency || 'INR';
      setWhatIfResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrg) {
    return (
      <div className="py-24 text-center">
        <Activity className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select an organization to build a scenario.</p>
      </div>
    );
  }

  // Filter categories
  const cyberScenarios = SCENARIO_LIBRARY.filter(s => s.category === 'Cyber Risk & Policy');
  const businessScenarios = SCENARIO_LIBRARY.filter(s => s.category === 'Business & Operations');

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      
      <div className="flex-none mb-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="page-eyebrow mb-1">Advanced Simulator</span>
            <h1 className="text-3xl font-bold tracking-tight text-ink">What-If / Scenario Engine</h1>
            <p className="text-sm mt-1 text-slate max-w-2xl">
              Combine operational, financial, and cyber scenarios to calculate cascading downstream impacts on your risk exposure.
            </p>
          </div>
          {whatIfResult && (
            <button
              onClick={() => setWhatIfResult(null)}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-fog border border-mist text-ink hover:border-slate transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Results</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* LEFT SIDEBAR: Scenario Library */}
        <div className="w-80 flex-none flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar border-r border-mist">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-2">Scenario Library</h2>
          
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate mb-3 border-b border-mist pb-1">Cyber Risk & Policy</h3>
            <div className="space-y-2">
              {cyberScenarios.map(scenario => (
                <LibraryItem 
                  key={scenario.id} 
                  scenario={scenario} 
                  isActive={activeScenario?.id === scenario.id} 
                  onClick={() => handleSelectScenario(scenario)} 
                />
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-slate mb-3 border-b border-mist pb-1">Business & Operations</h3>
            <div className="space-y-2">
              {businessScenarios.map(scenario => (
                <LibraryItem 
                  key={scenario.id} 
                  scenario={scenario} 
                  isActive={activeScenario?.id === scenario.id} 
                  onClick={() => handleSelectScenario(scenario)} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* MAIN WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pr-2 pb-10">
          {!activeScenario ? (
            <div className="h-full flex flex-col items-center justify-center border border-dashed border-mist rounded-2xl bg-fog/50 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-fog border border-mist flex items-center justify-center mb-4">
                <PlayCircle className="w-8 h-8 text-slate/50" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">Select a Scenario</h3>
              <p className="text-sm text-slate max-w-sm">
                Choose a pre-built scenario from the library on the left to begin constructing a simulation.
              </p>
            </div>
          ) : (
            <motion.div 
              key={activeScenario.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              
              {/* Workspace Header */}
              <div className="p-6 rounded-2xl bg-white border border-mist shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-ink">{activeScenario.name}</h2>
                    <p className="text-sm text-slate mt-1">{activeScenario.description}</p>
                  </div>
                </div>

                <div className="space-y-5 pt-4 border-t border-mist">
                  {/* Render Inputs based on Template */}
                  {activeScenario.inputs.map(inp => (
                    <div key={inp.id}>
                      {inp.type === 'slider' && (
                        <div>
                          <label className="flex justify-between text-xs font-bold text-slate mb-2">
                            <span>{inp.label}</span>
                            <span className="text-emerald">{inputState[inp.id] > 0 && '+'}{inputState[inp.id]}{inp.unit}</span>
                          </label>
                          <input 
                            type="range" 
                            min={inp.min_num} max={inp.max_num} step={inp.step}
                            value={inputState[inp.id] || 0} 
                            onChange={e => setInputState(s => ({...s, [inp.id]: Number(e.target.value)}))}
                            className="w-full accent-emerald"
                          />
                        </div>
                      )}
                      
                      {inp.type === 'asset_select' && (
                        <div>
                          <label className="block text-xs font-bold text-slate mb-2">{inp.label}</label>
                          <select 
                            className="w-full text-sm p-2 rounded-lg border border-mist bg-fog text-ink"
                            value={inputState[inp.id] || ''}
                            onChange={e => setInputState(s => ({...s, [inp.id]: e.target.value}))}
                          >
                            <option value="">-- Select an Asset --</option>
                            {assets.map(a => (
                              <option key={a.id} value={a.id}>{a.name} ({a.asset_type})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {inp.type === 'control_toggle' && (
                        <div className="space-y-4 mt-6">
                          <h3 className="text-xs font-bold text-slate uppercase tracking-wider">Cyber Risk Policy Implementation</h3>
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                            {controls.map(ctrl => {
                              const currentStatus = toggledControls[ctrl.id] || ctrl.status;
                              const isPresent = currentStatus === 'present';
                              const hasChanged = currentStatus !== ctrl.status;
                              return (
                                <div key={ctrl.id} 
                                  onClick={() => handleToggleControl(ctrl.id, ctrl.status)}
                                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${isPresent ? 'bg-emerald/5 border-emerald/30' : 'bg-fog border-mist'}`}
                                >
                                  <div>
                                    <div className="text-xs font-bold text-ink flex items-center gap-2">
                                      {ctrl.name}
                                      {hasChanged && <span className="text-[9px] bg-amber/20 text-amber px-1.5 rounded-sm">Modified</span>}
                                    </div>
                                    <div className="text-[10px] text-slate mt-0.5">{isPresent ? 'Active' : 'Disabled'}</div>
                                  </div>
                                  
                                  <div className={`w-8 h-4 rounded-full relative transition ${isPresent ? 'bg-emerald' : 'bg-slate/30'}`}>
                                    <div className={`absolute top-[2px] w-3 h-3 bg-white rounded-full transition transform ${isPresent ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <button
                    onClick={handleRunSimulation}
                    disabled={loading}
                    className="w-full mt-4 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition bg-ink text-white hover:bg-slate disabled:opacity-50"
                  >
                    {loading ? (
                      <><div className="w-4 h-4 border-2 rounded-full animate-spin border-t-transparent" /> Simulating...</>
                    ) : (
                      <><PlayCircle className="w-4 h-4" /> Run Simulation</>
                    )}
                  </button>
                </div>
              </div>

              {/* RESULTS PANEL */}
              <AnimatePresence>
                {whatIfResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    {/* Primary Delta Card */}
                    <div className="p-8 rounded-[2rem] border bg-white shadow-sm overflow-hidden relative border-mist">
                      <div className={`absolute top-0 left-0 w-full h-1 ${whatIfResult.delta_inr >= 0 ? 'bg-emerald' : 'bg-crimson'}`} />
                      
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block mb-2 text-slate">
                            Simulation Outcome
                          </span>
                          
                          <h2 className={`text-4xl md:text-5xl font-bold font-editorial ${whatIfResult.delta_inr > 0 ? 'text-emerald' : whatIfResult.delta_inr < 0 ? 'text-crimson' : 'text-slate'}`}>
                            {whatIfResult.delta_inr > 0
                              ? `Exposure Decreased by ${formatMoney(Math.abs(whatIfResult.delta_inr), (whatIfResult as any).currency || 'INR')}`
                              : whatIfResult.delta_inr < 0 
                                ? `Exposure Increased by ${formatMoney(Math.abs(whatIfResult.delta_inr), (whatIfResult as any).currency || 'INR')}`
                                : 'No Change in Exposure'}
                          </h2>
                          
                          <p className="text-sm mt-3 text-slate">
                            {whatIfResult.delta_inr > 0
                              ? `This scenario mathematically decreases your estimated annual loss by ${Math.abs(whatIfResult.delta_pct).toFixed(1)}%.`
                              : whatIfResult.delta_inr < 0
                                ? `This scenario mathematically increases your estimated annual loss by ${Math.abs(whatIfResult.delta_pct).toFixed(1)}%.`
                                : 'This scenario does not result in a net change to your quantified exposure.'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-6 border-t border-mist">
                        <div>
                          <div className="text-[11px] uppercase font-bold tracking-wider mb-1 text-slate">Current Exposure (Before)</div>
                          <div className="text-2xl font-bold font-editorial text-ink">
                            {formatMoney(whatIfResult.original_eal_inr, (whatIfResult as any).currency || 'INR')}
                          </div>
                        </div>
                        <div className="hidden md:flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center border border-mist bg-fog">
                            <ArrowRight className="w-4 h-4 text-slate" />
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase font-bold tracking-wider mb-1 text-slate">Simulated Exposure (After)</div>
                          <div className={`text-2xl font-bold font-editorial ${whatIfResult.delta_inr >= 0 ? 'text-emerald' : 'text-crimson'}`}>
                            {formatMoney(whatIfResult.new_eal_inr, (whatIfResult as any).currency || 'INR')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rich Statistics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {whatIfResult.revenue_change_inr !== 0 && (
                        <div className="p-4 rounded-xl border border-mist bg-white">
                          <div className="text-[10px] uppercase font-bold text-slate mb-1">Simulated Revenue Change</div>
                          <div className={`text-lg font-bold ${(whatIfResult.revenue_change_inr || 0) > 0 ? 'text-emerald' : 'text-crimson'}`}>
                            {(whatIfResult.revenue_change_inr || 0) > 0 ? '+' : '-'}
                            {formatMoney(Math.abs(whatIfResult.revenue_change_inr || 0), (whatIfResult as any).currency || 'INR')}
                          </div>
                        </div>
                      )}
                      
                      {(whatIfResult.affected_assets_count || 0) > 0 && (
                        <div className="p-4 rounded-xl border border-mist bg-white">
                          <div className="text-[10px] uppercase font-bold text-slate mb-1">Cascading Impact</div>
                          <div className="text-lg font-bold text-crimson">{whatIfResult.affected_assets_count} Downstream Systems</div>
                        </div>
                      )}
                      
                      {(whatIfResult.downstream_impact_inr || 0) > 0 && (
                        <div className="p-4 rounded-xl border border-mist bg-white">
                          <div className="text-[10px] uppercase font-bold text-slate mb-1">Downstream Financial Loss</div>
                          <div className="text-lg font-bold text-crimson">{formatMoney(Math.abs(whatIfResult.downstream_impact_inr || 0), (whatIfResult as any).currency || 'INR')}</div>
                        </div>
                      )}
                    </div>

                    {/* Risk Distribution Visuals */}
                    {whatIfResult.risk_distribution_before && whatIfResult.risk_distribution_after && (
                      <div className="p-6 rounded-2xl border border-mist bg-white">
                        <h3 className="text-sm font-bold text-ink mb-4">Risk Distribution Shift</h3>
                        <div className="grid grid-cols-2 gap-8">
                          <div>
                            <div className="text-xs font-bold text-slate mb-2">Before</div>
                            <DistributionBars dist={whatIfResult.risk_distribution_before} total={whatIfResult.affected_assets_total || 1} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate mb-2">After</div>
                            <DistributionBars dist={whatIfResult.risk_distribution_after} total={whatIfResult.affected_assets_total || 1} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

      </div>
    </motion.div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const LibraryItem = ({ scenario, isActive, onClick }: { scenario: ScenarioTemplate, isActive: boolean, onClick: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-xl border text-left cursor-pointer transition ${isActive ? 'bg-emerald/10 border-emerald/30 shadow-sm' : 'bg-white border-mist hover:border-slate/30'}`}
    >
      <div className={`text-xs font-bold mb-0.5 ${isActive ? 'text-emerald' : 'text-ink'}`}>{scenario.name}</div>
      <div className="text-[10px] text-slate line-clamp-2">{scenario.description}</div>
    </div>
  );
};

const DistributionBars = ({ dist, total }: { dist: Record<string, number>, total: number }) => {
  const bands = [
    { key: 'critical', label: 'Critical', color: 'bg-crimson' },
    { key: 'high', label: 'High', color: 'bg-amber' },
    { key: 'medium', label: 'Medium', color: 'bg-sienna' },
    { key: 'low', label: 'Low', color: 'bg-emerald' }
  ];
  
  return (
    <div className="space-y-2">
      {bands.map(b => {
        const count = dist[b.key] || 0;
        const pct = Math.max(0, Math.min(100, (count / total) * 100));
        return (
          <div key={b.key} className="flex items-center gap-2 text-[10px]">
            <div className="w-12 text-slate text-right">{b.label}</div>
            <div className="flex-1 h-1.5 bg-fog rounded-full overflow-hidden">
              <div className={`h-full ${b.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
            </div>
            <div className="w-6 text-ink font-bold">{count}</div>
          </div>
        )
      })}
    </div>
  )
}
