import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useBusiness } from "@/hooks/use-business";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/sessions")({
  component: SessionsPage,
});

interface SessionRow {
  id: string;
  created_at: string;
  experience_rating: string | null;
  selected_language: string | null;
  selected_service_ids: unknown;
  selected_attributes: unknown;
  customer_note: string | null;
  generations: {
    review_text: string;
    generation_number: number;
    edited: boolean;
    copied_at: string | null;
    google_clicked_at: string | null;
  }[];
}

function SessionsPage() {
  const { business } = useBusiness();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [open, setOpen] = useState<SessionRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const [{ data, error: sessionError }, { data: services }] = await Promise.all([
        supabase
          .from("review_sessions")
          .select(
            "id,created_at,experience_rating,selected_language,selected_service_ids,selected_attributes,customer_note,generations:review_generations(review_text,generation_number,edited,copied_at,google_clicked_at)",
          )
          .eq("business_id", business.id)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase.from("business_services").select("id,name").eq("business_id", business.id),
      ]);
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      setNames(new Map((services ?? []).map((s) => [s.id, s.name])));
      setRows((data ?? []) as SessionRow[]);
    })();
  }, [business]);

  return (
    <div>
      <PageHeader title="Review sessions" description="No customer name or email is collected." />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Services</th>
              <th className="py-2 pr-3">Experience</th>
              <th className="py-2 pr-3">Language</th>
              <th className="py-2 pr-3">Draft</th>
              <th className="py-2 pr-3">Regen</th>
              <th className="py-2 pr-3">Edited</th>
              <th className="py-2 pr-3">Copied</th>
              <th className="py-2 pr-3">Google clicked</th>
              <th className="py-2"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const latest = [...row.generations].sort((a, b) => b.generation_number - a.generation_number)[0];
              const ids = Array.isArray(row.selected_service_ids) ? (row.selected_service_ids as string[]) : [];
              return (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-3">{ids.map((id) => names.get(id) ?? "Service").join(", ") || "—"}</td>
                  <td className="py-2 pr-3">{row.experience_rating ?? "—"}</td>
                  <td className="py-2 pr-3">{row.selected_language ?? "—"}</td>
                  <td className="max-w-[220px] truncate py-2 pr-3">{latest?.review_text ?? "—"}</td>
                  <td className="py-2 pr-3">{Math.max((latest?.generation_number ?? 1) - 1, 0)}</td>
                  <td className="py-2 pr-3">{latest?.edited ? "Yes" : "No"}</td>
                  <td className="py-2 pr-3">{latest?.copied_at ? "Yes" : "No"}</td>
                  <td className="py-2 pr-3">{latest?.google_clicked_at ? "Yes" : "No"}</td>
                  <td className="py-2">
                    <Button size="sm" variant="outline" onClick={() => setOpen(row)}>
                      View
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">No sessions yet.</p> : null}
      </div>
      <Sheet open={!!open} onOpenChange={(next) => !next && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetTitle>Session detail</SheetTitle>
          {open ? (
            <div className="mt-4 space-y-3 text-sm">
              <p>Started {new Date(open.created_at).toLocaleString()}</p>
              <p>Experience: {open.experience_rating ?? "—"}</p>
              <p>Language: {open.selected_language ?? "—"}</p>
              <p>Note: {open.customer_note || "—"}</p>
              {open.generations
                .slice()
                .sort((a, b) => a.generation_number - b.generation_number)
                .map((gen) => (
                  <div key={gen.generation_number} className="panel p-3">
                    <p className="text-xs text-muted-foreground">Draft #{gen.generation_number}</p>
                    <p className="mt-2 whitespace-pre-wrap">{gen.review_text}</p>
                  </div>
                ))}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
