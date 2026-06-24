import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "@/components/kpi-card";
import { useCrm } from "@/hooks/use-crm";
import { LEAD_SOURCES } from "@/types";
import { fmtDate, fmtDateTime } from "@/utils/format";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
     { title: "Reports – AI Resume Builder" },
      { name: "description", content: "Sales performance, source effectiveness and conversion stats." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { leads, calls } = useCrm();

  const totals = useMemo(() => {
    const interested = leads.filter((l) => l.status === "Interested").length;
    const won = leads.filter((l) => l.status === "Closed Won");
    const lost = leads.filter((l) => l.status === "Closed Lost").length;
    const expectedRevenue = leads.reduce((s, l) => s + (l.expectedRevenue ?? 0), 0);
    const actualRevenue = won.reduce((s, l) => s + (l.actualRevenue ?? 0), 0);

    // Follow-up counts from live lead data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const pendingLeads = leads.filter(
      (l) => l.nextFollowUp && !["Closed Won", "Closed Lost"].includes(l.status)
    );
    const overdueFollowUps = pendingLeads.filter(
      (l) => new Date(l.nextFollowUp!) < today
    ).length;
    const todayFollowUps = pendingLeads.filter((l) => {
      const d = new Date(l.nextFollowUp!);
      return d >= today && d < tomorrow;
    }).length;

    return {
      leads: leads.length,
      calls: calls.length,
      interested,
      won: won.length,
      lost,
      expectedRevenue,
      actualRevenue,
      overdueFollowUps,
      todayFollowUps,
    };
  }, [leads, calls]);

  const sourceData = useMemo(
    () =>
      LEAD_SOURCES.map((src) => {
        const inSource = leads.filter((l) => l.source === src);
        return {
          source: src,
          leads: inSource.length,
          won: inSource.filter((l) => l.status === "Closed Won").length,
        };
      }),
    [leads],
  );

  const conversion = totals.leads ? Math.round((totals.won / totals.leads) * 100) : 0;

  const handleExportCSV = () => {
    const sections: string[] = [];

    // Section 1: Leads
    const leadHeaders = ["Name", "Mobile", "Email", "Source", "Status", "Next Follow Up", "Expected Revenue", "Actual Revenue", "Notes", "Created"];
    const leadRows = leads.map((l) => [
      `"${l.name}"`,
      l.mobile,
      l.email,
      l.source,
      l.status,
      l.nextFollowUp ? fmtDate(l.nextFollowUp) : "",
      l.expectedRevenue ?? 0,
      l.actualRevenue ?? 0,
      `"${(l.notes ?? "").replace(/"/g, '""')}"`,
      fmtDate(l.createdAt),
    ]);
    sections.push("LEADS");
    sections.push([leadHeaders, ...leadRows].map((r) => r.join(",")).join("\n"));

    // Section 2: Call Logs
    const callHeaders = ["Lead Name", "Call Date", "Duration (min)", "Outcome", "Remarks", "Next Follow Up"];
    const callRows = calls.map((c) => [
      `"${c.leadName ?? ""}"`,
      fmtDateTime(c.callDate),
      c.durationMinutes ?? 0,
      c.outcome,
      `"${(c.remarks ?? c.notes ?? "").replace(/"/g, '""')}"`,
      c.nextFollowUp ? fmtDate(c.nextFollowUp) : "",
    ]);
    sections.push("\nCALL LOGS");
    sections.push([callHeaders, ...callRows].map((r) => r.join(",")).join("\n"));

    // Section 3: Follow Ups (pending)
    const followUpLeads = leads.filter(
      (l) => l.nextFollowUp && !["Closed Won", "Closed Lost"].includes(l.status)
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUpHeaders = ["Lead Name", "Mobile", "Email", "Status", "Follow Up Date", "Category"];
    const followUpRows = followUpLeads.map((l) => {
      const d = new Date(l.nextFollowUp!);
      const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const category = diff < 0 ? "Overdue" : diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : "Upcoming";
      return [
        `"${l.name}"`,
        l.mobile,
        l.email,
        l.status,
        fmtDate(l.nextFollowUp!),
        category,
      ];
    });
    sections.push("\nFOLLOW UPS");
    sections.push([followUpHeaders, ...followUpRows].map((r) => r.join(",")).join("\n"));

    const csv = sections.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
   a.download = `ai-resume-builder-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total Leads" value={totals.leads} icon="fa-solid fa-users" tone="primary" />
        <KpiCard label="Total Calls" value={totals.calls} icon="fa-solid fa-phone" tone="info" />
        <KpiCard label="Interested" value={totals.interested} icon="fa-solid fa-fire" tone="warning" />
        <KpiCard label="Closed Won" value={totals.won} icon="fa-solid fa-trophy" tone="success" />
        <KpiCard label="Closed Lost" value={totals.lost} icon="fa-solid fa-circle-xmark" tone="default" />
        <KpiCard label="Conversion" value={`${conversion}%`} icon="fa-solid fa-chart-line" tone="success" />
      </div>

      {/* Export */}
      <div className="flex gap-2">
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <i className="fa-solid fa-file-csv" /> Export CSV
        </button>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Lead Source Performance</h3>
          <p className="text-xs text-muted-foreground">Leads acquired vs deals closed per source</p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={sourceData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="source" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{
              background: "var(--popover)", border: "1px solid var(--border)",
              borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)",
            }} cursor={{ fill: "color-mix(in oklab, var(--primary) 6%, transparent)" }} />
            <Bar dataKey="leads" fill="var(--primary)" radius={[6, 6, 0, 0]} name="Leads" />
            <Bar dataKey="won" fill="var(--success)" radius={[6, 6, 0, 0]} name="Won" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold">Source Breakdown</h3>
          <p className="text-xs text-muted-foreground">Conversion rate by acquisition channel</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Source</th>
              <th className="px-5 py-3 text-right font-medium">Leads</th>
              <th className="px-5 py-3 text-right font-medium">Won</th>
              <th className="px-5 py-3 text-right font-medium">Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sourceData.map((s) => {
              const rate = s.leads ? Math.round((s.won / s.leads) * 100) : 0;
              return (
                <tr key={s.source}>
                  <td className="px-5 py-3 font-medium">{s.source}</td>
                  <td className="px-5 py-3 text-right">{s.leads}</td>
                  <td className="px-5 py-3 text-right">{s.won}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full bg-primary" style={{ width: `${rate}%` }} />
                      </span>
                      <span className="w-10 text-right font-medium">{rate}%</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}