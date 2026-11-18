import { createHash, timingSafeEqual } from "node:crypto";

import type { Json } from "@/integrations/supabase/types";

const WELCOME_SUBJECT = "Welcome to ReviewLift!";
const ADMIN_SUBJECT = "New ReviewLift Account Registered";
const ADMIN_EMAIL = "husainpunjabi53@gmail.com";
const SENDER = { email: "noreply@digicrave.in", name: "ReviewLift" };
const DASHBOARD_URL = "https://reviewlift.digicrave.in/dashboard";
const ADMIN_URL = "https://reviewlift.digicrave.in/admin";

type ClaimResult =
  | { state: "sent" }
  | { state: "in_progress" }
  | { state: "claimed"; send_welcome: boolean; send_admin: boolean };

export async function handleRegistrationConfirmed(request: Request): Promise<Response> {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    console.error("[registration-email] invalid JSON body", error);
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const userId = registrationUserId(payload);
  if (!userId) {
    return Response.json({ skipped: "not_a_new_registration" });
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !data.user) {
      console.error("[registration-email] user lookup failed", { userId, message: error?.message });
      return Response.json({ error: "user_lookup_failed" }, { status: 500 });
    }

    const user = data.user;
    if (!user.email) {
      console.error("[registration-email] new account has no email", { userId });
      return Response.json({ skipped: "missing_email" });
    }

    const fullName = typeof user.user_metadata?.["full_name"] === "string" ? user.user_metadata["full_name"] : "";
    const businessName = await lookupBusinessName(user.id);
    const registeredAt = user.created_at;
    const { data: claim, error: claimError } = await supabaseAdmin.rpc("claim_registration_notification", {
      _user_id: user.id,
      _email: user.email,
      _full_name: fullName,
    });
    if (claimError) {
      console.error("[registration-email] claim failed", { userId: user.id, message: claimError.message });
      return Response.json({ error: "claim_failed" }, { status: 500 });
    }

    const claimed = parseClaim(claim);
    if (claimed.state !== "claimed") {
      return Response.json({ ok: true, state: claimed.state });
    }

    const errors: string[] = [];
    const sentAt = () => new Date().toISOString();

    if (claimed.send_welcome) {
      const result = await sendTrackedEmail({
        to: user.email,
        toName: fullName,
        subject: WELCOME_SUBJECT,
        text: welcomeText(fullName, businessName),
        html: welcomeHtml(fullName, businessName),
      });
      if (result.ok) {
        const { error: markError } = await supabaseAdmin
          .from("registration_notifications")
          .update({ welcome_sent_at: sentAt(), welcome_error: null })
          .eq("user_id", user.id);
        if (markError) {
          console.error("[registration-email] welcome sent but was not recorded", {
            userId: user.id,
            message: markError.message,
          });
        } else {
          console.info("[registration-email] welcome sent", { userId: user.id });
        }
      } else {
        errors.push(`welcome: ${result.error}`);
        await supabaseAdmin
          .from("registration_notifications")
          .update({ welcome_error: result.error })
          .eq("user_id", user.id);
        console.error("[registration-email] welcome failed", { userId: user.id, error: result.error });
      }
    }

    if (claimed.send_admin) {
      const result = await sendTrackedEmail({
        to: ADMIN_EMAIL,
        subject: ADMIN_SUBJECT,
        text: adminText({ email: user.email, fullName, businessName, userId: user.id, registeredAt }),
        html: adminHtml({ email: user.email, fullName, businessName, userId: user.id, registeredAt }),
      });
      if (result.ok) {
        const { error: markError } = await supabaseAdmin
          .from("registration_notifications")
          .update({ admin_sent_at: sentAt(), admin_error: null })
          .eq("user_id", user.id);
        if (markError) {
          console.error("[registration-email] admin notice sent but was not recorded", {
            userId: user.id,
            message: markError.message,
          });
        } else {
          console.info("[registration-email] admin notice sent", { userId: user.id });
        }
      } else {
        errors.push(`admin: ${result.error}`);
        await supabaseAdmin
          .from("registration_notifications")
          .update({ admin_error: result.error })
          .eq("user_id", user.id);
        console.error("[registration-email] admin notice failed", { userId: user.id, error: result.error });
      }
    }

    const lastError = errors.length > 0 ? errors.join("; ") : null;
    const { error: updateError } = await supabaseAdmin
      .from("registration_notifications")
      .update({ attempt_started_at: null, last_error: lastError })
      .eq("user_id", user.id);
    if (updateError) {
      console.error("[registration-email] could not release the send lock", {
        userId: user.id,
        message: updateError.message,
      });
    }

    if (lastError) {
      console.error("[registration-email] send failed", { userId: user.id, lastError });
      return Response.json({ error: "send_failed" }, { status: 500 });
    }

    return Response.json({ ok: true, state: "sent" });
  } catch (error) {
    console.error("[registration-email] unhandled failure", { userId, error });
    return Response.json({ error: "notification_failed" }, { status: 500 });
  }
}

