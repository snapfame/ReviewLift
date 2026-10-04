import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [rows, setRows] = useState<{ id: string; email: string | null; full_name: string | null; system_role: string; created_at: string }[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id,email,full_name,system_role,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/70">
                <td className="py-2 pr-3">{row.full_name || "—"}</td>
                <td className="py-2 pr-3">{row.email}</td>
                <td className="py-2 pr-3">{row.system_role}</td>
                <td className="py-2">{new Date(row.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
