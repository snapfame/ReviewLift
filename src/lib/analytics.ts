import { supabase } from "@/integrations/supabase/client";

export type Period = 7 | 30 | 90;

export interface AnalyticsEventRow {
  id: string;
  event_type: string;
  created_at: string;
  session_id: string | null;
  metadata: Record<string, unknown>;
}

export async function fetchEvents(businessId: string, days: Period): Promise<AnalyticsEventRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("analytics_events")
    .select("id,event_type,created_at,session_id,metadata")
    .eq("business_id", businessId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  }));
}

export function countBy(events: AnalyticsEventRow[], type: string) {
  return events.filter((event) => event.event_type === type).length;
}

export function visitCount(events: AnalyticsEventRow[]) {
  return countBy(events, "review_page_loaded") + countBy(events, "qr_scan");
}

export function rate(num: number, den: number) {
  if (den <= 0) return 0;
  return Math.round((num / den) * 100);
}

export function seriesByDay(events: AnalyticsEventRow[], types: string[], days: Period) {
  const map = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const event of events) {
    if (!types.includes(event.event_type)) continue;
    const key = event.created_at.slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([date, value]) => ({ date, value }));
}

export function topServices(events: AnalyticsEventRow[], nameById: Map<string, string>) {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.event_type !== "services_selected") continue;
    const ids = event.metadata["service_ids"];
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      if (typeof id !== "string") continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, value]) => ({ name: nameById.get(id) ?? "Unknown service", value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function languageBreakdown(events: AnalyticsEventRow[]) {
  const counts = { english: 0, hinglish: 0, hindi: 0 };
  for (const event of events) {
    if (event.event_type !== "review_generated" && event.event_type !== "review_regenerated") continue;
    const lang = event.metadata["language"];
    if (lang === "english" || lang === "hinglish" || lang === "hindi") counts[lang] += 1;
  }
  return [
    { name: "English", value: counts.english },
    { name: "Hinglish", value: counts.hinglish },
    { name: "Hindi", value: counts.hindi },
  ];
}

export function experienceBreakdown(events: AnalyticsEventRow[]) {
  const counts = { excellent: 0, good: 0, average: 0, not_good: 0 };
  for (const event of events) {
    if (event.event_type !== "experience_selected") continue;
    const exp = event.metadata["experience"];
    if (exp === "excellent" || exp === "good" || exp === "average" || exp === "not_good") counts[exp] += 1;
  }
  return [
    { name: "Excellent", value: counts.excellent },
    { name: "Good", value: counts.good },
    { name: "Average", value: counts.average },
    { name: "Not Good", value: counts.not_good },
  ];
}
