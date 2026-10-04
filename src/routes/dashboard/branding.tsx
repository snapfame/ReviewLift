import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useBusiness } from "@/hooks/use-business";
import { supabase } from "@/integrations/supabase/client";
import { uploadBusinessLogo } from "@/lib/business";

export const Route = createFileRoute("/dashboard/branding")({
  component: BrandingPage,
});

function BrandingPage() {
  const { user } = useAuth();
  const { business, reload } = useBusiness();
  const [color, setColor] = useState("#1f6feb");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");

  useEffect(() => {
    if (!business) return;
    setColor(business.accent_color || "#1f6feb");
    supabase
      .from("review_settings")
      .select("customer_headline,customer_subheadline")
      .eq("business_id", business.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setHeadline(data.customer_headline);
        setSubheadline(data.customer_subheadline);
      });
  }, [business]);

  if (!business || !user) return null;

  const save = async () => {
    const [{ error: a }, { error: b }] = await Promise.all([
      supabase.from("businesses").update({ accent_color: color }).eq("id", business.id),
      supabase
        .from("review_settings")
        .update({ customer_headline: headline, customer_subheadline: subheadline })
        .eq("business_id", business.id),
    ]);
    if (a || b) toast.error(a?.message || b?.message || "Could not save");
    else {
      toast.success("Saved");
      await reload();
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Branding" description="Constrained styling only — merchants cannot inject CSS or JavaScript." />
      <div className="space-y-2">
        <Label htmlFor="logo">Logo</Label>
        <Input
          id="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const url = await uploadBusinessLogo(user, business.id, file);
              const { error } = await supabase.from("businesses").update({ logo_url: url }).eq("id", business.id);
              if (error) throw error;
              toast.success("Logo updated");
              await reload();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Storage error");
            }
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Accent colour</Label>
        <div className="flex items-center gap-3">
          <input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-10 rounded border" />
          <Input value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="h">Customer page headline</Label>
        <Input id="h" value={headline} onChange={(e) => setHeadline(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="s">Customer page subheadline</Label>
        <Textarea id="s" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} />
      </div>
      <Button onClick={() => void save()}>Save branding</Button>
    </div>
  );
}
