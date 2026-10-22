const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error (${res.status}): ${errorBody}`);
  }
  return res.json();
}

export const api = {
  getHealth: () => fetchJson<any>("/health"),
  getDashboardSummary: () => fetchJson<any>("/dashboard/summary"),
  getDashboardCharts: () => fetchJson<any>("/dashboard/charts"),
  
  getConversations: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          query.append(k, String(v));
        }
      });
    }
    return fetchJson<{ records: any[]; count: number }>(`/conversations?${query.toString()}`);
  },

  getConversationDetail: (sourceType: string, sourceId: string) =>
    fetchJson<any>(`/conversations/${sourceType}/${sourceId}`),

  updateConversation: (sourceType: string, sourceId: string, payload: any) =>
    fetchJson<any>(`/conversations/${sourceType}/${sourceId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),

  getRoutingDecisions: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
      });
    }
    return fetchJson<{ decisions: any[]; count: number }>(`/routing?${query.toString()}`);
  },

  approveRoute: (sourceType: string, sourceId: string, payload?: any) =>
    fetchJson<any>(`/routing/${sourceType}/${sourceId}/approve`, {
      method: "POST",
      body: JSON.stringify(payload || {})
    }),

  overrideRoute: (sourceType: string, sourceId: string, payload: any) =>
    fetchJson<any>(`/routing/${sourceType}/${sourceId}/override`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  getAtRiskDeals: () => fetchJson<{ at_risk_records: any[]; count: number }>("/deals/at-risk"),

  getFindings: () => fetchJson<{ findings: any[]; rejected_decisions: any[] }>("/findings"),
  addRejectedDecision: (payload: any) =>
    fetchJson<any>("/findings/decision", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getManagerBrief: () => fetchJson<any>("/findings/manager-brief"),

  replayInitial: () => fetchJson<any>("/imports/replay/initial", { method: "POST" }),
  replayInitialScrambled: () => fetchJson<any>("/imports/replay/initial-scrambled", { method: "POST" }),
  replayUpdate: () => fetchJson<any>("/imports/replay/update", { method: "POST" }),
  replayM07Override: () => fetchJson<any>("/imports/replay/m07-override", { method: "POST" }),
  replayFullSequence: () => fetchJson<any>("/imports/replay/full-sequence", { method: "POST" }),

  uploadEnvelope: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/imports/upload`, {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  createExport: () => fetchJson<any>("/exports", { method: "POST" }),
  listExports: () => fetchJson<{ exports: any[] }>("/exports"),
  getExportDownloadUrl: (exportId: string) => `${API_BASE}/exports/${exportId}/download`,

  getRoutingRules: () => fetchJson<{ rules: any[] }>("/settings/rules"),
  resetDatabase: () => fetchJson<any>("/settings/reset-database", { method: "POST" })
};
