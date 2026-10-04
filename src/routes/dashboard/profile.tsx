import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useBusiness } from "@/hooks/use-business";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS_CATEGORIES } from "@/lib/business-defaults";
import { uploadBusinessLogo } from "@/lib/business";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { business, reload } = useBusiness();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!business) return;
    setName(business.name);
    setCategory(business.category ?? "");
    setPhone(business.phone ?? "");
    setAddress(business.address_line ?? "");
    setCity(business.city ?? "");
    setState(business.state ?? "");
    setPostal(business.postal_code ?? "");
    setCountry(business.country ?? "India");
  }, [business]);

  if (!business || !user) return null;

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: name.trim(),
        category,
        phone: phone.trim() || null,
        address_line: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        postal_code: postal.trim() || null,
        country: country.trim() || "India",
      })
      .eq("id", business.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      await reload();
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Business profile" description="Changing the name does not change your QR URL." />
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
              toast.error(err instanceof Error ? err.message : "Storage error — logo was not uploaded.");
            }
          }}
        />
      </div>
      <Field label="Name" value={name} onChange={setName} />
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
      <Field label="Country" value={country} onChange={setCountry} />
      <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
        Public review URL slug: <strong>{business.slug}</strong>. Changing it after the QR is printed will break existing codes. Slug edits are not offered in V1.
      </div>
      <Button disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = label.toLowerCase();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
