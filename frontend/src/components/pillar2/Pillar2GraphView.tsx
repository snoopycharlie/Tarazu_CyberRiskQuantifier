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
  BackgroundVariant,
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
import { containerVariants, itemVariants, slideUpVariants } from '../../utils/animations';

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

  let borderColor = 'var(--border-dim)';
  let bgColor = 'var(--bg-surface)';
  let iconColor = 'var(--text-secondary)';

  if (risk === 'critical') { borderColor = 'var(--risk-critical)'; iconColor = 'var(--risk-critical)'; }
  else if (risk === 'high') { borderColor = 'var(--risk-high)'; iconColor = 'var(--risk-high)'; }
  else if (risk === 'medium') { borderColor = 'var(--risk-medium)'; iconColor = 'var(--risk-medium)'; }
  else if (risk === 'low') { borderColor = 'var(--risk-low)'; iconColor = 'var(--risk-low)'; }

  if (isOrigin) {
    bgColor = 'var(--risk-critical-bg)';
    borderColor = 'var(--risk-critical)';
  } else if (isHighlighted) {
    bgColor = 'var(--risk-high-bg)';
    borderColor = 'var(--risk-high)';
  }

  const showWarning = (risk === 'critical' || risk === 'high') && !isDimmed;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: Math.random() * 0.3, type: 'spring' }}
      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 shadow-sm ${selected ? 'shadow-lg scale-105' : ''} ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}`}
      style={{ minWidth: 230, backgroundColor: bgColor, borderColor: borderColor }}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />

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

      <div className="p-2 rounded-lg shrink-0" style={{ background: 'var(--bg-page)', color: iconColor }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{data.label as string}</div>
        <div className="text-[10px] uppercase font-bold tracking-wider truncate" style={{ color: 'var(--text-muted)' }}>
          {data.asset_type ? (data.asset_type as string).replace(/_/g, ' ') : 'Asset'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </motion.div>
  );
};

const nodeTypes = { asset: AssetNode };

// ── Layout calculation (Dagre) ────────────────────────────────────────────────
const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';

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
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const { t } = useLanguage();

  // Store raw graph data so we can re-layout without re-fetching
  const [rawGraphData, setRawGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });

  useEffect(() => {
    if (activeSheetId) loadGraph(activeSheetId);
  }, [activeSheetId]);

  // Re-apply layout when direction changes (no re-fetch needed)
  useEffect(() => {
    if (rawGraphData.nodes.length > 0) {
      const { nodes: ln, edges: le } = getLayoutedElements(rawGraphData.nodes, rawGraphData.edges, layoutDirection);
      setNodes(ln);
      setEdges(le);
    }
  }, [layoutDirection]);

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

      setRawGraphData({ nodes: rawNodes, edges: rawEdges });
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges, layoutDirection);
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
      variants={containerVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className="space-y-6"
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="page-eyebrow">
              Network Analysis
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('spread.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('spread.subtitle')}
            <strong className="font-semibold ml-1" style={{ color: 'var(--text-primary)' }}>{t('spread.subtitle2')}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLayoutDirection(d => d === 'TB' ? 'LR' : 'TB')}
            className="btn-secondary flex items-center gap-2 px-4 py-2 text-xs"
            title="Toggle layout direction"
          >
            <span>{layoutDirection === 'TB' ? '↔ Horizontal' : '↕ Vertical'}</span>
          </button>
          <button onClick={() => setShowHelp(!showHelp)} className="btn-secondary flex items-center gap-2 px-4 py-2">
            <Info className="w-4 h-4" />
            {t('spread.howToUse')}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="tarazu-card p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{t('spread.guide.readMap')}</h3>
                <ul className="text-sm space-y-2 list-disc list-inside" style={{ color: 'var(--text-secondary)' }}>
                  <li>{t('spread.guide.redNodes')}</li>
                  <li>{t('spread.guide.highlighted')}</li>
                  <li>{t('spread.guide.dimmed')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{t('spread.guide.borders')}</h3>
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <span style={{ color: 'var(--risk-critical)' }}>{t('spread.guide.critical')}</span>
                  <span style={{ color: 'var(--risk-high)' }}>{t('spread.guide.high')}</span>
                  <span style={{ color: 'var(--risk-medium)' }}>{t('spread.guide.medium')}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {sheets.map((s) => {
          const isActive = activeSheetId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelectSheet(s.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap border ${
                isActive ? 'shadow-md' : 'hover:border-slate-500/30'
              }`}
              style={isActive ? {
                background: 'var(--accent-primary)',
                borderColor: 'var(--accent-primary)',
                color: '#fff'
              } : {
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-dim)',
                color: 'var(--text-secondary)'
              }}
            >
              {s.name} {s.type === 'combined' ? '(Combined)' : ''}
            </button>
          );
        })}
      </motion.div>

      {/* ── Alert Banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {blastResult && blastResult.reachable_asset_ids.length > 0 && (
          <motion.div
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="tarazu-card p-5 flex items-start gap-4"
            style={{ background: 'var(--risk-critical-bg)', borderColor: 'var(--risk-critical-border)' }}
          >
            <div className="p-3 rounded-lg shrink-0" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
              <AlertTriangle className="w-6 h-6" style={{ color: 'var(--risk-critical)' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {t('spread.alert.exposure')} <span style={{ color: 'var(--risk-critical)' }}>{formatInr(blastResult.total_downstream_exposure_inr)}</span>
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t('spread.alert.desc')} <strong style={{ color: 'var(--risk-critical)' }}>{blastResult.origin_asset_name}</strong> {t('spread.alert.desc2')} {blastResult.reachable_asset_ids.length} {t('spread.alert.desc3')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Canvas Area ──────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="relative h-[650px] rounded-xl border overflow-hidden shadow-inner" style={{ borderColor: 'var(--border-dim)', background: 'radial-gradient(circle at center, var(--bg-surface) 0%, var(--bg-elevated) 100%)' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(var(--bg-surface-rgb), 0.8)' }}>
            <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
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
          <Background color="var(--border-dim)" variant={BackgroundVariant.Lines} gap={30} size={1} className="opacity-40" />
          <Controls className="bg-surface border border-border-dim shadow-soft rounded-lg overflow-hidden [&>button]:border-b [&>button]:border-border-dim hover:[&>button]:bg-surface-hover" style={{ color: 'var(--text-primary)' }} />
          <MiniMap
            nodeStrokeColor={(n) => {
              const risk = n.data?.risk_level as string;
              if (risk === 'critical') return 'var(--risk-critical)';
              if (risk === 'high') return 'var(--risk-high)';
              if (risk === 'medium') return 'var(--risk-medium)';
              return 'var(--border-strong)';
            }}
            nodeColor={(n) => {
              const risk = n.data?.risk_level as string;
              if (risk === 'critical') return 'rgba(232,40,45,0.2)';
              if (risk === 'high') return 'rgba(245,124,0,0.2)';
              if (risk === 'medium') return 'rgba(0,196,180,0.15)';
              return 'var(--bg-surface-hover)';
            }}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
            }}
          />
        </ReactFlow>

        {/* ── Detail Panel ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-80 rounded-xl shadow-elevated overflow-hidden z-10 border"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-dim)' }}
            >
              <div className="p-5 border-b flex justify-between items-start" style={{ borderColor: 'var(--border-dim)' }}>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                    {selectedNode.asset_type?.replace(/_/g, ' ') || 'Asset'}
                  </div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{selectedNode.label}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm font-semibold" style={{ color: getRiskColor(selectedNode.risk_level) }}>
                    <Shield className="w-4 h-4" />
                    <span className="capitalize">{selectedNode.risk_level} Risk</span>
                  </div>
                </div>
                <button onClick={handlePaneClick} className="p-1 rounded-md transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor='var(--bg-surface-hover)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor='transparent'}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-4 rounded-lg border" style={{ background: 'var(--bg-surface-hover)', borderColor: 'var(--border-dim)' }}>
                  <div className="section-label mb-1">{t('spread.panel.exposure')}</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatInr(selectedNode.eal_inr || 0)}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{selectedNode.revenue_dependency_pct}{t('spread.panel.revDep')}</div>
                </div>

                {selectedNode.cves && selectedNode.cves.length > 0 && (
                  <div>
                    <div className="section-label mb-2">{t('spread.panel.weaknesses')}</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.cves.map((cve: string) => (
                        <a 
                          key={cve} 
                          href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="risk-badge-critical text-[10px] px-2 py-1 hover:underline"
                        >
                          {cve}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
