import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, RefreshCw, X, Info, AlertTriangle, Shield,
  Server, Laptop, Database, Lock, Globe, HardDrive, Cpu, Router, Mail, Video,
} from 'lucide-react';

import { Sheet, BlastRadiusResult, GraphData } from '../../types';
import { api } from '../../services/api';
import { formatInr } from '../../utils/format';
import { useLanguage } from '../../i18n/LanguageContext';

interface Pillar2GraphViewProps {
  sheets: Sheet[];
  activeSheetId: string;
  onSelectSheet: (sheetId: string) => void;
}

// ── Icons Mapping ───────────────────────────────────────────────────────────
const getIconForType = (type: string) => {
  if (!type) return Server;
  const t = type.toLowerCase();
  if (t.includes('laptop') || t.includes('endpoint') || t.includes('workstation')) return Laptop;
  if (t.includes('database') || t.includes('db')) return Database;
  if (t.includes('vpn') || t.includes('firewall') || t.includes('security')) return Lock;
  if (t.includes('web') || t.includes('cloud')) return Globe;
  if (t.includes('storage') || t.includes('file')) return HardDrive;
  if (t.includes('active_directory') || t.includes('directory')) return Cpu;
  if (t.includes('network') || t.includes('switch')) return Router;
  if (t.includes('mail') || t.includes('email')) return Mail;
  if (t.includes('camera') || t.includes('cctv')) return Video;
  return Server;
};

