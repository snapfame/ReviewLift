import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@/components/marketing/home-page";
import { MarketingPage } from "@/components/marketing/site-chrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReviewLift — more customer reviews, less effort" },
      {
        name: "description",
        content:
          "ReviewLift helps genuine customers share their experience with a QR code, an editable review suggestion, and a clear path to post on Google themselves.",
      },
      { property: "og:title", content: "ReviewLift — more customer reviews, less effort" },
      {
        property: "og:description",
        content:
          "A permanent QR code, editable review suggestions, and a business dashboard. Customers publish their own Google reviews.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <MarketingPage>
      <HomePage />
    </MarketingPage>
  );
}
