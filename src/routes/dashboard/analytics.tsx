import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/dashboard/app-shell";
import { PeriodSelect } from "@/routes/dashboard/index";
import { useBusiness } from "@/hooks/use-business";
import { supabase } from "@/integrations/supabase/client";
import {
  experienceBreakdown,
  fetchEvents,
  languageBreakdown,
  seriesByDay,
  topServices,
  visitCount,
  countBy,
  type Period,
} from "@/lib/analytics";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { business } = useBusiness();
  const [period, setPeriod] = useState<Period>(30);
  const [visits, setVisits] = useState<{ date: string; value: number }[]>([]);
  const [generated, setGenerated] = useState<{ date: string; value: number }[]>([]);
  const [services, setServices] = useState<{ name: string; value: number }[]>([]);
  const [languages, setLanguages] = useState<{ name: string; value: number }[]>([]);
  const [experiences, setExperiences] = useState<{ name: string; value: number }[]>([]);
  const [funnel, setFunnel] = useState<{ name: string; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!business) return;
    (async () => {
      try {
        const events = await fetchEvents(business.id, period);
        const { data: svc } = await supabase
          .from("business_services")
          .select("id,name")
          .eq("business_id", business.id);
        const names = new Map((svc ?? []).map((row) => [row.id, row.name]));
        setVisits(seriesByDay(events, ["review_page_loaded", "qr_scan"], period));
        setGenerated(seriesByDay(events, ["review_generated"], period));
        setServices(topServices(events, names));
        setLanguages(languageBreakdown(events));
        setExperiences(experienceBreakdown(events));
        setFunnel([
          { name: "Visits", value: visitCount(events) },
          { name: "Started", value: countBy(events, "review_session_started") },
          { name: "Generated", value: countBy(events, "review_generated") },
          { name: "Copied", value: countBy(events, "review_copied") },
          { name: "Google clicks", value: countBy(events, "google_review_clicked") },
        ]);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load charts.");
      }
    })();
  }, [business, period]);

  return (
    <div>
      <PageHeader title="Analytics" description="Built from analytics_events — never from static demo numbers.">
        <PeriodSelect value={period} onChange={setPeriod} />
      </PageHeader>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Review page visits over time">
          <LineBlock data={visits} />
        </ChartCard>
        <ChartCard title="Generated drafts over time">
          <LineBlock data={generated} />
        </ChartCard>
        <ChartCard title="Most selected services">
          <BarBlock data={services} />
        </ChartCard>
        <ChartCard title="Languages used">
          <BarBlock data={languages} />
        </ChartCard>
        <ChartCard title="Experience distribution">
          <BarBlock data={experiences} />
        </ChartCard>
        <ChartCard title="Conversion funnel">
          <BarBlock data={funnel} />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="h-56">{children}</div>
    </div>
  );
}

function LineBlock({ data }: { data: { date: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarBlock({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