// ── Custom Node ──────────────────────────────────────────────────────────────
const AssetNode = ({ data, selected }: NodeProps) => {
  const Icon = getIconForType(data.asset_type as string);
  const risk = (data.risk_level as string) || 'medium';
  const isDimmed = data.isDimmed;
  const isHighlighted = data.isHighlighted;
  const isOrigin = data.isOrigin;

  let borderColor = 'border-border-dim';
  let bgColor = 'bg-surface';
  let iconColor = 'text-slate';

  if (risk === 'critical') { borderColor = 'border-risk-critical'; iconColor = 'text-risk-critical'; }
  else if (risk === 'high') { borderColor = 'border-risk-high'; iconColor = 'text-risk-high'; }
  else if (risk === 'medium') { borderColor = 'border-risk-medium'; iconColor = 'text-risk-medium'; }
  else if (risk === 'low') { borderColor = 'border-risk-low'; iconColor = 'text-risk-low'; }

  if (isOrigin) {
    bgColor = 'bg-risk-critical/10';
    borderColor = 'border-risk-critical';
  } else if (isHighlighted) {
    bgColor = 'bg-risk-high/10';
    borderColor = 'border-risk-high';
  }

  const showWarning = (risk === 'critical' || risk === 'high') && !isDimmed;

  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 shadow-sm ${bgColor} ${borderColor} ${selected ? 'shadow-elevated scale-105' : ''} ${isDimmed ? 'opacity-20' : 'opacity-100'}`}
      style={{ minWidth: 230 }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      {/* Warning badge — restored */}
      {showWarning && (
        <div
          className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md z-10"
          style={{
            background: risk === 'critical' ? 'var(--risk-critical)' : 'var(--risk-high)',
          }}
          title={`${risk === 'critical' ? 'Critical' : 'High'} risk system`}
        >
          <AlertTriangle className="w-3 h-3 text-white" />
        </div>
      )}

      <div className={`p-2 rounded-lg bg-surface-2 ${iconColor} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-ink truncate">{data.label as string}</div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate truncate">
          {data.asset_type ? (data.asset_type as string).replace(/_/g, ' ') : 'Asset'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
};

const nodeTypes = { asset: AssetNode };

// ── Layout calculation (Dagre) — increased spacing to prevent overlap ────────
const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';

  // Create a fresh graph each time to avoid stale state
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: 110, nodesep: 60, marginx: 30, marginy: 30 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 240, height: 80 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - 240 / 2,
        y: nodeWithPosition.y - 80 / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// ── Main Component ───────────────────────────────────────────────────────────
export const Pillar2GraphView: React.FC<Pillar2GraphViewProps> = ({
  sheets,
  activeSheetId,
  onSelectSheet,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [blastResult, setBlastResult] = useState<BlastRadiusResult | null>(null);
  const [calculatingBlast, setCalculatingBlast] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { t } = useLanguage();

  // Load graph
  useEffect(() => {
    if (activeSheetId) loadGraph(activeSheetId);
  }, [activeSheetId]);

  const loadGraph = async (sheetId: string) => {
    try {
      setLoading(true);
      setSelectedNode(null);
      setBlastResult(null);
      const data: GraphData = await api.getGraph(sheetId);

      const rawNodes = data.elements
        .filter((el) => el.group === 'nodes')
        .map((el) => ({
          id: el.data.id,
          type: 'asset',
          data: { ...el.data },
          position: { x: 0, y: 0 },
        }));

      const rawEdges = data.elements
        .filter((el) => el.group === 'edges')
        .map((el) => ({
          id: el.data.id,
          source: el.data.source,
          target: el.data.target,
          animated: false,
          style: { strokeWidth: 1.5, stroke: 'var(--border-strong)' },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border-strong)' },
        }));

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      console.error('Failed to load graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerBlastRadius = async (assetId: string) => {
    try {
      setCalculatingBlast(true);
      const res = await api.getBlastRadius(activeSheetId, assetId);
      setBlastResult(res);

      const reachableSet = new Set(res.reachable_asset_ids);
      reachableSet.add(res.origin_asset_id);

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isOrigin: n.id === res.origin_asset_id,
            isHighlighted: reachableSet.has(n.id) && n.id !== res.origin_asset_id,
            isDimmed: !reachableSet.has(n.id),
          },
        }))
      );

      setEdges((eds) =>
        eds.map((e) => {
          const isHighlighted = reachableSet.has(e.source) && reachableSet.has(e.target);
          return {
            ...e,
            animated: isHighlighted,
            style: {
              ...e.style,
              stroke: isHighlighted ? 'var(--risk-critical)' : 'var(--border-subtle)',
              strokeWidth: isHighlighted ? 2.5 : 1.5,
              opacity: isHighlighted ? 1 : 0.3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isHighlighted ? 'var(--risk-critical)' : 'var(--border-subtle)',
            },
          };
        })
      );
    } catch (err) {
      console.error('Failed to calculate impact spread:', err);
    } finally {
      setCalculatingBlast(false);
    }
  };

  const handleNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node.data);
    triggerBlastRadius(node.id);
  }, [activeSheetId]);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setBlastResult(null);
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isOrigin: false, isHighlighted: false, isDimmed: false } })));
    setEdges((eds) => eds.map((e) => ({
      ...e,
      animated: false,
      style: { strokeWidth: 1.5, stroke: 'var(--border-strong)', opacity: 1 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--border-strong)' },
    })));
  }, [setNodes, setEdges]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'var(--risk-critical)';
      case 'high': return 'var(--risk-high)';
      case 'medium': return 'var(--risk-medium)';
      case 'low': return 'var(--risk-low)';
      default: return 'var(--risk-medium)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-4 h-4 text-cyber-blue" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate">
              Network Analysis
            </span>
          </div>
          <h1 className="text-3xl font-bold text-ink">{t('spread.title')}</h1>
          <p className="text-slate mt-2 max-w-2xl text-sm">
            {t('spread.subtitle')}
            <strong className="text-ink font-semibold ml-1">{t('spread.subtitle2')}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHelp(!showHelp)} className="btn-secondary">
            <Info className="w-4 h-4" />
            {t('spread.howToUse')}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="tarazu-card p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-ink mb-3">{t('spread.guide.readMap')}</h3>
                <ul className="text-sm text-slate space-y-2">
                  <li>{t('spread.guide.redNodes')}</li>
                  <li>{t('spread.guide.highlighted')}</li>
                  <li>{t('spread.guide.dimmed')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-ink mb-3">{t('spread.guide.borders')}</h3>
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <span className="text-risk-critical">{t('spread.guide.critical')}</span>
                  <span className="text-risk-high">{t('spread.guide.high')}</span>
                  <span className="text-risk-medium">{t('spread.guide.medium')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sheets.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectSheet(s.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap border ${
              activeSheetId === s.id
                ? 'bg-cyber-blue text-white border-cyber-blue shadow-md'
                : 'bg-surface hover:bg-surface-2 border-border-dim text-slate'
            }`}
          >
            {s.name} {s.type === 'combined' ? '(Combined)' : ''}
          </button>
        ))}
      </div>

      {/* ── Alert Banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {blastResult && blastResult.reachable_asset_ids.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="tarazu-card bg-risk-critical/5 border-risk-critical/20 p-5 flex items-start gap-4"
          >
            <div className="p-3 bg-risk-critical/10 rounded-lg shrink-0">
              <AlertTriangle className="w-6 h-6 text-risk-critical" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-ink">
                {t('spread.alert.exposure')} <span className="text-risk-critical">{formatInr(blastResult.total_downstream_exposure_inr)}</span>
              </h3>
              <p className="text-sm text-slate mt-1">
                {t('spread.alert.desc')} <strong className="text-risk-critical">{blastResult.origin_asset_name}</strong> {t('spread.alert.desc2')} {blastResult.reachable_asset_ids.length} {t('spread.alert.desc3')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Canvas Area ──────────────────────────────────────────────────── */}
      <div className="relative h-[650px] rounded-xl border border-border-dim bg-surface overflow-hidden shadow-inner">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
            <RefreshCw className="w-8 h-8 text-cyber-blue animate-spin" />
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-right"
          className="bg-page"
        >
          <Background color="var(--border-strong)" gap={20} size={1} />
          <Controls className="bg-surface border border-border-dim shadow-soft rounded-lg overflow-hidden [&>button]:border-b [&>button]:border-border-dim [&>button]:text-ink hover:[&>button]:bg-surface-2" />
        </ReactFlow>

        {/* ── Detail Panel ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-80 bg-surface border border-border-dim rounded-xl shadow-elevated overflow-hidden z-10"
            >
              <div className="p-5 border-b border-border-dim flex justify-between items-start">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-slate mb-1">
                    {selectedNode.asset_type?.replace(/_/g, ' ') || 'Asset'}
                  </div>
                  <h3 className="font-bold text-lg text-ink">{selectedNode.label}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm font-semibold" style={{ color: getRiskColor(selectedNode.risk_level) }}>
                    <Shield className="w-4 h-4" />
                    <span className="capitalize">{selectedNode.risk_level} Risk</span>
                  </div>
                </div>
                <button onClick={handlePaneClick} className="p-1 text-slate hover:bg-surface-2 rounded-md">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-4 bg-surface-2 rounded-lg border border-border-dim">
                  <div className="text-xs font-semibold text-slate mb-1">{t('spread.panel.exposure')}</div>
                  <div className="text-2xl font-bold text-ink">{formatInr(selectedNode.eal_inr || 0)}</div>
                  <div className="text-xs text-slate mt-1">{selectedNode.revenue_dependency_pct}{t('spread.panel.revDep')}</div>
                </div>

                {selectedNode.cves && selectedNode.cves.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate mb-2">{t('spread.panel.weaknesses')}</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.cves.map((cve: string) => (
                        <span key={cve} className="text-[10px] font-mono font-bold px-2 py-1 bg-risk-critical/10 text-risk-critical rounded">
                          {cve}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
