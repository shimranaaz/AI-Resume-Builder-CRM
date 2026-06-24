import { createContext, useCallback, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Call, Lead } from "@/types";

interface CrmCtx {
  leads: Lead[];
  calls: Call[];
  hydrated: boolean;
  addLead: (l: Omit<Lead, "id" | "_id" | "createdAt" | "updatedAt">) => Promise<Lead>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addCall: (c: Omit<Call, "id" | "_id">) => Promise<Call>;
  deleteCall: (id: string) => Promise<void>;
  refreshLeads: () => Promise<void>;
  refreshCalls: () => Promise<void>;
}

const Ctx = createContext<CrmCtx | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const normalizeId = (item: any) => ({ ...item, id: item._id ?? item.id });

  const refreshLeads = useCallback(async () => {
    try {
      const data = await api.getLeads();
      // newest first
      setLeads(data.map(normalizeId).sort((a: Lead, b: Lead) =>
        +new Date(b.createdAt) - +new Date(a.createdAt)
      ));
    } catch (e) {
      console.error("Failed to fetch leads", e);
    }
  }, []);

  const refreshCalls = useCallback(async () => {
    try {
      const data = await api.getCalls();
      setCalls(data.map((c: any) => ({
        ...normalizeId(c),
        leadName: c.leadId?.name ?? c.leadName ?? "",
        durationMinutes: c.duration ?? c.durationMinutes ?? 0,
      })));
    } catch (e) {
      console.error("Failed to fetch calls", e);
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshLeads(), refreshCalls()]).finally(() => setHydrated(true));
  }, [refreshLeads, refreshCalls]);

 const addLead = useCallback(async (l: Omit<Lead, "id" | "_id" | "createdAt" | "updatedAt">) => {
    const duplicate = leads.find(
      (existing) => existing.mobile === l.mobile || existing.email === l.email
    );
    if (duplicate) {
      throw new Error(`A lead with this ${duplicate.mobile === l.mobile ? "mobile number" : "email"} already exists`);
    }
    const data = await api.createLead(l);
    const lead = normalizeId(data);
    setLeads((prev) => [lead, ...prev]);
    return lead;
  }, [leads]);
  const updateLead = useCallback(async (id: string, patch: Partial<Lead>) => {
    const data = await api.updateLead(id, patch);
    const updated = normalizeId(data);
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    await api.deleteLead(id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setCalls((prev) => prev.filter((c) => c.leadId !== id));
  }, []);

  const addCall = useCallback(async (c: Omit<Call, "id" | "_id">) => {
    const data = await api.createCall({
      ...c,
      duration: c.durationMinutes ?? c.duration ?? 0,
    });
    const call = {
      ...normalizeId(data),
      leadName: leads.find((l) => l.id === c.leadId)?.name ?? "",
      durationMinutes: data.duration ?? 0,
    };
    // Refresh both so dashboard stats and follow-ups update automatically
    await Promise.all([refreshLeads(), refreshCalls()]);
    return call;
  }, [leads, refreshLeads, refreshCalls]);

  const deleteCall = useCallback(async (id: string) => {
    await api.deleteCall(id);
    setCalls((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = useMemo<CrmCtx>(
    () => ({
      leads, calls, hydrated,
      addLead, updateLead, deleteLead,
      addCall, deleteCall,
      refreshLeads, refreshCalls,
    }),
    [leads, calls, hydrated, addLead, updateLead, deleteLead, addCall, deleteCall, refreshLeads, refreshCalls],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCrm() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCrm must be used inside CrmProvider");
  return ctx;
}