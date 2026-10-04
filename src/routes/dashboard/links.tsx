import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBusiness } from "@/hooks/use-business";
import { supabase } from "@/integrations/supabase/client";
import { isSafeHttpUrl, openSafeUrl } from "@/lib/urls";

export const Route = createFileRoute("/dashboard/links")({
  component: LinksPage,
});

function LinksPage() {
  const { business, reload } = useBusiness();
  const [google, setGoogle] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!business) return;
    setGoogle(business.google_review_url ?? "");
    setInstagram(business.instagram_url ?? "");
    setWebsite(business.website_url ?? "");
  }, [business]);

  const save = async () => {
    if (!business) return;
    for (const [label, value] of [
      ["Google Review URL", google],
      ["Instagram URL", instagram],
      ["Website URL", website],
    ] as const) {
      if (value && !isSafeHttpUrl(value)) {
        toast.error(`${label} must be a valid http(s) URL.`);
        return;
      }
    }
    setBusy(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        google_review_url: google.trim() || null,
        instagram_url: instagram.trim() || null,
        website_url: website.trim() || null,
      })
      .eq("id", business.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      await reload();
    }
  };

  const test = (value: string, label: string) => {
    if (!value) {
      toast.error(`${label} has not been configured yet.`);
      return;
    }
    if (!isSafeHttpUrl(value) || !openSafeUrl(value)) toast.error(`${label} is not a valid URL.`);
  };

  return (
    <div className="max-w-xl space-y-4">
      <PageHeader title="Links" description="The Google Review URL is opened only when the customer chooses to continue." />
      <div className="space-y-2">
        <div className="rounded-lg border border-border bg-muted/50 px-3 py-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">How to get your Google Review link</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>On a desktop browser, sign in to the Google account that manages your Business Profile.</li>
            <li>Search Google for your business name.</li>
            <li>Click Read reviews.</li>
            <li>Click Get more reviews.</li>
            <li>Click Copy link and paste that link below.</li>
          </ol>
          <p className="mt-2">
            Use the direct review link, not a normal Google Search or Maps URL. The correct link should open the
            review box directly for customers.
          </p>
          <a
            href="https://support.google.com/business/answer/16816815"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
          >
            Google instructions
          </a>
        </div>
        <Label htmlFor="g">Google Review URL</Label>
        <Input id="g" value={google} onChange={(e) => setGoogle(e.target.value)} placeholder="https://search.google.com/local/writereview?placeid=..." />
        <Button type="button" variant="outline" size="sm" onClick={() => test(google, "Google Review URL")}>
          Test Google link
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="i">Instagram URL</Label>
        <Input id="i" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        <Button type="button" variant="outline" size="sm" onClick={() => test(instagram, "Instagram URL")}>
          Test Instagram link
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="w">Website URL</Label>
        <Input id="w" value={website} onChange={(e) => setWebsite(e.target.value)} />
        <Button type="button" variant="outline" size="sm" onClick={() => test(website, "Website URL")}>
          Test website link
        </Button>
      </div>
      <Button disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save links"}
      </Button>
    </div>
  );
}
