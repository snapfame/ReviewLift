import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/app-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useBusiness } from "@/hooks/use-business";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { BUSINESS_CATEGORIES } from "@/lib/business-defaults";
import { uploadBusinessLogo } from "@/lib/business";
import { qrPngDataUrl } from "@/lib/qr";
import { normalizeSlugInput, slugChangeError } from "@/lib/slug";
import { reviewPageUrl } from "@/lib/urls";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { business, role, reload } = useBusiness();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugDraft, setSlugDraft] = useState("");
  const [confirmSlug, setConfirmSlug] = useState(false);
  const [slugBusy, setSlugBusy] = useState(false);

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

  useEffect(() => {
    if (!business) return;
    setSlugDraft(business.slug);
    setEditingSlug(false);
  }, [business?.id, business?.slug]);

  if (!business || !user) return null;

  const canEditSlug = role === "business_owner" || role === "business_admin";
  const nextSlug = normalizeSlugInput(slugDraft);
  const slugError = editingSlug ? slugChangeError(slugDraft) : null;

  const askSlugChange = () => {
    const message = slugChangeError(slugDraft);
    if (message) {
      toast.error(message);
      return;
    }
    if (nextSlug === business.slug) {
      setEditingSlug(false);
      return;
    }
    setConfirmSlug(true);
  };

  const commitSlug = async () => {
    const message = slugChangeError(slugDraft);
    if (message) {
      toast.error(message);
      return;
    }
    setSlugBusy(true);
    const { data, error } = await supabase.rpc("change_business_slug", {
      _business_id: business.id,
      _slug: nextSlug,
    });
    if (error) {
      setSlugBusy(false);
      toast.error(error.message);
      return;
    }
    const result = parseSlugChange(data);
    if (!result.ok) {
      setSlugBusy(false);
      toast.error(result.error);
      return;
    }
    if (!result.changed) {
      setSlugBusy(false);
      setConfirmSlug(false);
      setEditingSlug(false);
      return;
    }
    try {
      const png = await qrPngDataUrl(reviewPageUrl(window.location.origin, result.slug, true));
      if (!png.startsWith("data:image")) throw new Error("The new QR code could not be generated.");
    } catch (err) {
      setSlugBusy(false);
      setConfirmSlug(false);
      await reload();
      toast.error(err instanceof Error ? err.message : "The new QR code could not be generated.");
      return;
    }
    setSlugBusy(false);
    setConfirmSlug(false);
    setEditingSlug(false);
    await reload();
    toast.success("Your review URL has changed. Download and print your new QR code.");
  };

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
      <div className="space-y-2 rounded-lg border border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="slug">Public review URL</Label>
          {canEditSlug && !editingSlug ? (
            <Button type="button" variant="outline" size="sm" disabled={slugBusy} onClick={() => setEditingSlug(true)}>
              Edit
            </Button>
          ) : null}
        </div>
        {editingSlug ? (
          <>
            <Input
              id="slug"
              value={slugDraft}
              disabled={slugBusy}
              onChange={(e) => setSlugDraft(normalizeSlugInput(e.target.value))}
              onBlur={() => setSlugDraft(normalizeSlugInput(slugDraft))}
            />
            <p className="text-xs text-muted-foreground break-all">/r/{nextSlug || "…"}?src=qr</p>
            {slugError ? <p className="text-xs text-destructive">{slugError}</p> : null}
            <div className="flex gap-2">
              <Button type="button" disabled={slugBusy || Boolean(slugError)} onClick={askSlugChange}>
                Save URL
              </Button>
              <Button type="button" variant="outline" disabled={slugBusy} onClick={() => { setSlugDraft(business.slug); setEditingSlug(false); }}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm break-all">
            <strong>{business.slug}</strong>
          </p>
        )}
        {business.qr_reprint_required ? (
          <p className="text-sm font-medium text-destructive">
            New QR code — reprint required.{" "}
            <Link to="/dashboard/qr" className="underline">
              Your review URL has changed. Download and print your new QR code.
            </Link>
          </p>
        ) : null}
      </div>
      <AlertDialog open={confirmSlug} onOpenChange={(open) => { if (!slugBusy) setConfirmSlug(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change the review URL?</AlertDialogTitle>
            <AlertDialogDescription>
              Previously printed QR codes may stop working. The old address will redirect to /r/{nextSlug} when the update succeeds, and a new QR code will be generated for the current URL.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={slugBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={slugBusy} onClick={(event) => { event.preventDefault(); void commitSlug(); }}>
              {slugBusy ? "Updating…" : "Change URL"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </div>
  );
}

function parseSlugChange(value: Json): { ok: true; slug: string; changed: boolean } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "The review URL could not be changed." };
  }
  if (value["ok"] !== true) {
    return { ok: false, error: typeof value["error"] === "string" ? value["error"] : "The review URL could not be changed." };
  }
  if (typeof value["slug"] !== "string") return { ok: false, error: "The review URL could not be changed." };
  return { ok: true, slug: value["slug"], changed: value["changed"] === true };
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
