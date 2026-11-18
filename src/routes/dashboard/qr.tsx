import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/hooks/use-business";
import { supabase } from "@/integrations/supabase/client";
import { copyText } from "@/lib/copy";
import { downloadDataUrl, downloadText, qrPngDataUrl, qrSvgString } from "@/lib/qr";
import { reviewPageUrl } from "@/lib/urls";

export const Route = createFileRoute("/dashboard/qr")({
  component: QrPage,
});

function QrPage() {
  const { business, reload } = useBusiness();
  const [png, setPng] = useState("");
  const [readySlug, setReadySlug] = useState("");
  const [acking, setAcking] = useState(false);

  const slug = business?.slug ?? "";

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const dest = reviewPageUrl(window.location.origin, slug, true);
    setPng("");
    setReadySlug("");
    void qrPngDataUrl(dest)
      .then((value) => {
        if (!cancelled) {
          setPng(value);
          setReadySlug(slug);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("The QR code could not be generated.");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!business) return null;

  const publicUrl = reviewPageUrl(window.location.origin, business.slug);
  const qrUrl = reviewPageUrl(window.location.origin, business.slug, true);
  const pending = !png || readySlug !== business.slug;

  const acknowledge = async () => {
    setAcking(true);
    const { error } = await supabase
      .from("businesses")
      .update({ qr_reprint_required: false })
      .eq("id", business.id);
    setAcking(false);
    if (error) toast.error(error.message);
    else await reload();
  };

  return (
    <div className="max-w-xl">
      <PageHeader
        title="QR code"
        description="The destination stays the same when services, logo, wording or Google URL change."
      />
      {business.qr_reprint_required ? (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <p className="font-semibold">New QR code — reprint required</p>
          <p className="mt-1">Your review URL has changed. Download and print your new QR code.</p>
          <Button className="mt-3" variant="outline" disabled={pending || acking} onClick={() => void acknowledge()}>
            I reprinted this QR code
          </Button>
        </div>
      ) : null}
      <div className="panel p-6">
        {png && !pending ? <img src={png} alt="Review QR code" className="w-56" /> : <p className="text-sm">Preparing QR…</p>}
        <p className="mt-4 text-sm break-all">
          <span className="text-muted-foreground">Review page: </span>
          {publicUrl}
        </p>
        <p className="mt-1 text-xs break-all text-muted-foreground">QR destination: {qrUrl}</p>
        <p className="mt-2 text-sm">
          Status: <span className="font-medium">{business.status}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending} onClick={() => downloadDataUrl(`${business.slug}-qr.png`, png)}>
            Download PNG
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={async () => {
              const svg = await qrSvgString(qrUrl);
              downloadText(`${business.slug}-qr.svg`, svg, "image/svg+xml");
            }}
          >
            Download SVG
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={async () => {
              const ok = await copyText(publicUrl);
              if (ok) toast.success("Review link copied");
            }}
          >
            Copy review link
          </Button>
          <Button asChild>
            <a href={`/r/${business.slug}`} target="_blank" rel="noreferrer">
              Open review page
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
