import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/sessions")({
  component: AdminSessions,
});

function AdminSessions() {
  const [rows, setRows] = useState<
    { id: string; created_at: string; experience_rating: string | null; selected_language: string | null; businesses: { name: string } | null }[]
  >([]);

  useEffect(() => {
    supabase
      .from("review_sessions")
      .select("id,created_at,experience_rating,selected_language,businesses(name)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setRows((data ?? []) as typeof rows));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Review sessions</h1>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Business</th>
              <th className="py-2 pr-3">Experience</th>
              <th className="py-2">Language</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/70">
                <td className="py-2 pr-3">{new Date(row.created_at).toLocaleString()}</td>
                <td className="py-2 pr-3">{row.businesses?.name ?? "—"}</td>
                <td className="py-2 pr-3">{row.experience_rating ?? "—"}</td>
                <td className="py-2">{row.selected_language ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
