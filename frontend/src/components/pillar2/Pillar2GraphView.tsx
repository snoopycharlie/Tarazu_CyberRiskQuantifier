import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { Network, AlertCircle, Plus, Zap, RefreshCw, X, ShieldAlert, Layers } from 'lucide-react';
import { Sheet, BlastRadiusResult, GraphData } from '../../types';
import { api } from '../../services/api';

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

    // Map Cytoscape styles to Steep design system
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
            'font-size': '11px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': '#f2f2f3',
            'border-width': 2,
            'border-color': '#979799',
            'width': 42,
            'height': 42,
            'transition-property': 'background-color, border-color, border-width, width, height',
            'transition-duration': 0.2,
          } as any,
        },
        {
          selector: 'node[risk_level = "critical"]',
          style: {
            'background-color': '#fbe1d1',
            'border-color': '#5d2a1a',
            'border-width': 3,
            'width': 54,
            'height': 54,
          },
        },
        {
          selector: 'node[risk_level = "high"]',
          style: {
            'background-color': '#fef3c7',
            'border-color': '#d97706',
            'border-width': 2.5,
            'width': 48,
            'height': 48,
          },
        },
        {
          selector: 'node[risk_level = "medium"]',
          style: {
            'background-color': '#e0f2fe',
            'border-color': '#0284c7',
            'border-width': 2,
            'width': 42,
            'height': 42,
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
            'opacity': 0.25,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        nodeRepulsion: () => 6000,
        idealEdgeLength: () => 100,
        edgeElasticity: () => 100,
        padding: 50,
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
        // Clicked background
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

      // Highlight in Cytoscape
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
      console.error('Failed to calculate blast radius:', err);
    } finally {
      setCalculatingBlast(false);
    }
  };

  // Demo shortcut: HR Laptop -> VPN -> Core Banking -> Payment Gateway
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
      alert(`Error creating edge: ${err.message}`);
    } finally {
      setSubmittingEdge(false);
    }
  };

  const formatInr = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const allNodes = graphData?.elements.filter((el) => el.group === 'nodes').map((el) => el.data) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-peach text-sienna tracking-wide">
              DEMO PILLAR #2
            </span>
            <span className="text-xs text-slate">Lateral Movement & Network Topology</span>
          </div>
          <h1 className="font-editorial text-4xl md:text-5xl font-bold text-ink tracking-tight">
            Network Graph & Blast Radius Engine
          </h1>
          <p className="text-slate text-base mt-2 max-w-3xl">
            Cyber risk does not live in isolation. Directed network dependency edges expose cascading lateral movement vectors.
            Click any node below to trace its reachability and aggregate reachable downstream business value.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunDemoChain}
            className="px-4 py-2.5 rounded-pill bg-peach text-sienna font-bold text-xs hover:bg-peach/80 transition flex items-center gap-2 shadow-sm"
          >
            <Zap className="w-4 h-4 fill-sienna" />
            <span>Run HR Laptop Lateral Demo</span>
          </button>
          <button
            onClick={() => setShowEdgeModal(true)}
            className="px-4 py-2.5 rounded-pill bg-ink text-paper text-xs font-semibold hover:bg-black transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Edge</span>
          </button>
        </div>
      </div>

      {/* Sheet Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate uppercase tracking-wider mr-2 shrink-0">View Scope:</span>
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
            {s.name} {s.type === 'combined' ? '(Derived)' : ''}
          </button>
        ))}
      </div>

      {/* Sticky Blast Radius Alert Banner */}
      {blastResult && blastResult.reachable_asset_ids.length > 0 && (
        <div className="p-5 rounded-3xl bg-peach border border-sienna/30 text-sienna animate-in slide-in-from-top duration-300 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sienna text-paper flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-peach" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sienna/15">
                    Cascading Blast Radius Warning
                  </span>
                  <span className="text-xs font-bold">{blastResult.hop_count} Hops Traversed</span>
                </div>
                <h3 className="font-editorial text-2xl font-bold mt-1">
                  Downstream Financial Reachability: {formatInr(blastResult.total_downstream_exposure_inr)}
                </h3>
                <p className="text-xs text-sienna/90 mt-1 max-w-4xl leading-relaxed">
                  If <strong>{blastResult.origin_asset_name}</strong> is breached, lateral movement enables attacker access to{' '}
                  <strong>{blastResult.reachable_asset_ids.length} downstream business assets</strong> across multiple segments:
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-xs font-bold bg-white/70 px-2.5 py-1 rounded-full border border-sienna/20">
                    {blastResult.origin_asset_name} (Origin)
                  </span>
                  {blastResult.traversal_path.map((step, i) => (
                    <React.Fragment key={i}>
                      <span className="text-xs font-bold text-sienna/60">→</span>
                      <span className="text-xs font-semibold bg-white/60 px-2.5 py-1 rounded-full border border-sienna/20">
                        {step.asset_name} <span className="text-[10px] text-sienna/70">[{step.strength}]</span>
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setBlastResult(null);
                if (cyRef.current) {
                  cyRef.current.elements().removeClass('highlighted-origin highlighted-downstream highlighted-edge dimmed');
                }
              }}
              className="text-sienna hover:text-black p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Graph Canvas Container */}
      <div className="relative steep-card overflow-hidden h-[620px] bg-fog border-mist">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-fog/80 backdrop-blur-xs flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-sienna animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate">Rendering network topology...</p>
            </div>
          </div>
        )}

        {/* Cytoscape Canvas */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-mist text-xs shadow-sm space-y-1.5 pointer-events-none">
          <div className="font-bold text-slate uppercase text-[10px] tracking-wider mb-1">Risk Tiers</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-peach border border-sienna" />
            <span className="text-ink">Critical (EAL ≥ ₹1 Cr)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber/20 border border-amber" />
            <span className="text-ink">High (EAL ≥ ₹25 L)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-500" />
            <span className="text-ink">Medium (EAL ≥ ₹5 L)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-mist border border-slate" />
            <span className="text-ink">Low / Standard</span>
          </div>
        </div>

        {/* Selected Node Sidebar Overlay */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-10 w-80 p-5 rounded-3xl bg-white/95 backdrop-blur-md border border-mist shadow-elevated text-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-mist text-slate">
                  {selectedNode.asset_type} · {selectedNode.criticality_tag}
                </span>
                <h3 className="font-bold text-base text-ink mt-1">{selectedNode.label}</h3>
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
              <span className="text-[10px] uppercase font-bold text-slate block">Quantified Direct EAL</span>
              <span className="text-xl font-editorial font-bold text-sienna">{formatInr(selectedNode.eal_inr || 0)}</span>
              <span className="text-[10px] text-slate block mt-0.5">{selectedNode.revenue_dependency_pct}% revenue dependency</span>
            </div>

            {selectedNode.cves && selectedNode.cves.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate block mb-1">Associated CVEs</span>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.cves.map((cve: string) => (
                    <span key={cve} className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-mist text-ink">
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
              <span>{calculatingBlast ? 'Traversing...' : 'Re-calculate Blast Radius'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Edge Creator Modal */}
      {showEdgeModal && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-mist shadow-elevated">
            <div className="flex items-center justify-between pb-4 border-b border-mist">
              <h3 className="font-editorial text-xl font-bold text-ink">Add Dependency Edge</h3>
              <button onClick={() => setShowEdgeModal(false)} className="text-slate hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEdge} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate uppercase block mb-1">Source Asset (Upstream)</label>
                <select
                  value={edgeSourceId}
                  onChange={(e) => setEdgeSourceId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
                >
                  <option value="">Select source asset...</option>
                  {allNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.asset_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate uppercase block mb-1">Target Asset (Downstream)</label>
                <select
                  value={edgeTargetId}
                  onChange={(e) => setEdgeTargetId(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
                >
                  <option value="">Select target asset...</option>
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
                <label className="font-bold text-slate uppercase block mb-1">Dependency Strength</label>
                <select
                  value={edgeStrength}
                  onChange={(e) => setEdgeStrength(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-mist bg-fog text-ink text-sm font-medium focus:outline-none"
                >
                  <option value="strong">Strong (Direct Lateral Pathway / Shared Auth)</option>
                  <option value="moderate">Moderate (Network Reachable / Firewall Segmented)</option>
                  <option value="weak">Weak (Occasional Batch Connection / Read-only)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
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
                  {submittingEdge ? 'Linking...' : 'Create Edge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
