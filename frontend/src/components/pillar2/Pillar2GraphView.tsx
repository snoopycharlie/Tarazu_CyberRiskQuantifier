import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { Network, Plus, Zap, RefreshCw, X, Maximize2, HelpCircle } from 'lucide-react';
import { Sheet, BlastRadiusResult, GraphData } from '../../types';
import { api } from '../../services/api';
import { formatInr } from '../../utils/format';

interface Pillar2GraphViewProps {
  sheets: Sheet[];
  activeSheetId: string;
  onSelectSheet: (sheetId: string) => void;
}

export const Pillar2GraphView: React.FC<Pillar2GraphViewProps> = ({
  sheets,
  activeSheetId,
  onSelectSheet,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [blastResult, setBlastResult] = useState<BlastRadiusResult | null>(null);
  const [calculatingBlast, setCalculatingBlast] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // New Edge Modal State
  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [edgeSourceId, setEdgeSourceId] = useState('');
  const [edgeTargetId, setEdgeTargetId] = useState('');
  const [edgeStrength, setEdgeStrength] = useState('strong');
  const [submittingEdge, setSubmittingEdge] = useState(false);

  useEffect(() => {
    if (activeSheetId) {
      loadGraph(activeSheetId);
    }
  }, [activeSheetId]);

  const loadGraph = async (sheetId: string) => {
    try {
      setLoading(true);
      setSelectedNode(null);
      setBlastResult(null);
      const data = await api.getGraph(sheetId);
      setGraphData(data);
      renderCytoscape(data);
    } catch (err) {
      console.error('Failed to load graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderCytoscape = (data: GraphData) => {
    if (!containerRef.current) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: data.elements as any,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#17191c',
            'font-family': 'Inter, sans-serif',
            'font-size': '10px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 8,
            'text-wrap': 'ellipsis',
            'text-max-width': '80px',
            'background-color': '#f2f2f3',
            'border-width': 2,
            'border-color': '#979799',
            'width': 44,
            'height': 44,
            'transition-property': 'background-color, border-color, border-width, width, height, opacity',
            'transition-duration': 0.2,
          } as any,
        },
        {
          selector: 'node[risk_level = "critical"]',
          style: {
            'background-color': '#fbe1d1',
            'border-color': '#5d2a1a',
            'border-width': 3,
            'width': 56,
            'height': 56,
          },
        },
        {
          selector: 'node[risk_level = "high"]',
          style: {
            'background-color': '#fef3c7',
            'border-color': '#d97706',
            'border-width': 2.5,
            'width': 50,
            'height': 50,
          },
        },
        {
          selector: 'node[risk_level = "medium"]',
          style: {
            'background-color': '#e0f2fe',
            'border-color': '#0284c7',
            'border-width': 2,
            'width': 44,
            'height': 44,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#d1d5db',
            'target-arrow-color': '#d1d5db',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.1,
            'opacity': 0.8,
          },
        },
        {
          selector: 'edge[strength = "strong"]',
          style: {
            'width': 3.5,
            'line-color': '#777b86',
            'target-arrow-color': '#777b86',
          },
        },
        {
          selector: '.highlighted-origin',
          style: {
            'border-color': '#dc2626',
            'border-width': 5,
            'background-color': '#fee2e2',
          },
        },
        {
          selector: '.highlighted-downstream',
          style: {
            'border-color': '#5d2a1a',
            'border-width': 4,
            'background-color': '#fbe1d1',
          },
        },
        {
          selector: '.highlighted-edge',
          style: {
            'line-color': '#dc2626',
            'target-arrow-color': '#dc2626',
            'width': 4,
            'opacity': 1,
          },
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.2,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 600,
        nodeRepulsion: () => 9000,
        idealEdgeLength: () => 130,
        edgeElasticity: () => 80,
        padding: 60,
        randomize: false,
        componentSpacing: 100,
      } as any,
    });

    cy.on('tap', 'node', async (evt: EventObject) => {
      const node = evt.target;
      const nodeData = node.data();
      setSelectedNode(nodeData);
      triggerBlastRadius(nodeData.id);
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted-origin highlighted-downstream highlighted-edge dimmed');
        setSelectedNode(null);
        setBlastResult(null);
      }
    });

    cyRef.current = cy;
  };

  const triggerBlastRadius = async (assetId: string) => {
    try {
      setCalculatingBlast(true);
      const res = await api.getBlastRadius(activeSheetId, assetId);
      setBlastResult(res);

      if (cyRef.current) {
        const cy = cyRef.current;
        cy.elements().removeClass('highlighted-origin highlighted-downstream highlighted-edge dimmed');

        const reachableSet = new Set(res.reachable_asset_ids);
        reachableSet.add(res.origin_asset_id);

        cy.elements().forEach((el: any) => {
          if (el.isNode()) {
            if (el.id() === res.origin_asset_id) {
              el.addClass('highlighted-origin');
            } else if (reachableSet.has(el.id())) {
              el.addClass('highlighted-downstream');
            } else {
              el.addClass('dimmed');
            }
          } else if (el.isEdge()) {
            const src = el.data('source');
            const tgt = el.data('target');
            if (reachableSet.has(src) && reachableSet.has(tgt)) {
              el.addClass('highlighted-edge');
            } else {
              el.addClass('dimmed');
            }
          }
        });
      }
    } catch (err) {
      console.error('Failed to calculate impact spread:', err);
    } finally {
      setCalculatingBlast(false);
    }
  };

  const handleFitView = () => {
    if (cyRef.current) cyRef.current.fit(undefined, 50);
  };

  const handleResetView = () => {
    if (cyRef.current) {
      cyRef.current.elements().removeClass('highlighted-origin highlighted-downstream highlighted-edge dimmed');
      cyRef.current.fit(undefined, 50);
      setSelectedNode(null);
      setBlastResult(null);
    }
  };

  // Quick demo: Show HR Laptop impact spread
  const handleRunDemoChain = () => {
    if (!graphData || !cyRef.current) return;
    const hrNode = graphData.elements.find(
      (el) => el.group === 'nodes' && el.data.label?.toLowerCase().includes('hr')
    );
    if (hrNode) {
      const nodeData = hrNode.data;
      setSelectedNode(nodeData);
      triggerBlastRadius(nodeData.id);
      cyRef.current.center(cyRef.current.$id(nodeData.id));
    }
  };

  const handleCreateEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeSourceId || !edgeTargetId || edgeSourceId === edgeTargetId) return;

    try {
      setSubmittingEdge(true);
      await api.createEdge({
        sheet_id: activeSheetId,
        source_asset_id: edgeSourceId,
        target_asset_id: edgeTargetId,
        dependency_strength: edgeStrength,
      });
      setShowEdgeModal(false);
      setEdgeSourceId('');
      setEdgeTargetId('');
      loadGraph(activeSheetId);
    } catch (err: any) {
      alert(`Could not create connection: ${err.message}`);
    } finally {
      setSubmittingEdge(false);
    }
  };

  const allNodes = graphData?.elements.filter((el) => el.group === 'nodes').map((el) => el.data) || [];

  const riskLevelLabel: Record<string, string> = {
    critical: 'Critical Risk',
    high: 'High Risk',
    medium: 'Moderate Risk',
    low: 'Low Risk',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate uppercase tracking-widest block mb-1">
            Network Analysis
          </span>
          <h1 className="font-editorial text-4xl md:text-5xl font-bold text-ink tracking-tight">
            How Risk Can Spread
          </h1>
          <p className="text-slate text-base mt-2 max-w-3xl">
            A vulnerability in one system can cascade through connected systems.{' '}
            <strong>Click any system</strong> to see which other systems could be affected if it is compromised.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="px-3.5 py-2 rounded-pill bg-fog border border-mist text-ink text-xs font-semibold hover:bg-mist transition flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate" />
            <span>How to Use</span>
          </button>
          <button
            onClick={handleRunDemoChain}
            className="px-4 py-2 rounded-pill bg-peach text-sienna font-bold text-xs hover:bg-peach/80 transition flex items-center gap-2 shadow-sm"
          >
            <Zap className="w-4 h-4 fill-sienna" />
            <span>Show HR Laptop Impact</span>
          </button>
          <button
            onClick={() => setShowEdgeModal(true)}
            className="px-4 py-2 rounded-pill bg-ink text-paper text-xs font-semibold hover:bg-black transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Connection</span>
          </button>
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="steep-card p-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-ink">How to read this map</h3>
              <ul className="text-slate text-xs space-y-2 leading-relaxed">
                <li>• <strong className="text-ink">Click any circle</strong> — see which systems could be affected if that system is compromised</li>
                <li>• <strong className="text-ink">Red highlighted circle</strong> — the starting point of the attack</li>
                <li>• <strong className="text-ink">Orange highlighted circles</strong> — systems that could be reached by an attacker</li>
                <li>• <strong className="text-ink">Dimmed circles</strong> — systems not in the attack path</li>
                <li>• <strong className="text-ink">Arrows</strong> — system connections (strong lines = direct access)</li>
              </ul>
            </div>
            <button onClick={() => setShowHelp(false)} className="text-slate hover:text-ink p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sheet Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate uppercase tracking-wider mr-1 shrink-0">Segment:</span>
        {sheets.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectSheet(s.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-pill transition whitespace-nowrap ${
              activeSheetId === s.id
                ? 'bg-ink text-paper'
                : 'bg-fog border border-mist text-slate hover:text-ink'
            }`}
          >
            {s.name} {s.type === 'combined' ? '(Combined)' : ''}
          </button>
        ))}
      </div>

      {/* Impact Spread Alert Banner */}
      {blastResult && blastResult.reachable_asset_ids.length > 0 && (
        <div className="p-5 rounded-3xl bg-peach border border-sienna/30 text-sienna animate-in slide-in-from-top duration-300 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sienna text-paper flex items-center justify-center shrink-0">
                <Network className="w-5 h-5 text-peach" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sienna/15">
                    Potential Impact Spread
                  </span>
                  <span className="text-xs font-bold">{blastResult.hop_count} connections traversed</span>
                </div>
                <h3 className="font-editorial text-xl font-bold mt-1">
                  Could affect {formatInr(blastResult.total_downstream_exposure_inr)} in additional assets
                </h3>
                <p className="text-xs text-sienna/90 mt-1 max-w-4xl leading-relaxed">
                  If <strong>{blastResult.origin_asset_name}</strong> is compromised, risk can spread to{' '}
                  <strong>{blastResult.reachable_asset_ids.length} connected systems</strong>:
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-xs font-bold bg-white/70 px-2.5 py-1 rounded-full border border-sienna/20">
                    {blastResult.origin_asset_name} (Start)
                  </span>
                  {blastResult.traversal_path.map((step, i) => (
                    <React.Fragment key={i}>
                      <span className="text-xs font-bold text-sienna/60">→</span>
                      <span className="text-xs font-semibold bg-white/60 px-2.5 py-1 rounded-full border border-sienna/20">
                        {step.asset_name}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setBlastResult(null);
                setSelectedNode(null);
                if (cyRef.current) {
                  cyRef.current.elements().removeClass('highlighted-origin highlighted-downstream highlighted-edge dimmed');
                }
              }}
              className="text-sienna hover:text-black p-1 transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Graph Canvas */}
      <div className="relative steep-card overflow-hidden h-[600px] bg-fog border-mist">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-fog/80 backdrop-blur-xs flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-sienna animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate">Building your network map…</p>
            </div>
          </div>
        )}

        {/* Cytoscape Canvas */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Graph Controls — top left */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <button
            onClick={handleFitView}
            title="Fit all systems in view"
            className="px-3 py-1.5 rounded-xl bg-white/90 border border-mist text-xs font-semibold text-ink hover:bg-white transition shadow-sm"
          >
            Fit View
          </button>
          <button
            onClick={handleResetView}
            title="Reset view and clear selection"
            className="px-3 py-1.5 rounded-xl bg-white/90 border border-mist text-xs font-semibold text-ink hover:bg-white transition shadow-sm"
          >
            Reset
          </button>
        </div>

        {/* Legend — bottom left */}
        <div className="absolute bottom-4 left-4 z-10 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-mist text-xs shadow-sm space-y-1.5 pointer-events-none">
          <div className="font-bold text-slate uppercase text-[10px] tracking-wider mb-1">Risk Level</div>
          {[
            { color: 'bg-peach border-sienna', label: 'Critical', sublabel: 'Exposure ≥ ₹1 Crore' },
            { color: 'bg-amber-50 border-amber-500', label: 'High', sublabel: 'Exposure ≥ ₹25 Lakh' },
            { color: 'bg-blue-50 border-blue-500', label: 'Moderate', sublabel: 'Exposure ≥ ₹5 Lakh' },
            { color: 'bg-mist border-slate', label: 'Low', sublabel: 'Lower exposure' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full border ${item.color}`} />
              <span className="text-ink font-medium">{item.label}</span>
              <span className="text-slate/70">— {item.sublabel}</span>
            </div>
          ))}
        </div>

        {/* Selected Node Panel — right side */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-10 w-72 p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-mist shadow-elevated text-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-mist text-slate">
                  {selectedNode.asset_type}
                </span>
                <h3 className="font-bold text-base text-ink mt-1">{selectedNode.label}</h3>
                <span className="text-[10px] text-slate">{riskLevelLabel[selectedNode.risk_level] || 'Risk Level'}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedNode(null);
                  if (cyRef.current) {
                    cyRef.current.elements().removeClass('highlighted-origin highlighted-downstream highlighted-edge dimmed');
                  }
                }}
                className="text-slate hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-fog border border-mist">
              <span className="text-[10px] uppercase font-bold text-slate block">Estimated Annual Exposure</span>
              <span className="text-xl font-editorial font-bold text-sienna">
                {formatInr(selectedNode.eal_inr || 0)}
              </span>
              <span className="text-[10px] text-slate block mt-0.5">
                {selectedNode.revenue_dependency_pct}% business revenue dependency
              </span>
            </div>

            {selectedNode.cves && selectedNode.cves.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate block mb-1">
                  Known Vulnerabilities
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.cves.map((cve: string) => (
                    <span
                      key={cve}
                      className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-mist text-ink"
                      title="Common Vulnerabilities and Exposures (CVE) identifier"
                    >
                      {cve}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => triggerBlastRadius(selectedNode.id)}
              disabled={calculatingBlast}
              className="w-full py-2 rounded-pill bg-ink text-paper text-xs font-semibold hover:bg-black transition flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{calculatingBlast ? 'Calculating…' : 'See Impact Spread'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Connection Modal */}
      {showEdgeModal && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-mist shadow-elevated">
            <div className="flex items-center justify-between pb-4 border-b border-mist">
              <div>
                <h3 className="font-editorial text-xl font-bold text-ink">Add System Connection</h3>
                <p className="text-xs text-slate mt-0.5">
                  Define how two systems are connected to each other.
                </p>
              </div>
              <button onClick={() => setShowEdgeModal(false)} className="text-slate hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEdge} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate uppercase block mb-1">From System (Source)</label>
                <select
                  value={edgeSourceId}
                  onChange={(e) => setEdgeSourceId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
                >
                  <option value="">Select source system…</option>
                  {allNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.asset_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate uppercase block mb-1">To System (Target)</label>
                <select
                  value={edgeTargetId}
                  onChange={(e) => setEdgeTargetId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
                >
                  <option value="">Select target system…</option>
                  {allNodes
                    .filter((n) => n.id !== edgeSourceId)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label} ({n.asset_type})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate uppercase block mb-1">Connection Strength</label>
                <select
                  value={edgeStrength}
                  onChange={(e) => setEdgeStrength(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
                >
                  <option value="strong">Strong — Direct access (shared credentials, same network)</option>
                  <option value="moderate">Moderate — Network reachable (firewall-segmented)</option>
                  <option value="weak">Weak — Occasional connection (batch jobs, read-only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-mist">
                <button
                  type="button"
                  onClick={() => setShowEdgeModal(false)}
                  className="px-4 py-2 rounded-pill bg-fog border border-mist text-slate hover:text-ink font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdge || !edgeSourceId || !edgeTargetId}
                  className="px-5 py-2 rounded-pill bg-ink text-paper font-semibold hover:bg-black transition disabled:opacity-50"
                >
                  {submittingEdge ? 'Adding…' : 'Add Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
