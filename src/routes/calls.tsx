import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { OutcomeBadge } from "@/components/status-badge";
import { useCrm } from "@/hooks/use-crm";
import { fmtDateTime, isSameDay } from "@/utils/format";
import { CALL_OUTCOMES, type CallOutcome, type Call } from "@/types";
import { KpiCard } from "@/components/kpi-card";

export const Route = createFileRoute("/calls")({
  head: () => ({
    meta: [
    { title: "Call Tracker – AI Resume Builder" },
      { name: "description", content: "Log calls, outcomes and notes for your leads." },
    ],
  }),
  component: CallsPage,
});

// Outcomes that require a follow-up date
// (any outcome where the lead isn't fully closed needs a reminder date)
const NEEDS_FOLLOW_UP: CallOutcome[] = [
  "Interested",
  "Call Back Later",
  "Busy",
  "No Answer",
];

function CallsPage() {
  const { calls, leads, addCall, deleteCall } = useCrm();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"today" | "yesterday" | "week" | "month">("today");
  const [deleteTarget, setDeleteTarget] = useState<Call | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = useMemo(() => ({
    today: calls.filter((c) => isSameDay(new Date(c.callDate), now)).length,
    yesterday: calls.filter((c) => isSameDay(new Date(c.callDate), yesterday)).length,
    week: calls.filter((c) => new Date(c.callDate) >= startOfWeek).length,
    month: calls.filter((c) => new Date(c.callDate) >= startOfMonth).length,
  }), [calls]);

  const filteredCalls = useMemo(() => {
    return [...calls]
      .filter((c) => {
        const d = new Date(c.callDate);
        if (filter === "today") return isSameDay(d, now);
        if (filter === "yesterday") return isSameDay(d, yesterday);
        if (filter === "week") return d >= startOfWeek;
        if (filter === "month") return d >= startOfMonth;
        return true;
      })
      .sort((a, b) => +new Date(b.callDate) - +new Date(a.callDate));
  }, [calls, filter]);

  const handleLogCall = async (v: {
    leadId: string; callDate: string; duration: number;
    outcome: CallOutcome; remarks?: string; nextFollowUp?: string;
  }) => {
    try {
      const lead = leads.find((l) => l.id === v.leadId);
      if (!lead) return;
      await addCall({
        leadId: lead.id,
        leadName: lead.name,
        callDate: new Date(v.callDate).toISOString(),
        durationMinutes: v.duration,
        duration: v.duration,
        outcome: v.outcome,
        remarks: v.remarks,
        nextFollowUp: v.nextFollowUp ? new Date(v.nextFollowUp).toISOString() : undefined,
      });
      toast.success("Call logged successfully");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to log call");
    }
  };

  const handleDeleteCall = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCall(deleteTarget.id);
      toast.success("Call removed");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete call");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Today's Calls" value={stats.today} icon="fa-solid fa-phone" tone="primary" />
        <KpiCard label="Yesterday's Calls" value={stats.yesterday} icon="fa-solid fa-phone-slash" tone="warning" />
        <KpiCard label="Last 7 Days" value={stats.week} icon="fa-solid fa-calendar-week" tone="info" />
        <KpiCard label="This Month" value={stats.month} icon="fa-solid fa-calendar" tone="success" />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["today", "yesterday", "week", "month"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {f === "week" ? "Last 7 Days" : f === "month" ? "Last 30 Days" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setOpen(true)}
          disabled={leads.length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <i className="fa-solid fa-plus" /> Log Call
        </button>
      </div>

      {filteredCalls.length === 0 ? (
        <EmptyState
          icon="fa-solid fa-phone-volume"
          title="No calls found"
          description="No calls match the selected filter. Try a different time range or log a new call."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Lead</th>
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">Duration</th>
                  <th className="px-5 py-3 text-left font-medium">Outcome</th>
                  <th className="px-5 py-3 text-left font-medium">Remarks</th>
                  <th className="px-5 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCalls.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{c.leadName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{fmtDateTime(c.callDate)}</td>
                    <td className="px-5 py-3">{c.durationMinutes} min</td>
                    <td className="px-5 py-3"><OutcomeBadge outcome={c.outcome} /></td>
                    <td className="px-5 py-3 max-w-xs truncate text-muted-foreground">
                      {c.remarks ?? c.notes ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <i className="fa-solid fa-trash text-xs" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LogCallDialog open={open} onOpenChange={setOpen} onSubmit={handleLogCall} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Call Log"
        description={`Are you sure you want to remove this call log for "${deleteTarget?.leadName}"? This cannot be undone.`}
        confirmLabel={deleteLoading ? "Deleting…" : "Delete"}
        destructive
        onConfirm={handleDeleteCall}
      />
    </div>
  );
}

function LogCallDialog({ open, onOpenChange, onSubmit }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: {
    leadId: string; callDate: string; duration: number;
    outcome: CallOutcome; remarks?: string; nextFollowUp?: string;
  }) => void;
}) {
  const { leads } = useCrm();
  const [leadId, setLeadId] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [callDate, setCallDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState(10);
  const [outcome, setOutcome] = useState<CallOutcome>("Interested");
  const [remarks, setRemarks] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  const showFollowUpDate = NEEDS_FOLLOW_UP.includes(outcome);

  const filteredLeads = useMemo(
    () => leads.filter((l) =>
      l.name.toLowerCase().includes(leadSearch.toLowerCase())
    ),
    [leads, leadSearch]
  );

  const handleSelectLead = (id: string, name: string) => {
    setLeadId(id);
    setLeadName(name);
    setLeadSearch(name);
    setShowDropdown(false);
  };

  const handleClose = () => {
    setLeadId("");
    setLeadName("");
    setLeadSearch("");
    setShowDropdown(false);
    setCallDate(new Date().toISOString().slice(0, 16));
    setDuration(10);
    setOutcome("Interested");
    setRemarks("");
    setNextFollowUp("");
    onOpenChange(false);
  };

  const handleOutcomeChange = (val: CallOutcome) => {
    setOutcome(val);
    if (!NEEDS_FOLLOW_UP.includes(val)) setNextFollowUp("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log a Call</DialogTitle>
          <DialogDescription>Record the outcome of a sales conversation.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={(e) => {
          e.preventDefault();
          if (!leadId) return;
          onSubmit({
            leadId,
            callDate,
            duration,
            outcome,
            remarks: remarks || undefined,
            nextFollowUp: showFollowUpDate && nextFollowUp ? nextFollowUp : undefined,
          });
        }}>
          <div className="grid gap-1.5">
            <span className="text-xs font-medium">Lead *</span>

            {/* Searchable lead picker */}
            <div className="relative">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search leads by name…"
                  value={leadSearch}
                  onChange={(e) => {
                    setLeadSearch(e.target.value);
                    setLeadId("");
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  className={`${inputCls} pl-8`}
                />
                {leadId && (
                  <i className="fa-solid fa-circle-check absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs pointer-events-none" />
                )}
              </div>

              {/* Dropdown results */}
              {showDropdown && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg max-h-48 overflow-y-auto">
                  {filteredLeads.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No leads found</div>
                  ) : (
                    filteredLeads.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onMouseDown={() => handleSelectLead(l.id, l.name)}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                          leadId === l.id ? "bg-primary/10 font-medium text-primary" : ""
                        }`}
                      >
                        {l.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Hidden required input to enforce lead selection */}
            <input type="text" required value={leadId} onChange={() => {}} className="sr-only" tabIndex={-1} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium">Call Date</span>
              <input type="datetime-local" value={callDate} onChange={(e) => setCallDate(e.target.value)} className={inputCls} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium">Duration (min)</span>
              <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputCls} />
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium">Outcome</span>
            <select value={outcome} onChange={(e) => handleOutcomeChange(e.target.value as CallOutcome)} className={inputCls}>
              {CALL_OUTCOMES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>

          {showFollowUpDate && (
            <label className="grid gap-1.5">
              <span className="text-xs font-medium">Next Follow Up Date</span>
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className={inputCls}
              />
            </label>
          )}

          <label className="grid gap-1.5">
            <span className="text-xs font-medium">Remarks</span>
            <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)}
              className={`${inputCls} resize-none py-2`} placeholder="Summary, next step…" />
          </label>

          <DialogFooter>
            <button type="button" onClick={handleClose}
              className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">
              Cancel
            </button>
            <button type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <i className="fa-solid fa-check" /> Save Call
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const inputCls = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";