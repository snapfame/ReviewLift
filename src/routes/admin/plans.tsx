import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/plans")({
  component: AdminPlans,
});

function AdminPlans() {
  const [plans, setPlans] = useState<{ name: string; code: string; active: boolean; limits: unknown }[]>([]);

  useEffect(() => {
    supabase
      .from("business_plans")
      .select("name,code,active,limits")
      .then(({ data }) => setPlans(data ?? []));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Plans</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Billing is not enabled. There is no checkout. Admins can assign these plans to a business from the business page.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.code} className="panel p-4">
            <h2 className="font-semibold">{plan.name}</h2>
            <p className="text-xs text-muted-foreground">{plan.code}</p>
            <p className="mt-2 text-sm">{plan.active ? "Active in catalog" : "Inactive"}</p>
            <pre className="mt-3 overflow-x-auto text-xs">{JSON.stringify(plan.limits, null, 2)}</pre>
            <p className="mt-3 text-xs font-medium text-muted-foreground">Checkout: Coming Soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}
