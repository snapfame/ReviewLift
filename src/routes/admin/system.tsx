import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/system")({
  component: AdminSystem,
});

function AdminSystem() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">System</h1>
      <div className="panel space-y-2 p-4 text-sm">
        <p>Review generation: local compositional engine. No paid AI API.</p>
        <p>Auth: Supabase Auth (email/password).</p>
        <p>Tenant isolation: RLS via business_members + is_super_admin.</p>
        <p>Storage bucket: business-logos (2 MB, image types only).</p>
        <p>Google Business Profile tables exist for a future integration and are not exposed as live features.</p>
      </div>
      <div className="panel space-y-2 p-4 text-sm">
        <h2 className="font-semibold">Create the first super admin</h2>
        <p>Sign up normally, then in the Supabase SQL editor run:</p>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
          {`update public.profiles
set system_role = 'super_admin'
where email = 'you@example.com';`}
        </pre>
      </div>
    </div>
  );
}
