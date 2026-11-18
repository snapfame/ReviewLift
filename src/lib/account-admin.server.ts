import { PRODUCTION_ORIGIN } from "@/lib/urls";
import { sendTrackedEmail } from "@/lib/registration-email.server";

const ADMIN_EMAIL = "husainpunjabi53@gmail.com";
const SUPPORT_EMAIL = "husainpunjabi53@gmail.com";

export async function sendAccountStatusEmails(input: {
  action: "suspend" | "reactivate";
  email: string | null;
  fullName: string;
  businessName: string;
  reason: string;
  accountId: string;
}): Promise<string | null> {
  const errors: string[] = [];
  const customer = input.action === "suspend" ? suspensionCustomer(input) : reactivationCustomer(input);
  const admin = adminNotice(input);

  if (input.email) {
    const result = await sendTrackedEmail({
      to: input.email,
      toName: input.fullName,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    });
    if (!result.ok) {
      errors.push(`customer: ${result.error}`);
      console.error("[account-status] customer email failed", { accountId: input.accountId, error: result.error });
    } else {
      console.info("[account-status] customer email sent", { accountId: input.accountId, action: input.action });
    }
  } else {
    errors.push("customer: missing_email");
    console.error("[account-status] customer email skipped, no address", { accountId: input.accountId });
  }

  const adminResult = await sendTrackedEmail({
    to: ADMIN_EMAIL,
    subject: admin.subject,
    html: admin.html,
    text: admin.text,
  });
  if (!adminResult.ok) {
    errors.push(`admin: ${adminResult.error}`);
    console.error("[account-status] admin email failed", { accountId: input.accountId, error: adminResult.error });
  } else {
    console.info("[account-status] admin email sent", { accountId: input.accountId, action: input.action });
  }

  return errors.length > 0 ? errors.join("; ") : null;
}

function suspensionCustomer(input: { fullName: string; reason: string }): { subject: string; text: string; html: string } {
  const greeting = input.fullName ? `Hi ${input.fullName},` : "Hi,";
  const reason = input.reason ? `Reason: ${input.reason}` : "No reason was recorded.";
  return {
    subject: "Your ReviewLift account has been suspended",
    text: `${greeting}\n\nYour ReviewLift account has been temporarily suspended. You will not be able to sign in until access is restored.\n\n${reason}\n\nPlease contact support at ${SUPPORT_EMAIL}.\n`,
    html: layout(
      `<p style="margin:0 0 12px;">${escapeHtml(greeting)}</p><p style="margin:0 0 12px;">Your ReviewLift account has been temporarily suspended. You will not be able to sign in until access is restored.</p><p style="margin:0 0 12px;">${escapeHtml(reason)}</p><p style="margin:0;">Please contact support at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>`,
    ),
  };
}

function reactivationCustomer(input: { fullName: string }): { subject: string; text: string; html: string } {
  const greeting = input.fullName ? `Hi ${input.fullName},` : "Hi,";
  const login = `${PRODUCTION_ORIGIN}/login`;
  return {
    subject: "Your ReviewLift account has been restored",
    text: `${greeting}\n\nYour ReviewLift access has been restored. Sign in again to continue:\n${login}\n`,
    html: layout(
      `<p style="margin:0 0 12px;">${escapeHtml(greeting)}</p><p style="margin:0 0 12px;">Your ReviewLift access has been restored. Your previous settings and data are unchanged. Sign in again to continue.</p><p style="margin:0;"><a href="${login}">Log in to ReviewLift</a></p>`,
    ),
  };
}

function adminNotice(input: {
  action: "suspend" | "reactivate";
  email: string | null;
  fullName: string;
  businessName: string;
  reason: string;
  accountId: string;
}): { subject: string; text: string; html: string } {
  const verb = input.action === "suspend" ? "suspended" : "reactivated";
  const lines = [
    `Account ${verb}.`,
    `Name: ${input.fullName || "—"}`,
    `Email: ${input.email || "—"}`,
    `Business: ${input.businessName || "—"}`,
    `Reason: ${input.reason || "—"}`,
    `Account ID: ${input.accountId}`,
  ];
  return {
    subject: `ReviewLift account ${verb}`,
    text: lines.join("\n"),
    html: layout(`<p style="margin:0 0 12px;">Account ${verb}.</p><ul>${lines.slice(1).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`),
  };
}

function layout(body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#FAFAF8;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E8E8E5;border-radius:16px;"><tr><td style="padding:28px;color:#101010;font-size:16px;line-height:1.5;"><p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#075BFF;">ReviewLift</p>${body}</td></tr></table></body></html>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
