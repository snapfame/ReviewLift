import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/hooks/use-business";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_ATTRIBUTES } from "@/lib/business-defaults";

export const Route = createFileRoute("/dashboard/experience")({
  component: ExperiencePage,
});

function ExperiencePage() {
  const { business } = useBusiness();
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [allowEnglish, setAllowEnglish] = useState(true);
  const [allowHindi, setAllowHindi] = useState(true);
  const [allowHinglish, setAllowHinglish] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState<"english" | "hindi" | "hinglish">("english");
  const [defaultLength, setDefaultLength] = useState<"short" | "medium" | "detailed">("medium");
  const [allowRegenerate, setAllowRegenerate] = useState(true);
  const [showNote, setShowNote] = useState(true);
  const [cta, setCta] = useState("Copy & Continue to Google");
  const [attributes, setAttributes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!business) return;
    supabase
      .from("review_settings")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setHeadline(data.customer_headline);
        setSubheadline(data.customer_subheadline);
        setAllowEnglish(data.allow_english);
        setAllowHindi(data.allow_hindi);
        setAllowHinglish(data.allow_hinglish);
        setDefaultLanguage(data.default_language);
        setDefaultLength(data.default_length);
        setAllowRegenerate(data.allow_regenerate);
        setShowNote(data.show_optional_note);
        setCta(data.google_cta_text);
        setAttributes(Array.isArray(data.selectable_attributes) ? (data.selectable_attributes as string[]) : []);
      });
  }, [business]);

  const save = async () => {
    if (!business) return;
    setBusy(true);
    const { error } = await supabase
      .from("review_settings")
      .update({
        customer_headline: headline,
        customer_subheadline: subheadline,
        allow_english: allowEnglish,
        allow_hindi: allowHindi,
        allow_hinglish: allowHinglish,
        default_language: defaultLanguage,
        default_length: defaultLength,
        allow_regenerate: allowRegenerate,
        show_optional_note: showNote,
        google_cta_text: cta,
        selectable_attributes: attributes,
      })
      .eq("business_id", business.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Settings updated");
  };

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Review experience" description="These settings appear on the public review page immediately." />
      <div className="space-y-2">
        <Label htmlFor="h">Customer headline</Label>
        <Input id="h" value={headline} onChange={(e) => setHeadline(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="s">Customer subheadline</Label>
        <Textarea id="s" value={subheadline} onChange={(e) => setSubheadline(e.target.value)} />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Enabled languages</legend>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" checked={allowEnglish} onChange={(e) => setAllowEnglish(e.target.checked)} /> English
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" checked={allowHinglish} onChange={(e) => setAllowHinglish(e.target.checked)} /> Hinglish
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" checked={allowHindi} onChange={(e) => setAllowHindi(e.target.checked)} /> Hindi
        </label>
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="dl">Default language</Label>
        <select id="dl" className="h-9 w-full rounded-md border border-input px-3 text-sm" value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value as typeof defaultLanguage)}>
          <option value="english">English</option>
          <option value="hinglish">Hinglish</option>
          <option value="hindi">Hindi</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="len">Default review length</Label>
        <select id="len" className="h-9 w-full rounded-md border border-input px-3 text-sm" value={defaultLength} onChange={(e) => setDefaultLength(e.target.value as typeof defaultLength)}>
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="detailed">Detailed</option>
        </select>
      </div>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={allowRegenerate} onChange={(e) => setAllowRegenerate(e.target.checked)} /> Allow Generate Another
      </label>
      <label className="flex gap-2 text-sm">
        <input type="checkbox" checked={showNote} onChange={(e) => setShowNote(e.target.checked)} /> Optional comment field
      </label>
      <div className="space-y-2">
        <Label htmlFor="cta">Google CTA text</Label>
        <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} />
      </div>
      <div>
        <p className="text-sm font-medium">Standout attributes</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEFAULT_ATTRIBUTES.map((attr) => (
            <label key={attr} className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs">
              <input
                type="checkbox"
                checked={attributes.includes(attr)}
                onChange={(e) =>
                  setAttributes((current) => (e.target.checked ? [...current, attr] : current.filter((x) => x !== attr)))
                }
              />
              {attr}
            </label>
          ))}
        </div>
      </div>
      <Button disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