function authorize(request: Request): Response | null {
  const secret = process.env["REGISTRATION_NOTIFY_SECRET"];
  if (!secret) {
    console.error("[registration-email] REGISTRATION_NOTIFY_SECRET is not configured");
    return Response.json({ error: "not_configured" }, { status: 500 });
  }
  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
  const token = match?.[1];
  if (!token || !safeEqual(token, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

function registrationUserId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as {
    user_id?: unknown;
    type?: unknown;
    record?: { id?: unknown };
    old_record?: unknown;
  };
  if (body.type === "UPDATE" || body.old_record) return null;
  const candidate = typeof body.user_id === "string" ? body.user_id : body.record?.id;
  if (typeof candidate !== "string" || !/^[0-9a-f-]{36}$/i.test(candidate)) return null;
  return candidate;
}

async function lookupBusinessName(userId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: member } = await supabaseAdmin
    .from("business_members")
    .select("business_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!member?.business_id) return "";
  const { data: business } = await supabaseAdmin
    .from("businesses")
    .select("name")
    .eq("id", member.business_id)
    .maybeSingle();
  return business?.name?.trim() ?? "";
}

function parseClaim(value: Json): ClaimResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("claim returned an unexpected payload");
  }
  const state = value["state"];
  if (state === "sent" || state === "in_progress") return { state };
  if (state === "claimed") {
    return {
      state,
      send_welcome: value["send_welcome"] === true,
      send_admin: value["send_admin"] === true,
    };
  }
  throw new Error("claim returned an unknown state");
}

export async function sendTrackedEmail(input: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env["BREVO_API_KEY"];
  if (!apiKey) {
    console.error("[registration-email] BREVO_API_KEY is not configured");
    return { ok: false, error: "brevo_not_configured" };
  }

  let response: Response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: input.to, name: input.toName?.trim() || undefined }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
        tags: ["reviewlift-registration"],
        headers: {
          "X-Mailin-Track": "false",
          "X-Mailin-Track-Clicks": "false",
          "X-Mailin-Track-Opens": "false",
        },
      }),
    });
  } catch (error) {
    console.error("[registration-email] Brevo request failed", error);
    return { ok: false, error: "brevo_network" };
  }

  if (response.ok) return { ok: true };
  const detail = await response.text();
  console.error("[registration-email] Brevo rejected the message", {
    status: response.status,
    detail: detail.slice(0, 500),
  });
  return { ok: false, error: `brevo_${response.status}` };
}

function welcomeText(fullName: string, businessName: string): string {
  const greeting = fullName.trim() ? `Hi ${fullName.trim()},` : "Hi,";
  const business = businessName ? `\nBusiness: ${businessName}\n` : "\n";
  return `${greeting}\n\nYour ReviewLift account has been created.${business}\nOpen your dashboard:\n${DASHBOARD_URL}\n`;
}

function welcomeHtml(fullName: string, businessName: string): string {
  const greeting = fullName.trim() ? `Hi ${escapeHtml(fullName.trim())},` : "Hi,";
  const business = businessName
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#101010;">Business: ${escapeHtml(businessName)}</p>`
    : "";
  return emailLayout(
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#101010;">${greeting}</p><p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#101010;">Welcome to ReviewLift. Your account has been created.</p>${business}<p style="margin:24px 0;"><a href="${DASHBOARD_URL}" style="display:inline-block;background:#075BFF;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Open your dashboard</a></p><p style="margin:0;font-size:14px;line-height:1.5;color:#737373;">${DASHBOARD_URL}</p>`,
  );
}

function adminText(input: {
  email: string;
  fullName: string;
  businessName: string;
  userId: string;
  registeredAt: string;
}): string {
  return [
    "A new ReviewLift account was created.",
    `Name: ${input.fullName || "—"}`,
    `Email: ${input.email}`,
    `Business: ${input.businessName || "—"}`,
    `Registered: ${input.registeredAt}`,
    `Account ID: ${input.userId}`,
    `Admin: ${ADMIN_URL}`,
  ].join("\n");
}

function adminHtml(input: {
  email: string;
  fullName: string;
  businessName: string;
  userId: string;
  registeredAt: string;
}): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#737373;vertical-align:top;">${label}</td><td style="padding:8px 0 8px 16px;color:#101010;">${escapeHtml(value)}</td></tr>`;
  return emailLayout(
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#101010;">A new ReviewLift account was created.</p><table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px;">${row("Name", input.fullName || "—")}${row("Email", input.email)}${row("Business", input.businessName || "—")}${row("Registered", input.registeredAt)}${row("Account ID", input.userId)}</table><p style="margin:24px 0 0;"><a href="${ADMIN_URL}" style="display:inline-block;background:#071B3A;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Open admin</a></p>`,
  );
}

function emailLayout(body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FAFAF8;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:24px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E8E8E5;border-radius:16px;padding:28px;font-family:Arial,Helvetica,sans-serif;"><tr><td><p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.04em;color:#075BFF;">ReviewLift</p>${body}</td></tr></table></td></tr></table></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeEqual(provided: string, expected: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(provided), digest(expected));
}
