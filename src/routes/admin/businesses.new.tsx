import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS_CATEGORIES } from "@/lib/business-defaults";
import { createBusinessWithOwner } from "@/lib/business";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/admin/businesses/new")({
  component: AdminCreateBusiness,
});

function AdminCreateBusiness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Automotive Services");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [postal, setPostal] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [google, setGoogle] = useState("");
  const [instagram, setInstagram] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setBusy(true);
    try {
      const created = await createBusinessWithOwner({
        name,
        category,
        phone,
        address_line: address,
        city,
        state,
        postal_code: postal,
        country: "India",
        google_review_url: google || null,
        instagram_url: instagram || null,
        ownerId: user.id,
        seedDefaults: true,
      });
      if (slug.trim() && slugify(slug) !== created.slug) {
        const desired = slugify(slug);
        const { error } = await supabase.from("businesses").update({ slug: desired }).eq("id", created.id);
        if (error) toast.error(`Business created but slug was kept as ${created.slug}: ${error.message}`);
        else await supabase.from("qr_codes").update({ destination_slug: desired, code: `${desired}-primary` }).eq("business_id", created.id);
      }
      if (ownerEmail.trim() && ownerEmail.trim() !== user.email) {
        const { data: profile } = await supabase.from("profiles").select("id").eq("email", ownerEmail.trim()).maybeSingle();
        if (profile) {
          await supabase.from("business_members").insert({
            business_id: created.id,
            user_id: profile.id,
            role: "business_owner",
          });
        } else {
          toast.error("Owner email was not found. Assign them later from the business page.");
        }
      }
      await supabase.from("businesses").update({ onboarding_completed: true }).eq("id", created.id);
      toast.success("Business created");
      await navigate({ to: "/admin/businesses/$businessId", params: { businessId: created.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create business");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Create business</h1>
      <p className="text-sm text-muted-foreground">Manual assisted onboarding — no code changes required.</p>
      <Field label="Business name" value={name} onChange={setName} />
      <Field label="Slug (optional, unique)" value={slug} onChange={setSlug} />
      <div className="space-y-2">
        <Label htmlFor="cat">Category</Label>
        <select id="cat" className="h-9 w-full rounded-md border px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          {BUSINESS_CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <Field label="Phone" value={phone} onChange={setPhone} />
      <Field label="Address" value={address} onChange={setAddress} />
      <Field label="City" value={city} onChange={setCity} />
      <Field label="State" value={state} onChange={setState} />
      <Field label="PIN" value={postal} onChange={setPostal} />
      <Field label="Google Review URL" value={google} onChange={setGoogle} />
      <Field label="Instagram URL" value={instagram} onChange={setInstagram} />
      <Field label="Assign owner email (must already have an account)" value={ownerEmail} onChange={setOwnerEmail} />
      <Button disabled={busy} onClick={() => void create()}>
        {busy ? "Creating…" : "Create business"}
      </Button>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
