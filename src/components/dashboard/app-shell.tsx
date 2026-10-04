import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Link2,
  ListChecks,
  Menu,
  Palette,
  QrCode,
  Settings2,
  Shield,
  UserRound,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { BusinessProvider, useBusiness } from "@/hooks/use-business";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/sessions", label: "Review Sessions", icon: MessageSquare },
  { to: "/dashboard/services", label: "Services", icon: ListChecks },
  { to: "/dashboard/experience", label: "Review Experience", icon: Settings2 },
  { to: "/dashboard/qr", label: "QR Code", icon: QrCode },
  { to: "/dashboard/links", label: "Links", icon: Link2 },
  { to: "/dashboard/profile", label: "Business Profile", icon: Building2 },
  { to: "/dashboard/branding", label: "Branding", icon: Palette },
  { to: "/dashboard/account", label: "Account / Security", icon: UserRound },
] as const;

export function DashboardShell() {
  return (
    <BusinessProvider>
      <DashboardFrame />
    </BusinessProvider>
  );
}

function DashboardFrame() {
  const { user, loading, isSuperAdmin } = useAuth();
  const { business, memberships, setBusinessId, loading: bizLoading } = useBusiness();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || bizLoading) return;
    if (!user) {
      void navigate({ to: "/login", search: { redirect: "/dashboard" } });
      return;
    }
    const completed = memberships.some((membership) => membership.business.onboarding_completed);
    if (!completed) {
      void navigate({ to: "/onboarding" });
    }
  }, [loading, bizLoading, user, memberships, navigate]);

  if (loading || bizLoading || !user || !business) {
    return <p className="p-8 text-sm text-muted-foreground">Loading dashboard…</p>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <NavColumn
          businessName={business.name}
          memberships={memberships}
          currentId={business.id}
          onSwitch={setBusinessId}
          isSuperAdmin={isSuperAdmin}
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Dashboard</SheetTitle>
              <NavColumn
                businessName={business.name}
                memberships={memberships}
                currentId={business.id}
                onSwitch={(id) => {
                  setBusinessId(id);
                  setOpen(false);
                }}
                isSuperAdmin={isSuperAdmin}
                onNavigate={() => setOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <p className="truncate font-medium">{business.name}</p>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavColumn({
  businessName,
  memberships,
  currentId,
  onSwitch,
  isSuperAdmin,
  onNavigate,
}: {
  businessName: string;
  memberships: { business: { id: string; name: string } }[];
  currentId: string;
  onSwitch: (id: string) => void;
  isSuperAdmin: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border p-4">
        <Link to="/" className="font-display text-sm font-semibold">
          ReviewLift
        </Link>
        <p className="mt-2 truncate text-sm text-muted-foreground">{businessName}</p>
        {memberships.length > 1 ? (
          <select
            className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
            value={currentId}
            onChange={(e) => onSwitch(e.target.value)}
            aria-label="Switch business"
          >
            {memberships.map((item) => (
              <option key={item.business.id} value={item.business.id}>
                {item.business.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Dashboard">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
            )}
            activeOptions={{ exact: item.to === "/dashboard" }}
            activeProps={{ className: "bg-sidebar-accent font-medium" }}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        ))}
        {isSuperAdmin ? (
          <Link
            to="/admin"
            onClick={onNavigate}
            className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Shield className="size-4" aria-hidden />
            Super admin
          </Link>
        ) : null}
      </nav>
    </div>
  );
}

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

