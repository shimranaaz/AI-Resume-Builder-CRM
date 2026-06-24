import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: "fa-solid fa-gauge-high" },
  { to: "/leads", label: "Leads", icon: "fa-solid fa-users" },
  { to: "/follow-ups", label: "Follow Ups", icon: "fa-solid fa-calendar-check" },
  { to: "/calls", label: "Call Tracker", icon: "fa-solid fa-phone" },
  { to: "/reports", label: "Reports", icon: "fa-solid fa-chart-column" },
  { to: "/settings", label: "Settings", icon: "fa-solid fa-gear" },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const current = nav.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <i className="fa-solid fa-bolt text-sm" />
          </div>
          <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">AI Resume Builder</p>
<p className="truncate text-[11px] text-muted-foreground">White-Label Sales</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                )}
              >
                <i
                  className={cn(
                    item.icon,
                    "w-4 text-center text-[13px]",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted lg:hidden"
            aria-label="Open menu"
          >
            <i className="fa-solid fa-bars" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight md:text-lg">
            {current?.label ?? "AI Resume Builder"}
            </h1>
            <p className="hidden text-xs text-muted-foreground md:block">
              {pathname === "/" ? "Sales overview" : `Manage your ${current?.label.toLowerCase()}`}
            </p>
          </div>

          <button
            onClick={toggle}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            <i className={cn("fa-solid", theme === "dark" ? "fa-sun" : "fa-moon")} />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
