import { createFileRoute } from "@tanstack/react-router";

import { MarketingPage } from "@/components/marketing/site-chrome";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — ReviewLift" },
      { name: "description", content: "The rules for using ReviewLift, including review integrity." },
      { property: "og:title", content: "ReviewLift terms of service" },
      { property: "og:description", content: "Acceptable use and review integrity rules." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <MarketingPage>
      <article className="container-page max-w-3xl space-y-6 py-14 text-sm leading-relaxed text-muted-foreground">
        <h1 className="text-3xl font-semibold text-foreground">Terms of service</h1>
        <h2 className="text-xl font-semibold text-foreground">Review integrity</h2>
        <p>
          ReviewLift may only be used with genuine customers who actually received the service they
          select. You may not offer incentives in exchange for reviews, and you may not use the tool
          to filter out unhappy customers. Every customer sees the same Google call to action.
        </p>
        <h2 className="text-xl font-semibold text-foreground">Your responsibilities</h2>
        <p>
          You are responsible for the accuracy of your business details, service list and Google
          review link, and for complying with Google's review policies in your jurisdiction.
        </p>
        <h2 className="text-xl font-semibold text-foreground">Availability</h2>
        <p>
          The service is provided during early access without a formal uptime commitment. Billing is
          not enabled yet; plans are assigned manually.
        </p>
        <h2 className="text-xl font-semibold text-foreground">Termination</h2>
        <p>
          We may pause a business account that is used to publish fake reviews, to gate negative
          feedback or to misrepresent a customer's experience.
        </p>
      </article>
    </MarketingPage>
  );
}
