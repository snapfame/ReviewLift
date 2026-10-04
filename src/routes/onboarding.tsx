import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/marketing/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  BUSINESS_CATEGORIES,
  DEFAULT_ATTRIBUTES,
  defaultsForCategory,
} from "@/lib/business-defaults";
import {
  allocateSlug,
  createBusinessWithOwner,
  fetchMemberships,
  uploadBusinessLogo,
  type Business,
} from "@/lib/business";
import { downloadDataUrl, downloadText, qrPngDataUrl, qrSvgString } from "@/lib/qr";
import { copyText } from "@/lib/copy";
import { isSafeHttpUrl, reviewPageUrl } from "@/lib/urls";
import { trackEventClient } from "@/lib/public-review-client";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up your business — ReviewLift" }] }),
  component: OnboardingPage,
});

interface DraftService {
  name: string;
  vocabulary: string[];
}
interface DraftCategory {
  name: string;
  services: DraftService[];
}

function OnboardingPage() {
  const { user, loading, profileReady, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const redirected = useRef(false);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Automotive Services");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("India");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [googleUrl, setGoogleUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [categories, setCategories] = useState<DraftCategory[]>(defaultsForCategory("Automotive Services"));

  const [allowEnglish, setAllowEnglish] = useState(true);
  const [allowHindi, setAllowHindi] = useState(true);
  const [allowHinglish, setAllowHinglish] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState<"english" | "hindi" | "hinglish">("english");
  const [defaultLength, setDefaultLength] = useState<"short" | "medium" | "detailed">("medium");
  const [headline, setHeadline] = useState("Share your experience");
  const [subheadline, setSubheadline] = useState(
    "Answer a few quick questions and get a review draft you can edit.",
  );
  const [allowRegenerate, setAllowRegenerate] = useState(true);
  const [showNote, setShowNote] = useState(true);
  const [attributes, setAttributes] = useState<string[]>([...DEFAULT_ATTRIBUTES]);
  const [qrUrl, setQrUrl] = useState("");
  const [qrPng, setQrPng] = useState("");

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) {
      redirected.current = true;
      void navigate({ to: "/login", search: { redirect: "/onboarding" } });
      return;
    }
    if (!profileReady) return;
    if (isSuperAdmin) {
      redirected.current = true;
      void navigate({ to: "/admin" });
      return;
    }
    let active = true;
    fetchMemberships(user.id)
      .then((memberships) => {
        if (!active || redirected.current) return;
        const ready = memberships.find((m) => m.business.onboarding_completed);
        if (ready) {
          redirected.current = true;
          void navigate({ to: "/dashboard" });
          return;
        }
        const pending = memberships.find((m) => !m.business.onboarding_completed);
        if (pending) {
          setBusinessId(pending.business.id);
          setName(pending.business.name);
          setSlug(pending.business.slug);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [loading, profileReady, user, isSuperAdmin, navigate]);

  useEffect(() => {
    setCategories(defaultsForCategory(category));
  }, [category]);

  const uploadLogo = async (file: File | undefined) => {
    if (!file || !user) return;
    try {
      const tempId = businessId ?? "pending";
      const url = await uploadBusinessLogo(user, tempId, file);
      setLogoUrl(url);
      toast.success("Logo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload logo.");
    }
  };

  const persistStep1 = async (): Promise<Business> => {
    if (!user) throw new Error("Please log in again.");
    if (!name.trim()) throw new Error("Business name is required.");
    if (businessId) {
      const { data, error } = await supabase
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
          logo_url: logoUrl,
        })
        .eq("id", businessId)
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Could not save business.");
      return data;
    }
    const created = await createBusinessWithOwner({
      name,
      category,
      phone,
      address_line: address,
      city,
      state,
      postal_code: postal,
      country,
      logo_url: logoUrl,
      ownerId: user.id,
      seedDefaults: false,
    });
    setBusinessId(created.id);
    setSlug(created.slug);
    return created;
  };

  const next = async () => {
    setBusy(true);
    try {
      if (step === 1) {
        await persistStep1();
        setStep(2);
      } else if (step === 2) {
        if (googleUrl && !isSafeHttpUrl(googleUrl)) throw new Error("Google Review URL must start with http(s).");
        if (instagramUrl && !isSafeHttpUrl(instagramUrl)) throw new Error("Instagram URL must start with http(s).");
        if (websiteUrl && !isSafeHttpUrl(websiteUrl)) throw new Error("Website URL must start with http(s).");
        if (!businessId) throw new Error("Save business details first.");
        const { error } = await supabase
          .from("businesses")
          .update({
            google_review_url: googleUrl.trim() || null,
            instagram_url: instagramUrl.trim() || null,
            website_url: websiteUrl.trim() || null,
          })
          .eq("id", businessId);
        if (error) throw error;
        setStep(3);
      } else if (step === 3) {
        if (!businessId) throw new Error("Save business details first.");
        const usable = categories.filter((c) => c.name.trim() && c.services.some((s) => s.name.trim()));
        if (usable.length === 0) throw new Error("Add at least one service.");
        await supabase.from("business_services").delete().eq("business_id", businessId);
        await supabase.from("service_categories").delete().eq("business_id", businessId);
        for (let i = 0; i < usable.length; i += 1) {
          const cat = usable[i]!;
          const { data: created, error } = await supabase
            .from("service_categories")
            .insert({ business_id: businessId, name: cat.name.trim(), sort_order: i + 1, active: true })
            .select("id")
            .single();
          if (error || !created) throw new Error(error?.message ?? "Could not save category.");
          const services = cat.services.filter((s) => s.name.trim());
          const { error: svcError } = await supabase.from("business_services").insert(
            services.map((service, index) => ({
              business_id: businessId,
              category_id: created.id,
              name: service.name.trim(),
              sort_order: index + 1,
              vocabulary: service.vocabulary,
              active: true,
            })),
          );
          if (svcError) throw svcError;
        }
        setStep(4);
      } else if (step === 4) {
        if (!businessId) throw new Error("Save business details first.");
        if (!allowEnglish && !allowHindi && !allowHinglish) {
          throw new Error("Enable at least one language.");
        }
        const { error } = await supabase
          .from("review_settings")
          .update({
            customer_headline: headline.trim() || "Share your experience",
            customer_subheadline: subheadline.trim(),
            allow_english: allowEnglish,
            allow_hindi: allowHindi,
            allow_hinglish: allowHinglish,
            default_language: defaultLanguage,
            default_length: defaultLength,
            allow_regenerate: allowRegenerate,
            show_optional_note: showNote,
            selectable_attributes: attributes,
          })
          .eq("business_id", businessId);
        if (error) throw error;
        const { data: biz } = await supabase.from("businesses").select("slug").eq("id", businessId).single();
        const nextSlug = biz?.slug || slug || (await allocateSlug(name));
        setSlug(nextSlug);
        const url = reviewPageUrl(window.location.origin, nextSlug, true);
        setQrUrl(url);
        setQrPng(await qrPngDataUrl(url));
        setStep(5);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this step.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (!businessId) return;
    setBusy(true);
    const { error } = await supabase
      .from("businesses")
      .update({ onboarding_completed: true })
      .eq("id", businessId);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await trackEventClient({
      businessId,
      eventType: "onboarding_completed",
    }).catch(() => undefined);
    toast.success("Business ready");
    await navigate({ to: "/dashboard" });
  };

  if (loading || !user) {
    return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container-page flex h-14 items-center justify-between">
          <Logo />
          <span className="text-xs text-muted-foreground">Step {step} of 5</span>
        </div>
      </header>
      <main className="container-page max-w-2xl py-10">
        {step === 1 ? (
          <section className="space-y-4">
            <h1 className="text-3xl font-semibold">Business information</h1>
            <Field label="Business name" value={name} onChange={setName} required />
            <div className="space-y-2">
              <Label htmlFor="category">Business category</Label>
              <select
                id="category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {BUSINESS_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <Input id="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => void uploadLogo(e.target.files?.[0])} />
            </div>
            <Field label="Phone" value={phone} onChange={setPhone} />
            <Field label="Address" value={address} onChange={setAddress} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" value={city} onChange={setCity} />
              <Field label="State" value={state} onChange={setState} />
              <Field label="PIN / Postal code" value={postal} onChange={setPostal} />
              <Field label="Country" value={country} onChange={setCountry} />
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-4">
            <h1 className="text-3xl font-semibold">Online links</h1>
            <p className="text-sm text-muted-foreground">
              Google Review URL is required before you send customers to Google. You can add it later.
            </p>
            <Field label="Google Review URL (required before going live)" value={googleUrl} onChange={setGoogleUrl} placeholder="https://search.google.com/local/writereview?..." />
            <Field label="Instagram URL" value={instagramUrl} onChange={setInstagramUrl} />
            <Field label="Website URL (optional)" value={websiteUrl} onChange={setWebsiteUrl} />
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-4">
            <h1 className="text-3xl font-semibold">Services</h1>
            <p className="text-sm text-muted-foreground">
              Defaults are based on your category. Edit freely — the public page updates from this list.
            </p>
            {categories.map((cat, ci) => (
              <div key={ci} className="panel p-4">
                <Input
                  value={cat.name}
                  onChange={(e) => {
                    const nextCats = [...categories];
                    nextCats[ci] = { ...cat, name: e.target.value };
                    setCategories(nextCats);
                  }}
                  aria-label="Category name"
                />
                <div className="mt-3 space-y-2">
                  {cat.services.map((service, si) => (
                    <Input
                      key={si}
                      value={service.name}
                      onChange={(e) => {
                        const nextCats = [...categories];
                        const services = [...cat.services];
                        services[si] = { ...service, name: e.target.value };
                        nextCats[ci] = { ...cat, services };
                        setCategories(nextCats);
                      }}
                      aria-label="Service name"
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const nextCats = [...categories];
                      nextCats[ci] = {
                        ...cat,
                        services: [...cat.services, { name: "", vocabulary: ["service", "quality"] }],
                      };
                      setCategories(nextCats);
                    }}
                  >
                    Add service
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setCategories([...categories, { name: "New category", services: [{ name: "New service", vocabulary: [] }] }])
              }
            >
              Add category
            </Button>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="space-y-4">
            <h1 className="text-3xl font-semibold">Review experience</h1>
            <Field label="Customer headline" value={headline} onChange={setHeadline} />
            <div className="space-y-2">
              <Label htmlFor="sub">Customer subheadline</Label>
              <Textarea id="sub" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Enabled languages</legend>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allowEnglish} onChange={(e) => setAllowEnglish(e.target.checked)} /> English
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allowHinglish} onChange={(e) => setAllowHinglish(e.target.checked)} /> Hinglish
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allowHindi} onChange={(e) => setAllowHindi(e.target.checked)} /> Hindi
              </label>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="deflang">Default language</Label>
              <select
                id="deflang"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value as typeof defaultLanguage)}
              >
                <option value="english">English</option>
                <option value="hinglish">Hinglish</option>
                <option value="hindi">Hindi</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="len">Review length</Label>
              <select
                id="len"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={defaultLength}
                onChange={(e) => setDefaultLength(e.target.value as typeof defaultLength)}
              >
                <option value="short">Short (25–50 words)</option>
                <option value="medium">Medium (50–90 words)</option>
                <option value="detailed">Detailed (90–140 words)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allowRegenerate} onChange={(e) => setAllowRegenerate(e.target.checked)} />
              Allow Generate Another
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showNote} onChange={(e) => setShowNote(e.target.checked)} />
              Show optional comment field
            </label>
            <div>
              <p className="text-sm font-medium">Standout attributes</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEFAULT_ATTRIBUTES.map((attr) => (
                  <label key={attr} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={attributes.includes(attr)}
                      onChange={(e) =>
                        setAttributes((current) =>
                          e.target.checked ? [...current, attr] : current.filter((x) => x !== attr),
                        )
                      }
                    />
                    {attr}
                  </label>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {step === 5 ? (
          <section className="space-y-4">
            <h1 className="text-3xl font-semibold">Your QR is ready</h1>
            <p className="text-sm text-muted-foreground">
              Permanent review URL: <span className="font-medium text-foreground">{window.location.origin}/r/{slug}</span>
            </p>
            {qrPng ? <img src={qrPng} alt="Review page QR code" className="w-56 rounded-xl border border-border" /> : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadDataUrl(`${slug}-qr.png`, qrPng)}
                disabled={!qrPng}
              >
                Download PNG
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const svg = await qrSvgString(qrUrl);
                  downloadText(`${slug}-qr.svg`, svg, "image/svg+xml");
                }}
              >
                Download SVG
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const ok = await copyText(reviewPageUrl(window.location.origin, slug));
                  if (ok) toast.success("Link copied");
                }}
              >
                Copy link
              </Button>
              <Button asChild variant="outline">
                <a href={`/r/${slug}`} target="_blank" rel="noreferrer">
                  Open review page
                </a>
              </Button>
            </div>
          </section>
        ) : null}

        <div className="mt-8 flex justify-between gap-2">
          {step > 1 && step < 5 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => (s - 1) as typeof step)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 5 ? (
            <Button type="button" disabled={busy} onClick={() => void next()}>
              {busy ? "Saving…" : "Continue"}
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={() => void finish()}>
              Go to dashboard
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input id={id} value={value} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
