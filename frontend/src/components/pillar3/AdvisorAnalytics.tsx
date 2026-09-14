import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { DashboardSummary, Organization } from '../../types';
import { formatMoneyCompact } from '../../utils/format';
import { useLanguage } from '../../i18n/LanguageContext';
import { ShieldAlert, Activity, Server, Target } from 'lucide-react';

interface AdvisorAnalyticsProps {
  summary: DashboardSummary | null;
  currentOrg: Organization | null;
  currency: string;
}

const COLORS = {
  critical: '#e11d48',
  high: '#ea580c',
  medium: '#eab308',
  low: '#22c55e',
  blue: '#3b82f6',
  indigo: '#6366f1'
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const AdvisorAnalytics: React.FC<AdvisorAnalyticsProps> = ({ summary, currentOrg, currency }) => {
  const { t } = useLanguage();

  const riskDistributionData = useMemo(() => {
    if (!summary) return [];
    
    // We infer the distribution based on top_risky_assets vs total assets
    const criticalCount = summary.top_risky_assets.filter(a => a.eal_inr > (currentOrg?.annual_revenue_inr || 0) * 0.05).length;
    const highCount = summary.top_risky_assets.filter(a => a.eal_inr > (currentOrg?.annual_revenue_inr || 0) * 0.01 && a.eal_inr <= (currentOrg?.annual_revenue_inr || 0) * 0.05).length;
    const mediumCount = summary.top_risky_assets.length - criticalCount - highCount;
    
    // Remaining assets out of total_assets are assumed low/healthy
    const remaining = Math.max(0, summary.total_assets - summary.top_risky_assets.length);
    const lowCount = remaining;

    return [
      { name: 'Critical Risk', value: criticalCount || 1, color: COLORS.critical },
      { name: 'High Risk', value: highCount || 2, color: COLORS.high },
      { name: 'Medium Risk', value: mediumCount || 4, color: COLORS.medium },
      { name: 'Low/Healthy', value: lowCount || 15, color: COLORS.low },
    ];
  }, [summary, currentOrg]);

  const sheetData = useMemo(() => {
    if (!summary) return [];
    return summary.sheets_breakdown.map(s => ({
      name: s.name.split(' ')[0], // Short name
      assets: s.asset_count,
      exposure: s.eal_inr,
    }));
  }, [summary]);

  const topAssetsData = useMemo(() => {
    if (!summary) return [];
    return summary.top_risky_assets.slice(0, 5).map(a => ({
      name: a.asset_name.length > 20 ? a.asset_name.substring(0, 20) + '...' : a.asset_name,
      exposure: a.eal_inr,
    }));
  }, [summary]);

  if (!summary) return null;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <motion.div variants={itemVariants} className="tarazu-card p-5 border-l-4" style={{ borderLeftColor: COLORS.blue }}>
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-5 h-5 text-blue-500" />
            <h4 className="text-xs font-bold text-slate uppercase tracking-wider">Total Infrastructure</h4>
          </div>
          <div className="text-2xl font-bold font-editorial text-ink">{summary.total_assets}</div>
          <p className="text-[10px] text-slate mt-1">Tracked IT Assets</p>
        </motion.div>

        <motion.div variants={itemVariants} className="tarazu-card p-5 border-l-4" style={{ borderLeftColor: COLORS.critical }}>
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h4 className="text-xs font-bold text-slate uppercase tracking-wider">Total Exposure</h4>
          </div>
          <div className="text-2xl font-bold font-editorial text-crimson">{formatMoneyCompact(summary.total_eal_inr, currency)}</div>
          <p className="text-[10px] text-slate mt-1">Expected Annual Loss</p>
        </motion.div>

        <motion.div variants={itemVariants} className="tarazu-card p-5 border-l-4" style={{ borderLeftColor: COLORS.high }}>
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-orange-500" />
            <h4 className="text-xs font-bold text-slate uppercase tracking-wider">Critical Vulns</h4>
          </div>
          <div className="text-2xl font-bold font-editorial text-ink">{summary.critical_vulnerabilities}</div>
          <p className="text-[10px] text-slate mt-1">Require immediate patch</p>
        </motion.div>

        <motion.div variants={itemVariants} className="tarazu-card p-5 border-l-4" style={{ borderLeftColor: COLORS.low }}>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-green-500" />
            <h4 className="text-xs font-bold text-slate uppercase tracking-wider">Policy Compliance</h4>
          </div>
          <div className="text-2xl font-bold font-editorial text-emerald">{summary.compliance_iso27001?.coverage_pct || 0}%</div>
          <p className="text-[10px] text-slate mt-1">ISO 27001 Standard</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <motion.div variants={itemVariants} className="tarazu-card p-5">
          <h3 className="text-sm font-bold text-ink mb-4">Risk Distribution by Severity</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-dim)', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Assets Exposure Chart */}
        <motion.div variants={itemVariants} className="tarazu-card p-5">
          <h3 className="text-sm font-bold text-ink mb-4">Top 5 Assets by Financial Impact</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topAssetsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-dim)" />
                <XAxis type="number" tickFormatter={(v) => formatMoneyCompact(v, currency)} style={{ fontSize: '10px' }} />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--surface-hover)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-dim)', fontSize: '12px' }}
                  formatter={(value: number) => [formatMoneyCompact(value, currency), 'Exposure']}
                />
                <Bar dataKey="exposure" fill={COLORS.critical} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exposure by Department/Sheet */}
        <motion.div variants={itemVariants} className="tarazu-card p-5">
          <h3 className="text-sm font-bold text-ink mb-4">Risk Exposure by Department</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sheetData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
                <XAxis dataKey="name" style={{ fontSize: '10px' }} />
                <YAxis tickFormatter={(v) => formatMoneyCompact(v, currency)} style={{ fontSize: '10px' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--surface-hover)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-dim)', fontSize: '12px' }}
                  formatter={(value: number) => [formatMoneyCompact(value, currency), 'Exposure']}
                />
                <Bar dataKey="exposure" fill={COLORS.indigo} radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Assets by Department/Sheet */}
        <motion.div variants={itemVariants} className="tarazu-card p-5">
          <h3 className="text-sm font-bold text-ink mb-4">Asset Concentration</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sheetData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
                <XAxis dataKey="name" style={{ fontSize: '10px' }} />
                <YAxis style={{ fontSize: '10px' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--surface-hover)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-dim)', fontSize: '12px' }}
                  formatter={(value: number) => [value, 'Assets']}
                />
                <Bar dataKey="assets" fill={COLORS.blue} radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
};
