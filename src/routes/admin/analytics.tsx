import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  const [byBusiness, setByBusiness] = useState<{ name: string; visits: number; generated: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: events }, { data: businesses }] = await Promise.all([
        supabase.from("analytics_events").select("business_id,event_type"),
        supabase.from("businesses").select("id,name"),
      ]);
      const names = new Map((businesses ?? []).map((b) => [b.id, b.name]));
      const map = new Map<string, { name: string; visits: number; generated: number }>();
      for (const event of events ?? []) {
        const current = map.get(event.business_id) ?? {
          name: names.get(event.business_id) ?? "Unknown",
          visits: 0,
          generated: 0,
        };
        if (event.event_type === "review_page_loaded" || event.event_type === "qr_scan") current.visits += 1;
        if (event.event_type === "review_generated") current.generated += 1;
        map.set(event.business_id, current);
      }
      setByBusiness([...map.values()].sort((a, b) => b.visits - a.visits));
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Global analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">Google Review page clicks are clicks, not confirmed posted reviews.</p>
      <div className="panel mt-6 h-72 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byBusiness}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="visits" fill="var(--color-primary)" name="Visits" />
            <Bar dataKey="generated" fill="var(--color-accent)" name="Generated" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
