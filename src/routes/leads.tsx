import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { SourceBadge, StatusBadge } from "@/components/status-badge";
import { LeadFormDialog } from "@/components/lead-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useCrm } from "@/hooks/use-crm";
import { fmtDate } from "@/utils/format";
import { LEAD_SOURCES, LEAD_STATUSES, type Lead, type LeadSource, type LeadStatus } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
    { title: "Leads – AI Resume Builder" },
      { name: "description", content: "Manage your sales leads, sources and pipeline status." },
    ],
  }),
  component: LeadsPage,
});

const PAGE_SIZE = 8;

function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead } = useCrm();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All">("All");
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "All">("All");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);

  // leads are already sorted newest first from use-crm
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      if (sourceFilter !== "All" && l.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.mobile.toLowerCase().includes(q)
      );
    });
  }, [leads, query, statusFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

 const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editing) {
        // Allow same mobile for the lead being edited
        const duplicate = leads.find(
          (l) => l.mobile === values.mobile && l.id !== editing.id
        );
        if (duplicate) {
          toast.error(`A lead with mobile ${values.mobile} already exists (${duplicate.name})`);
          setLoading(false);
          return;
        }
        await updateLead(editing.id, values);
        toast.success("Lead updated successfully");
      } else {
        // Check duplicate mobile before calling API
        const duplicate = leads.find((l) => l.mobile === values.mobile);
        if (duplicate) {
          toast.error(`A lead with mobile ${values.mobile} already exists (${duplicate.name})`);
          setLoading(false);
          return;
        }
        await addLead(values);
        toast.success("Lead added successfully");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err: any) {
      const msg = err.message || "Something went wrong";
      if (msg.toLowerCase().includes("mobile") && msg.toLowerCase().includes("exists")) {
        toast.error("A lead with this mobile number already exists");
      } else if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("exists")) {
        toast.error("A lead with this email already exists");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteLead(deleteTarget.id);
      toast.success("Lead deleted");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search leads by name, email, mobile…"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as LeadStatus | "All"); setPage(1); }}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        >
          <option value="All">All statuses</option>
          {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>

        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value as LeadSource | "All"); setPage(1); }}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        >
          <option value="All">All sources</option>
          {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>

        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <i className="fa-solid fa-plus" /> Add Lead
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="fa-solid fa-user-plus"
          title="No leads found"
          description="Try clearing search or filters, or add a new lead to start tracking."
          action={
            <button
              onClick={() => { setEditing(null); setFormOpen(true); }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <i className="fa-solid fa-plus" /> Add your first lead
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Lead</th>
                  <th className="px-5 py-3 text-left font-medium">Contact</th>
                  <th className="px-5 py-3 text-left font-medium">Source</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Next Follow-up</th>
                  <th className="px-5 py-3 text-left font-medium">Created</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageItems.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                          {l.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{l.name}</p>
                          {l.notes && <p className="truncate text-xs text-muted-foreground">{l.notes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-foreground">{l.mobile}</p>
                      <p className="text-xs text-muted-foreground">{l.email}</p>
                    </td>
                    <td className="px-5 py-3"><SourceBadge source={l.source} /></td>
                    <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                    <td className={cn("px-5 py-3 text-foreground",
                      l.nextFollowUp && new Date(l.nextFollowUp) < new Date(new Date().toDateString()) && "text-destructive font-medium"
                    )}>
                      {l.nextFollowUp ? fmtDate(l.nextFollowUp) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{fmtDate(l.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => { setEditing(l); setFormOpen(true); }}
                          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="Edit"
                        >
                          <i className="fa-solid fa-pen text-xs" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(l)}
                          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Delete"
                        >
                          <i className="fa-solid fa-trash text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <i className="fa-solid fa-chevron-left text-[10px]" />
              </button>
              <span className="px-3 text-foreground font-medium">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
              >
                <i className="fa-solid fa-chevron-right text-[10px]" />
              </button>
            </div>
          </div>
        </div>
      )}

      <LeadFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        initial={editing}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Lead"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={loading ? "Deleting…" : "Delete"}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}