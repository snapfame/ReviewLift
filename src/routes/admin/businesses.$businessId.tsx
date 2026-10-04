import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Business } from "@/lib/business";
import { reviewPageUrl } from "@/lib/urls";

export const Route = createFileRoute("/admin/businesses/$businessId")({
  component: AdminBusinessDetail,
});

function AdminBusinessDetail() {
  const { businessId } = Route.useParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Business["status"]>("active");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [planCode, setPlanCode] = useState("growth");
  const [visits, setVisits] = useState(0);
  const [generated, setGenerated] = useState(0);

  useEffect(() => {
    supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setBusiness(data);
        setName(data.name);
        setStatus(data.status);
      });
    supabase
      .from("analytics_events")
      .select("event_type")
      .eq("business_id", businessId)
      .then(({ data }) => {
        const events = data ?? [];
        setVisits(events.filter((e) => e.event_type === "review_page_loaded" || e.event_type === "qr_scan").length);
        setGenerated(events.filter((e) => e.event_type === "review_generated").length);
      });
  }, [businessId]);

  if (!business) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const save = async () => {
    const { error } = await supabase.from("businesses").update({ name: name.trim(), status }).eq("id", business.id);
    if (error) toast.error(error.message);
    else toast.success("Business updated");
  };

  const assignOwner = async () => {
    const { data: profile } = await supabase.from("profiles").select("id").eq("email", ownerEmail.trim()).maybeSingle();
    if (!profile) {
      toast.error("No user with that email.");
      return;
    }
    const { error } = await supabase.from("business_members").insert({
      business_id: business.id,
      user_id: profile.id,
      role: "business_owner",
    });
    if (error) toast.error(error.message);
    else toast.success("Owner assigned");
  };

  const assignPlan = async () => {
    const { data: plan } = await supabase.from("business_plans").select("id").eq("code", planCode).maybeSingle();
    if (!plan) {
      toast.error("Plan not found");
      return;
    }
    const { error } = await supabase.from("business_subscriptions").insert({
      business_id: business.id,
      plan_id: plan.id,
      status: "active",
    });
    if (error) toast.error(error.message);
    else toast.success("Plan assigned");
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">{business.name}</h1>
      <p className="text-sm text-muted-foreground">
        {visits} review page visits · {generated} drafts generated
      </p>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select id="status" className="h-9 w-full rounded-md border px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value as Business["status"])}>
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="inactive">inactive</option>
        </select>
      </div>
      <Button onClick={() => void save()}>Save</Button>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <a href={`/r/${business.slug}`} target="_blank" rel="noreferrer">
            Open review page
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`/r/${business.slug}?src=qr`} target="_blank" rel="noreferrer">
            View QR destination
          </a>
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin/analytics">View analytics</Link>
        </Button>
      </div>
      <p className="text-xs break-all text-muted-foreground">{typeof window !== "undefined" ? reviewPageUrl(window.location.origin, business.slug, true) : `/r/${business.slug}?src=qr`}</p>
      <div className="space-y-2 pt-4">
        <Label htmlFor="owner">Assign owner by email</Label>
        <Input id="owner" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
        <Button variant="outline" onClick={() => void assignOwner()}>
          Assign owner
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="plan">Assign plan</Label>
        <select id="plan" className="h-9 w-full rounded-md border px-3 text-sm" value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
          <option value="pro">Pro</option>
        </select>
        <Button variant="outline" onClick={() => void assignPlan()}>
          Assign plan
        </Button>
      </div>
    </div>
  );
}
