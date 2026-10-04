import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/hooks/use-business";
import { copyText } from "@/lib/copy";
import { downloadDataUrl, downloadText, qrPngDataUrl, qrSvgString } from "@/lib/qr";
import { reviewPageUrl } from "@/lib/urls";

export const Route = createFileRoute("/dashboard/qr")({
  component: QrPage,
});

function QrPage() {
  const { business } = useBusiness();
  const [png, setPng] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!business) return;
    const dest = reviewPageUrl(window.location.origin, business.slug, true);
    setUrl(dest);
    void qrPngDataUrl(dest).then(setPng);
  }, [business]);

  if (!business) return null;

  const publicUrl = reviewPageUrl(window.location.origin, business.slug);

  return (
    <div className="max-w-xl">
      <PageHeader
        title="QR code"
        description="The destination stays the same when services, logo, wording or Google URL change."
      />
      <div className="panel p-6">
        {png ? <img src={png} alt="Permanent review QR code" className="w-56" /> : <p className="text-sm">Preparing QR…</p>}
        <p className="mt-4 text-sm break-all">
          <span className="text-muted-foreground">Review page: </span>
          {publicUrl}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">QR destination includes ?src=qr so scans are counted separately from ordinary visits.</p>
        <p className="mt-2 text-sm">
          Status: <span className="font-medium">{business.status}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" disabled={!png} onClick={() => downloadDataUrl(`${business.slug}-qr.png`, png)}>
            Download PNG
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const svg = await qrSvgString(url);
              downloadText(`${business.slug}-qr.svg`, svg, "image/svg+xml");
            }}
          >
            Download SVG
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              const ok = await copyText(publicUrl);
              if (ok) toast.success("QR copied");
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
