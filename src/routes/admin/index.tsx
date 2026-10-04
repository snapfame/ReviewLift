import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    (async () => {
      const [{ count: businesses }, { count: active }, { data: events }] = await Promise.all([
        supabase.from("businesses").select("id", { count: "exact", head: true }),
        supabase.from("businesses").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("analytics_events").select("event_type"),
      ]);
      const list = events ?? [];
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { count: newBiz } = await supabase
        .from("businesses")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since.toISOString());
      setStats({
        businesses: businesses ?? 0,
        active: active ?? 0,
        visits: list.filter((e) => e.event_type === "review_page_loaded" || e.event_type === "qr_scan").length,
        generated: list.filter((e) => e.event_type === "review_generated").length,
        copied: list.filter((e) => e.event_type === "review_copied").length,
        google: list.filter((e) => e.event_type === "google_review_clicked").length,
        newBiz: newBiz ?? 0,
      });
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Admin overview</h1>
      {!stats ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card label="Total businesses" value={stats["businesses"] ?? 0} />
          <Card label="Active businesses" value={stats["active"] ?? 0} />
          <Card label="New businesses (7d)" value={stats["newBiz"] ?? 0} />
          <Card label="Review page visits" value={stats["visits"] ?? 0} />
          <Card label="Drafts generated" value={stats["generated"] ?? 0} />
          <Card label="Copies" value={stats["copied"] ?? 0} />
          <Card label="Google Review page clicks" value={stats["google"] ?? 0} />
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
