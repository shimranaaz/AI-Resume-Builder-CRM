import { cn } from "@/lib/utils";
import type { CallOutcome, LeadSource, LeadStatus } from "@/types";

const statusClass: Record<LeadStatus, string> = {
  "New Lead": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Called": "bg-muted text-muted-foreground border-border",
  "Interested": "bg-green-500/10 text-green-600 border-green-500/20",
  "Follow Up": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "Demo Scheduled": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "Demo Completed": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  "Closed Won": "bg-green-600/15 text-green-700 border-green-600/30",
  "Closed Lost": "bg-red-500/10 text-red-500 border-red-500/20",
};

const sourceIcon: Record<LeadSource, string> = {
  LinkedIn: "fa-brands fa-linkedin",
  WhatsApp: "fa-brands fa-whatsapp",
  Website: "fa-solid fa-globe",
  Referral: "fa-solid fa-user-group",
  "Cold Call": "fa-solid fa-phone-volume",
  Other: "fa-solid fa-ellipsis",
};

const outcomeClass: Record<CallOutcome, string> = {
  Interested: "bg-green-500/10 text-green-600 border-green-500/20",
  Busy: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "No Answer": "bg-muted text-muted-foreground border-border",
  "Call Back Later": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Not Interested": "bg-red-500/10 text-red-500 border-red-500/20",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      statusClass[status] ?? "bg-muted text-muted-foreground border-border",
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function SourceBadge({ source }: { source: LeadSource }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <i className={cn(sourceIcon[source] ?? "fa-solid fa-tag", "text-[11px]")} />
      {source}
    </span>
  );
}

export function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      outcomeClass[outcome] ?? "bg-muted text-muted-foreground border-border",
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {outcome}
    </span>
  );
}