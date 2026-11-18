import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/#industries", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faqs", label: "FAQs" },
] as const;

export function Logo({ className = "h-12" }: { className?: string }) {
  return (
    <Link to="/" className="inline-flex shrink-0 items-center">
      <img src="/brand/reviewlift-logo.png?v=2" alt="ReviewLift" className={`${className} w-auto`} />
    </Link>
  );
}

function navClass(active: boolean) {
  return active
    ? "rounded-full bg-[var(--brand-light)] px-3 py-2 text-sm font-medium text-[var(--brand-primary)]"
    : "rounded-full px-3 py-2 text-sm font-medium text-[#444] transition-colors hover:bg-[var(--brand-light)] hover:text-[var(--brand-navy)]";
}

function isCurrent(href: string, pathname: string, hash: string) {
  if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(2);
  return pathname === href;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const hash = useRouterState({ select: (state) => state.location.hash.replace(/^#/, "") });

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 rounded-full border border-[#E8E8E5] bg-white/85 px-3 shadow-[0_8px_30px_rgb(17_17_17/0.04)] backdrop-blur-md sm:px-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href, pathname, hash) ? "page" : undefined}
              className={navClass(isCurrent(item.href, pathname, hash))}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {!loading && user ? (
            <Link to="/dashboard" className="rl-btn rl-btn-dark">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-3 py-2 text-sm font-medium text-[#101010] hover:bg-[var(--brand-light)] hover:text-[var(--brand-navy)]">
                Log In
              </Link>
              <Link to="/signup" className="rl-btn rl-btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="inline-flex size-10 items-center justify-center rounded-full border border-[#E8E8E5] lg:hidden" aria-label="Open menu">
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="right" className="rl-site w-[86vw] max-w-xs bg-[#FAFAF8]">
            <SheetTitle className="px-4 pt-4 text-[#111]">Menu</SheetTitle>
            <nav className="mt-4 flex flex-col gap-1 px-4" aria-label="Mobile">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isCurrent(item.href, pathname, hash) ? "page" : undefined}
                  className={`rounded-xl px-3 py-3 text-sm font-medium ${isCurrent(item.href, pathname, hash) ? "bg-white text-[var(--brand-primary)]" : "text-[#101010] hover:bg-white"}`}
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2">
                {user ? (
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="rl-btn rl-btn-dark">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)} className="rl-btn rl-btn-ghost">
                      Log In
                    </Link>
                    <Link to="/signup" onClick={() => setOpen(false)} className="rl-btn rl-btn-primary">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

const FOOTER = [
  {
    title: "Product",
    links: [
      ["Features", "/features"],
      ["How It Works", "/how-it-works"],
      ["Pricing", "/pricing"],
      ["Log In", "/login"],
    ],
  },
  {
    title: "Solutions",
    links: [
      ["Restaurants", "/#industries"],
      ["Salons", "/#industries"],
      ["Clinics", "/#industries"],
      ["Retail", "/#industries"],
      ["Multi-business", "/#platform"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["Privacy Policy", "/privacy"],
      ["Terms of Service", "/terms"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[#E8E8E5] bg-white">
      <div className="rl-wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo className="h-14" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#737373]">
            A simpler way for genuine customers to share their experience and publish a Google review themselves.
          </p>
        </div>
        {FOOTER.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-semibold tracking-normal text-[#111]">{column.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-[#737373]">
              {column.links.map(([label, href]) => (
                <li key={label}>
                  <a href={href} className="transition-colors hover:text-[var(--brand-primary)]">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#E8E8E5]">
        <div className="rl-wrap flex flex-col gap-2 py-6 text-xs text-[#737373] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} ReviewLift</p>
          <p>Customers write and publish their own reviews. ReviewLift is not affiliated with Google.</p>
        </div>
      </div>
    </footer>
  );
}

export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <div className="rl-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[#E8E8E5]">
      <div className="rl-wrap max-w-4xl py-16 sm:py-20">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#737373] uppercase">{eyebrow}</p>
        <h1 className="mt-4 text-4xl leading-[1.05] font-semibold sm:text-6xl">{title}</h1>
        <div className="mt-5 max-w-2xl text-lg leading-relaxed text-[#555]">{children}</div>
      </div>
    </section>
  );
}
