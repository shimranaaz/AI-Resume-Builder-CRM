import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { KpiCard } from "@/components/kpi-card";
import { OutcomeBadge, StatusBadge } from "@/components/status-badge";
import { useCrm } from "@/hooks/use-crm";
import { fmtCurrency, fmtDateTime, isSameDay, startOfDay } from "@/utils/format";
import { LEAD_STATUSES } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
    { title: "Dashboard — AI Resume Builder" },
      { name: "description", content: "Sales pipeline overview, KPIs and activity charts." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { leads, calls } = useCrm();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const stats = useMemo(() => {
    const callsToday = calls.filter((c) => isSameDay(new Date(c.callDate), today)).length;
    const callsYesterday = calls.filter((c) => isSameDay(new Date(c.callDate), yesterday)).length;
    const callsTomorrow = calls.filter((c) => isSameDay(new Date(c.callDate), tomorrow)).length;
    const followToday = leads.filter(
      (l) => l.nextFollowUp && isSameDay(new Date(l.nextFollowUp), today),
    ).length;
    const followTomorrow = leads.filter(
      (l) => l.nextFollowUp && isSameDay(new Date(l.nextFollowUp), tomorrow),
    ).length;
    const overdueFollowUps = leads.filter(
      (l) => l.nextFollowUp &&
        startOfDay(new Date(l.nextFollowUp)) < startOfDay(today) &&
        !["Closed Won", "Closed Lost"].includes(l.status),
    ).length;
    const interested = leads.filter((l) => l.status === "Interested").length;
    const expectedRevenue = leads.reduce((s, l) => s + (l.expectedRevenue ?? 0), 0);
    const actualRevenue = leads
      .filter((l) => l.status === "Closed Won")
      .reduce((s, l) => s + (l.actualRevenue ?? 0), 0);
  return {
      total: leads.length,
      callsToday,
      callsYesterday,
      callsTomorrow,
      followToday,
      followTomorrow,
      overdueFollowUps,
      interested,
    };
  }, [leads, calls]);

  const callsSeries = useMemo(() => {
    const days: { day: string; calls: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        day: d.toLocaleDateString(undefined, { weekday: "short" }),
        calls: calls.filter((c) => isSameDay(new Date(c.callDate), d)).length,
      });
    }
    return days;
  }, [calls]);

  const statusSeries = useMemo(
    () =>
      LEAD_STATUSES.map((s) => ({
        name: s,
        value: leads.filter((l) => l.status === s).length,
      })).filter((x) => x.value > 0),
    [leads],
  );

  const monthlySeries = useMemo(() => {
    const months: { month: string; leads: number; won: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      const key = d.toLocaleDateString(undefined, { month: "short" });
      const inMonth = (iso: string) => {
        const x = new Date(iso);
        return x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear();
      };
      months.push({
        month: key,
        leads: leads.filter((l) => inMonth(l.createdAt)).length,
        won: leads.filter((l) => l.status === "Closed Won" && inMonth(l.updatedAt)).length,
      });
    }
    return months;
  }, [leads]);

const pieColors = ["#1a7a6e", "#7c3aed", "#0ea5e9", "#f59e0b", "#10b981", "#64748b", "#ef4444", "#06b6d4"];

  const recentCalls = [...calls]
    .sort((a, b) => +new Date(b.callDate) - +new Date(a.callDate))
    .slice(0, 5);

  const todayFollow = leads
    .filter((l) => l.nextFollowUp && startOfDay(new Date(l.nextFollowUp)) <= startOfDay(today))
    .sort((a, b) => +new Date(a.nextFollowUp!) - +new Date(b.nextFollowUp!))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-gradient-to-br from-primary-soft via-card to-card p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Workspace</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
          Welcome back to AI Resume Builder
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You have <span className="font-semibold text-foreground">{stats.followToday}</span> follow-ups and{" "}
            <span className="font-semibold text-foreground">{stats.callsToday}</span> calls today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/leads" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
            <i className="fa-solid fa-users" /> View Leads
          </Link>
          <Link to="/calls" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <i className="fa-solid fa-phone" /> Log a Call
          </Link>
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Total Leads" value={stats.total} icon="fa-solid fa-users" tone="primary" />
        <KpiCard label="Today's Calls" value={stats.callsToday} icon="fa-solid fa-phone" tone="info" />
        <KpiCard label="Yesterday's Calls" value={stats.callsYesterday} icon="fa-solid fa-phone-slash" tone="warning" />
        <KpiCard label="Tomorrow's Calls" value={stats.callsTomorrow} icon="fa-solid fa-calendar-plus" tone="success" />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Today's Follow Ups" value={stats.followToday} icon="fa-solid fa-calendar-check" tone="warning" />
        <KpiCard label="Tomorrow's Follow Ups" value={stats.followTomorrow} icon="fa-solid fa-calendar" tone="info" />
        <KpiCard label="Overdue Follow Ups" value={stats.overdueFollowUps} icon="fa-solid fa-triangle-exclamation" tone="primary" />
        <KpiCard label="Interested Leads" value={stats.interested} icon="fa-solid fa-fire" tone="success" />
      </div>

   
      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Daily Calls" subtitle="Last 7 days" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={callsSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "color-mix(in oklab, var(--primary) 8%, transparent)" }} />
              <Bar dataKey="calls" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Status" subtitle="Pipeline distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusSeries} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {statusSeries.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {statusSeries.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                <span className="truncate">{s.name}</span>
                <span className="ml-auto font-medium text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Monthly Performance" subtitle="Leads vs deals won" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlySeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="leads" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="won" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold">Today's Follow-Ups</h3>
              <p className="text-xs text-muted-foreground">Don't miss these conversations</p>
            </div>
            <Link to="/follow-ups" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-border">
            {todayFollow.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">All clear for today</li>
            )}
            {todayFollow.map((l) => (
              <li key={l.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {l.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.mobile}</p>
                </div>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold">Recent Calls</h3>
              <p className="text-xs text-muted-foreground">Latest sales activity</p>
            </div>
            <Link to="/calls" className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <ul className="divide-y divide-border">
            {recentCalls.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">No calls logged yet</li>
            )}
            {recentCalls.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-info/10 text-info">
                  <i className="fa-solid fa-phone text-xs" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.leadName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {fmtDateTime(c.callDate)} · {c.durationMinutes} min
                  </p>
                </div>
                <OutcomeBadge outcome={c.outcome} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

function ChartCard({ title, subtitle, children, className = "" }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}