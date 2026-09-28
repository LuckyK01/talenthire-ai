import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Bot,
  Building2,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Rocket,
  ScrollText,
  Search,
  Settings,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { markNotificationRead } from "@/lib/api";
import {
  candidatesQuery,
  notificationsQuery,
  requirementsQuery,
  vendorsQuery,
  qk,
} from "@/lib/queries";
import { fmtDateTime, LabelMono } from "@/components/hire/bits";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const hrNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/requirements", label: "Requirements", icon: FileText },
  { to: "/vendors", label: "Vendors", icon: Building2 },
  { to: "/vendor-ranking", label: "Vendor Ranking", icon: Trophy },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/interviews", label: "Interviews", icon: CalendarClock },
  { to: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { to: "/offers", label: "Offers", icon: FileText },
  { to: "/onboarding", label: "Onboarding", icon: Rocket },
  { to: "/ai-control-center", label: "AI Control Center", icon: Bot },
  { to: "/reports", label: "Reports", icon: Gauge },
  { to: "/audit", label: "Audit Trail", icon: ScrollText },
  { to: "/users", label: "Users", icon: UsersRound },
  { to: "/settings", label: "Settings", icon: Settings },
];

const managerNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/requirements", label: "Requirements", icon: FileText },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/interviews", label: "Interviews", icon: CalendarClock },
  { to: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];

const candidateNav: NavItem[] = [
  { to: "/portal", label: "Home", icon: LayoutDashboard },
  { to: "/portal/application", label: "My Application", icon: FileText },
  { to: "/portal/interview", label: "My Interview", icon: CalendarClock },
  { to: "/portal/offer", label: "My Offer", icon: ClipboardCheck },
  { to: "/portal/onboarding", label: "Onboarding", icon: Rocket },
  { to: "/portal/notifications", label: "Notifications", icon: Bell },
  { to: "/portal/profile", label: "Profile", icon: Users },
];

export function AppShell({
  children,
  breadcrumbs,
}: {
  children: ReactNode;
  breadcrumbs?: { label: string; to?: string }[];
}) {
  const { profile, role, signOut } = useAuth();
  const nav = role === "CANDIDATE" ? candidateNav : role === "MANAGER" ? managerNav : hrNav;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="app-backdrop min-h-screen">
      <div className="mx-auto flex max-w-[1600px] gap-0 px-3 py-4 lg:px-6">
        <aside className="panel sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col rounded-2xl p-3 lg:flex">
          <div className="px-2 py-3">
            <p className="font-display text-xl leading-none">HireFlow AI</p>
            <p className="label-mono mt-1">AI recommends · humans decide</p>
          </div>
          <nav aria-label="Main" className="mt-2 flex-1 overflow-y-auto">
            <ul className="space-y-0.5">
              {nav.map((item) => {
                const active =
                  item.to === "/portal"
                    ? pathname === "/portal"
                    : pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        active ? "bg-primary text-primary-foreground" : "hover:bg-white/60",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="ghost mt-2 rounded-xl p-3">
            <p className="truncate text-sm font-medium">{profile?.name ?? "Signed in"}</p>
            <p className="label-mono mt-0.5">{role?.replace("_", " ") ?? "—"}</p>
            <Button variant="ghost" size="sm" className="mt-2 w-full justify-start gap-2" onClick={() => void signOut()}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-5">
          <header className="panel mb-5 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                {(breadcrumbs ?? [{ label: "Workspace" }]).map((b, i, arr) => (
                  <li key={`${b.label}-${i}`} className="flex items-center gap-1.5">
                    {b.to && i < arr.length - 1 ? (
                      <Link to={b.to} className="hover:text-foreground">
                        {b.label}
                      </Link>
                    ) : (
                      <span className={i === arr.length - 1 ? "text-foreground" : undefined}>{b.label}</span>
                    )}
                    {i < arr.length - 1 ? <span aria-hidden>/</span> : null}
                  </li>
                ))}
              </ol>
            </nav>
            <GlobalSearch />
            <NotificationBell />
          </header>

          <div className="lg:hidden">
            <MobileNav nav={nav} pathname={pathname} />
          </div>

          <main className="pb-16">{children}</main>
        </div>
      </div>
    </div>
  );
}

function MobileNav({ nav, pathname }: { nav: NavItem[]; pathname: string }) {
  return (
    <nav aria-label="Sections" className="panel-soft mb-4 overflow-x-auto rounded-xl p-2">
      <ul className="flex gap-1.5">
        {nav.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs",
                pathname === item.to ? "bg-primary text-primary-foreground" : "bg-white/50",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function GlobalSearch() {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const staff = role !== "CANDIDATE";
  const requirements = useQuery({ ...requirementsQuery(), enabled: open && staff });
  const candidates = useQuery({ ...candidatesQuery(), enabled: open });
  const vendors = useQuery({ ...vendorsQuery(), enabled: open && staff });

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Search className="size-4" />
        <span className="hidden sm:inline">Search</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search HireFlow">
        <CommandInput placeholder="Search requirements, candidates, vendors…" />
        <CommandList>
          <CommandEmpty>No matches found.</CommandEmpty>
          {staff && requirements.data?.length ? (
            <CommandGroup heading="Requirements">
              {requirements.data.map((r) => (
                <CommandItem key={r.id} value={`${r.requirement_id} ${r.position_title}`} asChild>
                  <Link to="/requirements/$id" params={{ id: r.id }} onClick={() => setOpen(false)}>
                    <span className="font-mono text-xs">{r.requirement_id}</span>
                    <span>{r.position_title}</span>
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {candidates.data?.length ? (
            <CommandGroup heading="Candidates">
              {candidates.data.map((c) => (
                <CommandItem key={c.id} value={c.name} asChild>
                  <Link
                    to={staff ? "/candidates" : "/portal/application"}
                    onClick={() => setOpen(false)}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.status.replace(/_/g, " ")}</span>
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {staff && vendors.data?.length ? (
            <CommandGroup heading="Vendors">
              {vendors.data.map((v) => (
                <CommandItem key={v.id} value={v.vendor_name} asChild>
                  <Link to="/vendors/$id" params={{ id: v.id }} onClick={() => setOpen(false)}>
                    <span>{v.vendor_name}</span>
                    <span className="tnum font-mono text-xs">{v.overall_score}</span>
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function NotificationBell() {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useQuery(notificationsQuery(role, user?.id ?? null));
  const unread = useMemo(() => (data ?? []).filter((n) => !n.read_at), [data]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2" aria-label="Notifications">
          <Bell className="size-4" />
          {unread.length > 0 ? (
            <Badge className="absolute -right-1.5 -top-1.5 h-4 min-w-4 justify-center rounded-full bg-teal px-1 font-mono text-[10px] text-white">
              {unread.length}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-3 py-2">
          <LabelMono>Notifications</LabelMono>
        </div>
        <ScrollArea className="max-h-80">
          {(data ?? []).length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <ul className="divide-y">
              {(data ?? []).map((n) => (
                <li key={n.id} className={cn("px-3 py-2.5", !n.read_at && "bg-teal/5")}>
                  <button
                    className="w-full text-left"
                    onClick={async () => {
                      if (!n.read_at) {
                        await markNotificationRead(n.id);
                        void queryClient.invalidateQueries({ queryKey: qk.notifications(role, user?.id ?? null) });
                      }
                    }}
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body ? <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p> : null}
                    <p className="label-mono mt-1">{fmtDateTime(n.created_at)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
