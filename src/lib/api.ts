const BASE_URL = "http://localhost:5000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "API error");
  return json.data as T;
}

export const api = {
  // Leads
  getLeads: (params?: string) => request<any[]>(`/leads${params ? `?${params}` : ""}`),
  getLeadById: (id: string) => request<any>(`/leads/${id}`),
  createLead: (data: any) => request<any>("/leads", { method: "POST", body: JSON.stringify(data) }),
  updateLead: (id: string, data: any) => request<any>(`/leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteLead: (id: string) => request<any>(`/leads/${id}`, { method: "DELETE" }),

  // Calls
  getCalls: () => request<any[]>("/calls"),
  createCall: (data: any) => request<any>("/calls", { method: "POST", body: JSON.stringify(data) }),
  deleteCall: (id: string) => request<any>(`/calls/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboardStats: () => request<any>("/dashboard/stats"),

  // Audit
  getAuditLogs: () => request<any[]>("/audit"),
};