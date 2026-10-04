import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { BarChart3, Building2, CreditCard, LayoutDashboard, Menu, MessageSquare, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/businesses", label: "Businesses", icon: Building2 },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/sessions", label: "Review Sessions", icon: MessageSquare },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/plans", label: "Plans", icon: CreditCard },
  { to: "/admin/system", label: "System", icon: Settings },
] as const;

export function AdminShell() {
  const { user, loading, isSuperAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/login", search: { redirect: "/admin" } });
      return;
    }
    if (profile && !isSuperAdmin) {
      void navigate({ to: "/dashboard" });
    }
  }, [loading, user, profile, isSuperAdmin, navigate]);

  if (loading || !user || !isSuperAdmin) {
    return <p className="p-8 text-sm text-muted-foreground">Checking admin access…</p>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar lg:block">
        <AdminNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open admin nav">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Admin</SheetTitle>
              <AdminNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="font-medium">Super admin</p>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <Link to="/" className="font-display text-sm font-semibold">
          ReviewLift Admin
        </Link>
        <Link to="/dashboard" className="mt-2 block text-xs text-muted-foreground hover:underline">
          Back to dashboard
        </Link>
      </div>
      <nav className="space-y-0.5 p-2" aria-label="Admin">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent")}
            activeOptions={{ exact: item.to === "/admin" }}
            activeProps={{ className: "bg-sidebar-accent font-medium" }}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
