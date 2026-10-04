import { Instagram } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EXPERIENCE_OPTIONS, type ExperienceValue } from "@/lib/business-defaults";
import { copyText } from "@/lib/copy";
import { isSafeHttpUrl, openSafeUrl } from "@/lib/urls";
import {
  generateDraft,
  getPublicBusiness,
  markGeneration,
  startSession,
  trackEvent,
  type PublicBusinessPayload,
} from "@/lib/public-review.functions";
import {
  generateDraftClient,
  getPublicBusinessClient,
  markGenerationClient,
  startSessionClient,
  trackEventClient,
} from "@/lib/public-review-client";
import { cn } from "@/lib/utils";

type Lang = "english" | "hinglish" | "hindi";
type Length = "short" | "medium" | "detailed";

export function ReviewFlow({ slug, fromQr }: { slug: string; fromQr: boolean }) {
  const [payload, setPayload] = useState<PublicBusinessPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceValue | null>(null);
  const [attributes, setAttributes] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [language, setLanguage] = useState<Lang>("english");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [originalDraft, setOriginalDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editedTracked, setEditedTracked] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let data: PublicBusinessPayload;
        try {
          data = await getPublicBusiness({ data: { slug } });
        } catch {
          data = await getPublicBusinessClient(slug);
        }
        if (!active) return;
        setPayload(data);
        if (data.status === "ok" && data.business && data.settings) {
          setLanguage(data.settings.default_language);
          const eventType = fromQr ? "qr_scan" : "review_page_loaded";
          try {
            await trackEvent({
              data: {
                businessId: data.business.id,
                eventType,
                metadata: { slug, src: fromQr ? "qr" : "link" },
              },
            });
          } catch {
            await trackEventClient({
              businessId: data.business.id,
              eventType,
              metadata: { slug, src: fromQr ? "qr" : "link" },
            });
          }
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load this page.");
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, fromQr]);

  const business = payload?.business;
  const settings = payload?.settings;
  const services = payload?.services ?? [];
  const categories = payload?.categories ?? [];
  const accent = business?.accent_color || "#1f6feb";

  const languages = useMemo(() => {
    const list: { value: Lang; label: string }[] = [];
    if (settings?.allow_english) list.push({ value: "english", label: "English" });
    if (settings?.allow_hinglish) list.push({ value: "hinglish", label: "Hinglish" });
    if (settings?.allow_hindi) list.push({ value: "hindi", label: "हिन्दी" });
    return list;
  }, [settings]);

  const grouped = useMemo(() => {
    const byCat = categories.map((category) => ({
      ...category,
      services: services.filter((service) => service.category_id === category.id),
    }));
    const uncategorized = services.filter((service) => !service.category_id);
    return { byCat, uncategorized };
  }, [categories, services]);

  const toggle = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  const toggleAttr = (label: string) => {
    setAttributes((current) =>
      current.includes(label) ? current.filter((x) => x !== label) : [...current, label],
    );
  };

  const continueToExperience = async () => {
    if (!business || selected.length === 0) {
      toast.error("Select at least one service.");
      return;
    }
    setBusy(true);
    try {
      let result: { sessionId: string };
      try {
        result = await startSession({
          data: { businessId: business.id, serviceIds: selected, fromQr },
        });
      } catch {
        result = await startSessionClient({ businessId: business.id, serviceIds: selected, fromQr });
      }
      setSessionId(result.sessionId);
      setStep(2);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start your review.");
    } finally {
      setBusy(false);
    }
  };

  const runGenerate = async (regenerate = false) => {
    if (!business || !sessionId || !experience) {
      toast.error("Tell us how your experience was.");
      return;
    }
    setBusy(true);
    try {
      if (!regenerate) {
        try {
          await trackEvent({
            data: {
              businessId: business.id,
              sessionId,
              eventType: "experience_selected",
              metadata: { experience },
            },
          });
        } catch {
          await trackEventClient({
            businessId: business.id,
            sessionId,
            eventType: "experience_selected",
            metadata: { experience },
          });
        }
        if (attributes.length > 0) {
          try {
            await trackEvent({
              data: {
                businessId: business.id,
                sessionId,
                eventType: "attributes_selected",
                metadata: { attributes },
              },
            });
          } catch {
            await trackEventClient({
              businessId: business.id,
              sessionId,
              eventType: "attributes_selected",
              metadata: { attributes },
            });
          }
        }
      }

      const selectedServices = services.filter((service) => selected.includes(service.id));
      let result: { generationId: string; text: string };
      try {
        result = await generateDraft({
          data: {
            sessionId,
            experience,
            attributes,
            note: note.trim() || null,
            language,
            length: (settings?.default_length ?? "medium") as Length,
            regenerate,
          },
        });
      } catch {
        const vocabById = new Map(selectedServices.map((s) => [s.id, s.name]));
        result = await generateDraftClient({
          sessionId,
          businessId: business.id,
          businessName: business.name,
          city: business.city,
          services: selectedServices.map((s) => ({ name: vocabById.get(s.id) ?? s.name })),
          experience,
          attributes,
          note: note.trim() || null,
          language,
          length: (settings?.default_length ?? "medium") as Length,
          regenerate,
        });
      }
      setGenerationId(result.generationId);
      setDraft(result.text);
      setOriginalDraft(result.text);
      setEditedTracked(false);
      setStep(3);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create a draft. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const persistAction = async (
    action: "edited" | "copied" | "google_clicked" | "instagram_clicked" | "completed",
    text?: string,
  ) => {
    if (!generationId || !business || !sessionId) return;
    try {
      await markGeneration({ data: { generationId, action, text } });
    } catch {
      await markGenerationClient({
        generationId,
        businessId: business.id,
        sessionId,
        action,
        ...(text ? { text } : {}),
      });
    }
  };

  const onDraftChange = (value: string) => {
    setDraft(value);
    if (!editedTracked && originalDraft && value.trim() !== originalDraft.trim() && generationId) {
      setEditedTracked(true);
      void persistAction("edited", value);
    }
  };

  const handleCopy = async () => {
    const ok = await copyText(draft);
    if (!ok) {
      toast.error("Clipboard access was denied. You can still select and copy the text.");
      return;
    }
    toast.success("Review copied.");
    await persistAction("copied", draft);
  };

  const handleGoogle = async () => {
    const ok = await copyText(draft);
    if (ok) toast.success("Review copied.");
    await persistAction("copied", draft);
    await persistAction("google_clicked", draft);
    const url = business?.google_review_url?.trim();
    if (!url) {
      toast.error("Google Review link has not been configured for this business yet.");
      return;
    }
    if (!isSafeHttpUrl(url) || !openSafeUrl(url)) {
      toast.error("The Google Review link for this business is invalid.");
    }
  };

  const handleInstagram = async () => {
    const url = business?.instagram_url?.trim();
    if (!url || !isSafeHttpUrl(url)) {
      toast.error("Instagram link is not configured.");
      return;
    }
    await persistAction("instagram_clicked");
    openSafeUrl(url);
  };

  if (loadError) {
    return <StatusScreen title="Something went wrong" body={loadError} />;
  }
  if (!payload) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading review page…</p>
      </div>
    );
  }
  if (payload.status === "not_found") {
    return (
      <StatusScreen title="We couldn't find this page" body="This review link does not match an active business." />
    );
  }
  if (payload.status === "unavailable") {
    return (
      <StatusScreen
        title="This review page is currently unavailable."
        body="The business has paused reviews for now. Please try again later."
      />
    );
  }
  if (!business || !settings) {
    return <StatusScreen title="This review page is currently unavailable." body="Please try again later." />;
  }
  if (services.length === 0) {
    return (
      <StatusScreen
        title="Services are being set up"
        body={`${business.name} has not published services on this page yet.`}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-background" style={{ ["--review-accent" as string]: accent }}>
      <header className="border-b border-border bg-card/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt=""
              className="size-12 rounded-xl border border-border object-cover"
            />
          ) : (
            <div
              className="flex size-12 items-center justify-center rounded-xl text-sm font-semibold text-white"
              style={{ background: accent }}
              aria-hidden
            >
              {business.name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold">{business.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {[business.city, business.state].filter(Boolean).join(", ") || "Share your experience"}
            </p>
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground">
          Share your experience in a few quick steps.
        </p>
        <ol className="mx-auto mt-4 flex max-w-md items-center gap-2" aria-label="Progress">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                  step >= n ? "text-white" : "bg-muted text-muted-foreground",
                )}
                style={step >= n ? { background: accent } : undefined}
              >
                {n}
              </span>
              {n < 3 ? <span className="h-px flex-1 bg-border" /> : null}
            </li>
          ))}
        </ol>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 pb-28">
        {step === 1 ? (
          <section>
            <h1 className="text-2xl font-semibold">{settings.customer_headline || "What did you visit us for?"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {settings.customer_subheadline || "Select everything that applies."}
            </p>
            <div className="mt-6 space-y-5">
              {grouped.byCat.map((category) =>
                category.services.length === 0 ? null : (
                  <div key={category.id}>
                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {category.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {category.services.map((service) => (
                        <Chip
                          key={service.id}
                          selected={selected.includes(service.id)}
                          onClick={() => toggle(service.id)}
                          accent={accent}
                        >
                          {service.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ),
              )}
              {grouped.uncategorized.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {grouped.uncategorized.map((service) => (
                    <Chip
                      key={service.id}
                      selected={selected.includes(service.id)}
                      onClick={() => toggle(service.id)}
                      accent={accent}
                    >
                      {service.name}
                    </Chip>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-8">
            <div>
              <h1 className="text-2xl font-semibold">How was your experience?</h1>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {EXPERIENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExperience(option.value)}
                    className={cn(
                      "min-h-12 rounded-xl border px-3 py-3 text-sm font-medium",
                      experience === option.value ? "text-white" : "border-border bg-card",
                    )}
                    style={experience === option.value ? { background: accent, borderColor: accent } : undefined}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">What stood out?</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(settings.selectable_attributes.length > 0
                  ? settings.selectable_attributes
                  : EXPERIENCE_OPTIONS.map((o) => o.label)
                ).map((label) => (
                  <Chip
                    key={label}
                    selected={attributes.includes(label)}
                    onClick={() => toggleAttr(label)}
                    accent={accent}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </div>
            {settings.show_optional_note ? (
              <div>
                <label htmlFor="note" className="text-lg font-semibold">
                  Anything else you'd like to mention?
                </label>
                <p className="mt-1 text-sm text-muted-foreground">A few words make your review more personal.</p>
                <Textarea
                  id="note"
                  className="mt-3 min-h-24"
                  placeholder="The finishing came out really clean."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={400}
                />
              </div>
            ) : null}
            {languages.length > 0 ? (
              <div>
                <p className="text-lg font-semibold">Language</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {languages.map((item) => (
                    <Chip
                      key={item.value}
                      selected={language === item.value}
                      onClick={() => setLanguage(item.value)}
                      accent={accent}
                    >
                      {item.label}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {step === 3 ? (
          <section>
            <h1 className="text-2xl font-semibold">Your Review Draft</h1>
            <p className="mt-2 text-sm text-muted-foreground">Edit anything before posting.</p>
            {busy ? (
              <p className="mt-6 text-sm text-muted-foreground">Creating your review draft…</p>
            ) : (
              <Textarea
                className="mt-4 min-h-48 text-base leading-relaxed"
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                aria-label="Review draft"
              />
            )}
            <div className="mt-4 flex flex-col gap-2">
              {settings.allow_regenerate ? (
                <Button type="button" variant="outline" disabled={busy} onClick={() => void runGenerate(true)}>
                  Generate Another
                </Button>
              ) : null}
              <Button type="button" variant="outline" disabled={busy || !draft} onClick={() => void handleCopy()}>
                Copy Review
              </Button>
            </div>
          </section>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-md flex-col gap-2">
          {step === 1 ? (
            <Button
              className="min-h-12 w-full text-base"
              style={{ background: accent }}
              disabled={busy || selected.length === 0}
              onClick={() => void continueToExperience()}
            >
              Continue
            </Button>
          ) : null}
          {step === 2 ? (
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="min-h-12" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="min-h-12 flex-1 text-base"
                style={{ background: accent }}
                disabled={busy || !experience}
                onClick={() => void runGenerate(false)}
              >
                {busy ? "Creating your review draft…" : "Generate My Review"}
              </Button>
            </div>
          ) : null}
          {step === 3 ? (
            <>
              <Button
                className="min-h-12 w-full text-base"
                style={{ background: accent }}
                disabled={busy || !draft}
                onClick={() => void handleGoogle()}
              >
                {settings.google_cta_text || "Copy & Continue to Google"}
              </Button>
              {business.instagram_url ? (
                <Button type="button" variant="outline" className="min-h-12 w-full" onClick={() => void handleInstagram()}>
                  <Instagram className="size-4" aria-hidden />
                  Visit Instagram
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  accent,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  accent: string;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-11 rounded-full border px-3.5 py-2 text-left text-sm font-medium",
        selected ? "text-white" : "border-border bg-card",
      )}
      style={selected ? { background: accent, borderColor: accent } : undefined}
    >
      {children}
    </button>
  );
}

function StatusScreen({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
