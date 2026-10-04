import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Business } from "@/lib/business";

export const Route = createFileRoute("/admin/businesses")({
  component: AdminBusinesses,
});

interface Row extends Business {
  owner: string;
  visits: number;
  generated: number;
  copied: number;
  google: number;
}

function AdminBusinesses() {
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const [{ data: businesses }, { data: members }, { data: events }, { data: profiles }] = await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: false }),
      supabase.from("business_members").select("business_id,user_id,role"),
      supabase.from("analytics_events").select("business_id,event_type"),
      supabase.from("profiles").select("id,email,full_name"),
    ]);
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const ownerByBiz = new Map<string, string>();
    for (const member of members ?? []) {
      if (member.role !== "business_owner") continue;
      const profile = profileById.get(member.user_id);
      ownerByBiz.set(member.business_id, profile?.full_name || profile?.email || member.user_id);
    }
    const counts = new Map<string, { visits: number; generated: number; copied: number; google: number }>();
    for (const event of events ?? []) {
      const current = counts.get(event.business_id) ?? { visits: 0, generated: 0, copied: 0, google: 0 };
      if (event.event_type === "review_page_loaded" || event.event_type === "qr_scan") current.visits += 1;
      if (event.event_type === "review_generated") current.generated += 1;
      if (event.event_type === "review_copied") current.copied += 1;
      if (event.event_type === "google_review_clicked") current.google += 1;
      counts.set(event.business_id, current);
    }
    setRows(
      (businesses ?? []).map((business) => ({
        ...business,
        owner: ownerByBiz.get(business.id) ?? "Unassigned",
        ...(counts.get(business.id) ?? { visits: 0, generated: 0, copied: 0, google: 0 }),
      })),
    );
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (id: string, status: "active" | "paused" | "inactive") => {
    const { error } = await supabase.from("businesses").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "active" ? "Business activated" : "Business paused");
      await load();
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Businesses</h1>
        <Button asChild>
          <Link to="/admin/businesses/new">Create business</Link>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Owner</th>
              <th className="py-2 pr-3">City</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Visits</th>
              <th className="py-2 pr-3">Generated</th>
              <th className="py-2 pr-3">Copied</th>
              <th className="py-2 pr-3">Google clicks</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/70">
                <td className="py-2 pr-3 font-medium">{row.name}</td>
                <td className="py-2 pr-3">{row.owner}</td>
                <td className="py-2 pr-3">{row.city}</td>
                <td className="py-2 pr-3">{row.category}</td>
                <td className="py-2 pr-3">{row.status}</td>
                <td className="py-2 pr-3">{row.visits}</td>
                <td className="py-2 pr-3">{row.generated}</td>
                <td className="py-2 pr-3">{row.copied}</td>
                <td className="py-2 pr-3">{row.google}</td>
                <td className="py-2 pr-3 whitespace-nowrap">{new Date(row.created_at).toLocaleDateString()}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-1">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/businesses/$businessId" params={{ businessId: row.id }}>
                        View
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void setStatus(row.id, row.status === "active" ? "paused" : "active")}>
                      {row.status === "active" ? "Pause" : "Activate"}
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a href={`/r/${row.slug}`} target="_blank" rel="noreferrer">
                        Review page
                      </a>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
