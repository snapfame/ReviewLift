import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/dashboard/app-shell";
import { useBusiness } from "@/hooks/use-business";
import { countBy, fetchEvents, rate, visitCount, type Period } from "@/lib/analytics";

export const Route = createFileRoute("/dashboard/")({
  component: OverviewPage,
});

function OverviewPage() {
  const { business } = useBusiness();
  const [period, setPeriod] = useState<Period>(30);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!business) return;
    fetchEvents(business.id, period)
      .then((events) => {
        const visits = visitCount(events);
        const started = countBy(events, "review_session_started");
        const generated = countBy(events, "review_generated");
        const regenerated = countBy(events, "review_regenerated");
        const copied = countBy(events, "review_copied");
        const google = countBy(events, "google_review_clicked");
        setStats({
          visits,
          started,
          generated,
          regenerated,
          copied,
          google,
          visitToGen: rate(generated, visits),
          genToCopy: rate(copied, generated),
          copyToGoogle: rate(google, copied),
        });
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load analytics."));
  }, [business, period]);

  return (
    <div>
      <PageHeader title="Overview" description="Real events from your review page. No estimated Google reviews.">
        <PeriodSelect value={period} onChange={setPeriod} />
      </PageHeader>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!stats ? (
        <p className="text-sm text-muted-foreground">Loading numbers…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Stat label="Review page visits" value={stats["visits"] ?? 0} />
            <Stat label="Review sessions started" value={stats["started"] ?? 0} />
            <Stat label="Reviews generated" value={stats["generated"] ?? 0} />
            <Stat label="Reviews regenerated" value={stats["regenerated"] ?? 0} />
            <Stat label="Reviews copied" value={stats["copied"] ?? 0} />
            <Stat label="Google Review page clicks" value={stats["google"] ?? 0} />
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold">Conversion funnel</h2>
            <ol className="mt-3 grid gap-3 sm:grid-cols-5">
              {[
                ["Visits", stats["visits"]],
                ["Started", stats["started"]],
                ["Generated", stats["generated"]],
                ["Copied", stats["copied"]],
                ["Google clicked", stats["google"]],
              ].map(([label, value]) => (
                <li key={String(label)} className="panel p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-semibold">{value}</p>
                </li>
              ))}
            </ol>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <RateCard label="Visit → generation rate" value={`${stats["visitToGen"]}%`} />
              <RateCard label="Generation → copy rate" value={`${stats["genToCopy"]}%`} />
              <RateCard label="Copy → Google rate" value={`${stats["copyToGoogle"]}%`} />
            </dl>
          </div>
        </>
      )}
    </div>
  );
}

export function PeriodSelect({ value, onChange }: { value: Period; onChange: (value: Period) => void }) {
  return (
    <select
      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) as Period)}
      aria-label="Date range"
    >
      <option value={7}>Last 7 days</option>
      <option value={30}>Last 30 days</option>
      <option value={90}>Last 90 days</option>
    </select>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function RateCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
    </div>
  );
}
