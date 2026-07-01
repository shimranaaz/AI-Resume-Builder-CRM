import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { OutcomeBadge, StatusBadge } from "@/components/status-badge";
import { useCrm } from "@/hooks/use-crm";
import { daysFromNow, fmtDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import { CALL_OUTCOMES, type CallOutcome, type Lead } from "@/types";

export const Route = createFileRoute("/follow-ups")({
  component: FollowUps,
});

type FilterType = "all" | "overdue" | "today" | "tomorrow" | "upcoming";

// (any outcome where the lead isn't fully closed needs a reminder date)
const NEEDS_FOLLOW_UP: CallOutcome[] = [
  "Interested",
  "Call Back Later",
  "Busy",
  "No Answer",
];

function FollowUps() {
const { leads, calls, updateLead, addCall } = useCrm();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [logCallLead, setLogCallLead] = useState<Lead | null>(null);

  const pendingLeads = useMemo(() =>
    leads.filter(
      (l) => l.nextFollowUp && !["Closed Won", "Closed Lost"].includes(l.status)
    ),
    [leads]
  );

  const groups = useMemo(() => {
    const overdue: Lead[] = [];
    const today: Lead[] = [];
    const tomorrow: Lead[] = [];
    const upcoming: Lead[] = [];

    pendingLeads.forEach((l) => {
      const diff = daysFromNow(l.nextFollowUp!);
      if (diff < 0) overdue.push(l);
      else if (diff === 0) today.push(l);
      else if (diff === 1) tomorrow.push(l);
      else upcoming.push(l);
    });

    const byDate = (a: Lead, b: Lead) =>
      +new Date(a.nextFollowUp!) - +new Date(b.nextFollowUp!);

    return {
      overdue: overdue.sort(byDate),
      today: today.sort(byDate),
      tomorrow: tomorrow.sort(byDate),
      upcoming: upcoming.sort(byDate),
    };
  }, [pendingLeads]);

  const filteredLeads = useMemo(() => {
    let list: Lead[];
    if (filter === "overdue") list = groups.overdue;
    else if (filter === "today") list = groups.today;
    else if (filter === "tomorrow") list = groups.tomorrow;
    else if (filter === "upcoming") list = groups.upcoming;
    else list = [...groups.overdue, ...groups.today, ...groups.tomorrow, ...groups.upcoming];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.mobile?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, groups, search]);
  const totalCount =
    groups.overdue.length +
    groups.today.length +
    groups.tomorrow.length +
    groups.upcoming.length;

  const handleMarkComplete = async (lead: Lead) => {
    try {
      await updateLead(lead.id, { nextFollowUp: undefined });
      toast.success(`${lead.name}'s follow-up marked as done`);
    } catch {
      toast.error("Failed to update follow-up");
    }
  };

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
      setLogCallLead(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to log call");
    }
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalCount },
    { key: "overdue", label: "Overdue", count: groups.overdue.length },
    { key: "today", label: "Today", count: groups.today.length },
    { key: "tomorrow", label: "Tomorrow", count: groups.tomorrow.length },
    { key: "upcoming", label: "Upcoming", count: groups.upcoming.length },
  ];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Overdue" count={groups.overdue.length} tone="destructive" icon="fa-solid fa-circle-exclamation" />
        <SummaryCard label="Today" count={groups.today.length} tone="warning" icon="fa-solid fa-calendar-day" />
        <SummaryCard label="Tomorrow" count={groups.tomorrow.length} tone="info" icon="fa-solid fa-calendar-plus" />
        <SummaryCard label="Upcoming" count={groups.upcoming.length} tone="success" icon="fa-solid fa-calendar" />
      </div>

      {/* Filter Bar */}
     <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-muted-foreground hover:bg-muted"
            )}
          >
            {f.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-xs font-semibold",
              filter === f.key ? "bg-white/20 text-white" : "bg-muted text-foreground"
            )}>
              {f.count}
            </span>
          </button>
    ))}
        </div>
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, mobile or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <i className="fa-solid fa-xmark text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Lead Cards */}
      {filteredLeads.length === 0 ? (
        <EmptyState
          icon="fa-solid fa-calendar-check"
          title="No Follow-Ups Found"
          description={
            filter === "all"
              ? "You have no pending follow-ups. Great job staying on top of things!"
              : `No ${filter} follow-ups right now.`
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filteredLeads.map((l) => {
            const d = daysFromNow(l.nextFollowUp!);
            const isOverdue = d < 0;
            return (
              <li
                key={l.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/30",
                  isOverdue ? "border-destructive/30 bg-destructive/5" : "border-border",
                )}
              >
                <div className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
                  isOverdue ? "bg-destructive/15 text-destructive" : "bg-primary-soft text-primary",
                )}>
                  {l.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
<div className="flex items-center justify-between gap-2">
  <p className="truncate text-sm font-medium">{l.name}</p>
  {(() => {
    const lastCall = [...calls]
      .filter((c) => c.leadId === l.id)
      .sort((a, b) => +new Date(b.callDate) - +new Date(a.callDate))[0];
    return lastCall
      ? <OutcomeBadge outcome={lastCall.outcome} />
      : <StatusBadge status={l.status} />;
  })()}
</div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {l.mobile} · {l.email}
                  </p>
                  <p className={cn(
                    "mt-1 inline-flex items-center gap-1.5 text-xs font-medium",
                    isOverdue ? "text-destructive" : "text-muted-foreground",
                  )}>
                    <i className="fa-solid fa-clock text-[10px]" />
                    {fmtDate(l.nextFollowUp!)}
                    {isOverdue && <span>· {Math.abs(d)}d overdue</span>}
                    {d === 0 && <span>· Today</span>}
                    {d === 1 && <span>· Tomorrow</span>}
                    {d > 1 && <span>· in {d}d</span>}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {/* Log Call button — opens modal pre-filled with this lead */}
                    <button
                      onClick={() => setLogCallLead(l)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <i className="fa-solid fa-phone text-[10px]" /> Log Call
                    </button>
                    <button
                      onClick={() => handleMarkComplete(l)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      <i className="fa-solid fa-check text-[10px]" /> Done
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Log Call Modal — pre-filled with selected lead */}
      <LogCallDialog
        open={!!logCallLead}
        lead={logCallLead}
        onOpenChange={(o) => { if (!o) setLogCallLead(null); }}
        onSubmit={handleLogCall}
      />
    </div>
  );
}

function LogCallDialog({ open, lead, onOpenChange, onSubmit }: {
  open: boolean;
  lead: Lead | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (v: {
    leadId: string; callDate: string; duration: number;
    outcome: CallOutcome; remarks?: string; nextFollowUp?: string;
  }) => void;
}) {
  const [callDate, setCallDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState(10);
  const [outcome, setOutcome] = useState<CallOutcome>("Interested");
  const [remarks, setRemarks] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  const showFollowUpDate = NEEDS_FOLLOW_UP.includes(outcome);

  const handleClose = () => {
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

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Call — {lead.name}</DialogTitle>
          <DialogDescription>
            {lead.mobile} · {lead.email}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            leadId: lead.id,
            callDate,
            duration,
            outcome,
            remarks: remarks || undefined,
            nextFollowUp: showFollowUpDate && nextFollowUp ? nextFollowUp : undefined,
          });
        }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium">Call Date</span>
              <input
                type="datetime-local"
                value={callDate}
                onChange={(e) => setCallDate(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium">Duration (min)</span>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className={inputCls}
              />
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium">Outcome</span>
            <select
              value={outcome}
              onChange={(e) => handleOutcomeChange(e.target.value as CallOutcome)}
              className={inputCls}
            >
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
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className={`${inputCls} resize-none py-2`}
              placeholder="Summary, next step…"
            />
          </label>

          <DialogFooter>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <i className="fa-solid fa-check" /> Save Call
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({ label, count, tone, icon }: {
  label: string; count: number; tone: string; icon: string;
}) {
const cls = "bg-primary/10 text-primary";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={cn("grid h-10 w-10 place-items-center rounded-lg", cls)}>
          <i className={icon} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{count}</p>
        </div>
      </div>
    </div>
  );
}

const inputCls = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";