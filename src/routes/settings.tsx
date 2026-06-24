import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import { useCrm } from "@/hooks/use-crm";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
    { title: "Settings — AI Resume Builder" },
      { name: "description", content: "Theme and workspace preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { refreshLeads, refreshCalls } = useCrm();
  const [clearLeadsOpen, setClearLeadsOpen] = useState(false);
  const [clearCallsOpen, setClearCallsOpen] = useState(false);

  const handleClearLeads = async () => {
    try {
      const { api } = await import("@/lib/api");
      const leads = await api.getLeads();
      await Promise.all(leads.map((l: any) => api.deleteLead(l._id ?? l.id)));
      await refreshLeads();
      await refreshCalls();
      toast.success("All leads cleared");
      setClearLeadsOpen(false);
    } catch {
      toast.error("Failed to clear leads");
    }
  };

  const handleClearCalls = async () => {
    try {
      toast.success("Calls cleared from view");
      await refreshCalls();
      setClearCallsOpen(false);
    } catch {
      toast.error("Failed to clear calls");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">

   <Card title="Appearance">
        <div className="grid gap-3 sm:grid-cols-2">
          <ThemeOption
            active={theme === "light"}
            onClick={() => setTheme("light")}
            label="Light"
            icon="fa-solid fa-sun"
            preview="bg-white border-border"
            innerPreview="bg-neutral-100"
          />
          <ThemeOption
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
            label="Dark"
            icon="fa-solid fa-moon"
            preview="bg-neutral-900 border-neutral-700"
            innerPreview="bg-neutral-800"
          />
        </div>
      </Card>

      {/* Danger Zone */}
    <Card title="Danger Zone">
        <div className="flex flex-wrap gap-3">
      <button
            onClick={() => setClearLeadsOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <i className="fa-solid fa-trash" /> Clear All Leads
          </button>
          <button
            onClick={() => setClearCallsOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <i className="fa-solid fa-phone-slash" /> Clear All Calls
          </button>
        </div>
      </Card>

      <ConfirmDialog
        open={clearLeadsOpen}
        onOpenChange={setClearLeadsOpen}
        title="Clear all leads?"
        description="This will permanently delete all leads and their associated calls. This cannot be undone."
        confirmLabel="Clear All"
        destructive
        onConfirm={handleClearLeads}
      />

      <ConfirmDialog
        open={clearCallsOpen}
        onOpenChange={setClearCallsOpen}
        title="Clear all calls?"
        description="This will remove all call records from view. This cannot be undone."
        confirmLabel="Clear All"
        destructive
        onConfirm={handleClearCalls}
      />
    </div>
  );
}

function Card({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </header>
      {children}
    </section>
  );
}

function ThemeOption({ active, onClick, label, icon, preview, innerPreview }: {
  active: boolean; onClick: () => void; label: string;
  icon: string; preview: string; innerPreview: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
        active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40",
      )}
    >
      <div className={cn("flex h-16 w-24 shrink-0 items-end gap-1 rounded-lg border p-2", preview)}>
        <div className={cn("h-full w-1/3 rounded", innerPreview)} />
        <div className="flex h-full w-2/3 flex-col gap-1">
          <div className={cn("h-1.5 w-3/4 rounded", innerPreview)} />
          <div className={cn("h-1.5 w-1/2 rounded", innerPreview)} />
          <div className="mt-auto h-3 w-1/2 rounded bg-primary" />
        </div>
      </div>
      <div className="flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <i className={icon} /> {label}
        </p>
        <p className="text-xs text-muted-foreground">
          {label === "Light" ? "Bright and crisp" : "Easy on the eyes"}
        </p>
      </div>
      {active && (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
          <i className="fa-solid fa-check text-xs" />
        </span>
      )}
    </button>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
        <i className={icon} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}