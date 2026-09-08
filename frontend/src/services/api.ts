/**
 * services/api.ts — HTTP client for Tarazu CyberRiskQuant backend with resilient demo fallbacks.
 */
import {
  Organization,
  Sheet,
  Asset,
  GraphData,
  BlastRadiusResult,
  Control,
  OptimizeResult,
  WhatIfResult,
  ComplianceSummary,
  DemoComparison,
  CorrelationResult,
  DashboardSummary,
  CVEMatch,
} from '../types';
import {
  DEMO_ORG,
  DEMO_SHEETS,
  DEMO_ASSETS,
  DEMO_DASHBOARD,
  DEMO_CONTROLS,
  DEMO_COMPARISON,
  DEMO_OPTIMIZE_RESULT,
  DEMO_WHATIF_RESULT,
  DEMO_COMPLIANCE_RBI,
  DEMO_COMPLIANCE_ISO,
  DEMO_GRAPH_DATA,
  DEMO_BLAST_RADIUS,
} from './demoData';

const API_BASE = '/api';
const developmentApiKey = import.meta.env.VITE_API_KEY;

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(developmentApiKey ? { 'X-API-Key': developmentApiKey } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `API error ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Health
  getHealth: async () => {
    try {
      return await request<{ status: string; ai_enabled: boolean; groq_model: string }>('/health');
    } catch {
      return { status: 'healthy', ai_enabled: false, groq_model: 'llama-3.3-70b-versatile (Simulated)' };
    }
  },

  // Organizations
  listOrganizations: async (): Promise<Organization[]> => {
    try {
      const res = await request<Organization[]>('/organizations');
      if (Array.isArray(res) && res.length > 0) return res;
      return [DEMO_ORG];
    } catch {
      return [DEMO_ORG];
    }
  },
  createOrganization: (data: Partial<Organization>) =>
    request<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  seedOrganization: () =>
    request<Organization>('/organizations/seed', { method: 'POST' }),
  getDemoComparison: async (): Promise<DemoComparison> => {
    try {
      return await request<DemoComparison>('/organizations/demo-comparison');
    } catch {
      return DEMO_COMPARISON;
    }
  },

  // Sheets
  listSheets: async (orgId: string): Promise<Sheet[]> => {
    try {
      const res = await request<Sheet[]>(`/sheets?org_id=${orgId}`);
      if (Array.isArray(res) && res.length > 0) return res;
      return DEMO_SHEETS;
    } catch {
      return DEMO_SHEETS;
    }
  },
  createSheet: (data: { org_id: string; name: string; type?: string; source_sheet_ids?: string[] }) =>
    request<Sheet>('/sheets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSheet: (sheetId: string) => request<any>(`/sheets/${sheetId}`),
  combineSheets: async (data: { org_id: string; name: string; source_sheet_ids: string[] }): Promise<CorrelationResult> => {
    try {
      return await request<CorrelationResult>('/sheets/combine', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        combined_sheet_id: 'sheet-combined-demo',
        naive_sum_inr: 16300000,
        adjusted_inr: 18745000,
        adjustment_pct: 15,
        cross_edge_count: 7,
        ai_narrative: 'Cross-segment lateral traversal detected between Corporate IT VPN Gateway and Payment Systems Core Banking Application Server.',
        ai_mode: 'rules_only',
      };
    }
  },
  getSheetCorrelation: async (sheetId: string): Promise<CorrelationResult> => {
    try {
      return await request<CorrelationResult>(`/sheets/${sheetId}/correlation`);
    } catch {
      return {
        combined_sheet_id: sheetId,
        naive_sum_inr: 16300000,
        adjusted_inr: 18745000,
        adjustment_pct: 15,
        cross_edge_count: 7,
        ai_narrative: 'Cross-segment lateral traversal detected between Corporate IT VPN Gateway and Payment Systems Core Banking Application Server.',
        ai_mode: 'rules_only',
      };
    }
  },

  // Assets
  listAssets: async (sheetId: string): Promise<Asset[]> => {
    try {
      const res = await request<Asset[]>(`/assets?sheet_id=${sheetId}`);
      if (Array.isArray(res) && res.length > 0) return res;
      return DEMO_ASSETS[sheetId] || DEMO_ASSETS['sheet-corp-it'] || [];
    } catch {
      return DEMO_ASSETS[sheetId] || DEMO_ASSETS['sheet-corp-it'] || [];
    }
  },
  createAssetGuided: (data: {
    sheet_id: string;
    name: string;
    asset_type: string;
    criticality_tag: string;
    revenue_dependency_pct: number;
    cve_id?: string | null;
    cvss_score?: number | null;
    vuln_description?: string;
    days_unpatched?: number;
    metadata_json?: Record<string, any>;
  }) =>
    request<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAsset: (assetId: string) => request<Asset>(`/assets/${assetId}`),

  // CVE
  searchCve: async (query: string): Promise<CVEMatch[]> => {
    try {
      return await request<CVEMatch[]>(`/cve/search?query=${encodeURIComponent(query)}`);
    } catch {
      return [
        { cve_id: 'CVE-2024-21412', cvss_score: 8.1, description: 'Windows SmartScreen bypass vulnerability allowing code execution' },
        { cve_id: 'CVE-2023-4966', cvss_score: 9.4, description: 'Citrix Bleed unauthenticated session hijacking' },
        { cve_id: 'CVE-2021-44228', cvss_score: 10.0, description: 'Log4Shell Apache Log4j2 JNDI RCE' },
      ];
    }
  },

  // Graph & Blast Radius
  getGraph: async (sheetId: string): Promise<GraphData> => {
    try {
      return await request<GraphData>(`/graph/${sheetId}`);
    } catch {
      return DEMO_GRAPH_DATA[sheetId] || DEMO_GRAPH_DATA.default;
    }
  },
  createEdge: (data: { sheet_id: string; source_asset_id: string; target_asset_id: string; dependency_strength: string }) =>
    request<any>('/graph/edge', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteEdge: (edgeId: string) =>
    request<void>(`/graph/edge/${edgeId}`, {
      method: 'DELETE',
    }),
  getBlastRadius: async (sheetId: string, assetId: string): Promise<BlastRadiusResult> => {
    try {
      return await request<BlastRadiusResult>(`/graph/${sheetId}/blast-radius/${assetId}`);
    } catch {
      return DEMO_BLAST_RADIUS;
    }
  },

  // Optimization & Live What-If
  listControls: async (orgId: string): Promise<Control[]> => {
    try {
      const res = await request<Control[]>(`/optimization/controls?org_id=${orgId}`);
      if (Array.isArray(res) && res.length > 0) return res;
      return DEMO_CONTROLS;
    } catch {
      return DEMO_CONTROLS;
    }
  },
  optimizeControls: async (orgId: string, budgetInr: number, overriddenStatuses?: Record<string, string>): Promise<OptimizeResult> => {
    try {
      return await request<OptimizeResult>('/optimization/optimize', {
        method: 'POST',
        body: JSON.stringify({
          org_id: orgId,
          budget_inr: budgetInr,
          overridden_statuses: overriddenStatuses,
        }),
      });
    } catch {
      return DEMO_OPTIMIZE_RESULT;
    }
  },
  whatIfSimulation: async (orgId: string, toggledControls: Record<string, string>, sheetId?: string): Promise<WhatIfResult> => {
    try {
      return await request<WhatIfResult>('/optimization/what-if', {
        method: 'POST',
        body: JSON.stringify({
          org_id: orgId,
          sheet_id: sheetId,
          toggled_controls: toggledControls,
        }),
      });
    } catch {
      return DEMO_WHATIF_RESULT;
    }
  },
  updateControl: (controlId: string, data: { status?: string; cost_inr?: number }) =>
    request<Control>(`/optimization/controls/${controlId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Compliance
  getComplianceAll: async (orgId: string): Promise<{ ISO27001: ComplianceSummary; RBI_CSF: ComplianceSummary }> => {
    try {
      return await request<{ ISO27001: ComplianceSummary; RBI_CSF: ComplianceSummary }>(`/compliance/${orgId}/all`);
    } catch {
      return { ISO27001: DEMO_COMPLIANCE_ISO, RBI_CSF: DEMO_COMPLIANCE_RBI };
    }
  },
  getComplianceFramework: async (orgId: string, framework: string): Promise<ComplianceSummary> => {
    try {
      return await request<ComplianceSummary>(`/compliance/${orgId}?framework=${framework}`);
    } catch {
      return framework === 'ISO27001' ? DEMO_COMPLIANCE_ISO : DEMO_COMPLIANCE_RBI;
    }
  },

  // Reports & Dashboard
  getDashboard: async (orgId: string): Promise<DashboardSummary> => {
    try {
      return await request<DashboardSummary>(`/reports/dashboard/${orgId}`);
    } catch {
      return DEMO_DASHBOARD;
    }
  },
  getAuditReportUrl: (orgId: string) => {
    const query = developmentApiKey ? `?api_key=${encodeURIComponent(developmentApiKey)}` : '';
    return `${API_BASE}/reports/export/${orgId}${query}`;
  },
};
