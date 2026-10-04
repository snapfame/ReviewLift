import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

import { MarketingPage } from "@/components/marketing/site-chrome";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ReviewLift" },
      {
        name: "description",
        content: "Get in touch about onboarding your business, plans or support.",
      },
      { property: "og:title", content: "Contact ReviewLift" },
      { property: "og:description", content: "Reach the ReviewLift team about onboarding or support." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <MarketingPage>
      <section className="hero-gradient border-b border-border">
        <div className="container-page py-16">
          <h1 className="text-4xl font-semibold sm:text-5xl">Contact</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            We onboard businesses personally during early access. Reach out and we will get your QR
            live.
          </p>
        </div>
      </section>
      <div className="container-page grid gap-4 py-14 sm:grid-cols-3">
        <a href="mailto:hello@reviewlift.app" className="panel block p-6 hover:shadow-lg">
          <Mail className="size-5 text-primary" aria-hidden />
          <h2 className="mt-3 font-semibold">Email</h2>
          <p className="mt-1 text-sm text-muted-foreground">hello@reviewlift.app</p>
        </a>
        <a href="tel:+917987310828" className="panel block p-6 hover:shadow-lg">
          <Phone className="size-5 text-primary" aria-hidden />
          <h2 className="mt-3 font-semibold">Phone</h2>
          <p className="mt-1 text-sm text-muted-foreground">+91 79873 10828</p>
        </a>
        <div className="panel p-6">
          <MapPin className="size-5 text-primary" aria-hidden />
          <h2 className="mt-3 font-semibold">Based in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Mandsaur, Madhya Pradesh, India</p>
        </div>
      </div>
    </MarketingPage>
  );
}
