import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import { SUSPENSION_REASONS } from "@/lib/account-status";
import { PRODUCTION_ORIGIN } from "@/lib/urls";

const schema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["suspend", "reactivate"]),
  reason: z.enum(SUSPENSION_REASONS).optional(),
  note: z.string().trim().max(500).optional(),
});

export const setAccountAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminProfile, error: adminError } = await context.supabase
      .from("profiles")
      .select("system_role")
      .eq("id", context.userId)
      .maybeSingle();
    if (adminError || adminProfile?.system_role !== "super_admin") {
      throw new Error("Only a super admin can manage accounts.");
    }
    if (data.userId === context.userId) {
      throw new Error("You cannot suspend your own account.");
    }

    const reason = formatReason(data.reason, data.note);
    if (data.action === "suspend" && data.reason === "Unauthorized Login") {
      const { data: target } = await context.supabase.from("profiles").select("email").eq("id", data.userId).maybeSingle();
      if (target?.email) {
        const { error: resetError } = await context.supabase.auth.resetPasswordForEmail(target.email, {
          redirectTo: `${PRODUCTION_ORIGIN}/reset-password`,
        });
        if (resetError) {
          console.error("[account-status] password reset was not sent", { accountId: data.userId, message: resetError.message });
        } else {
          console.info("[account-status] password reset requested", { accountId: data.userId });
        }
      }
    }

    const { data: result, error } = await context.supabase.rpc("set_account_suspension", {
      _user_id: data.userId,
      _suspend: data.action === "suspend",
      _reason: reason,
    });
    if (error) throw new Error(error.message);
    const account = parseAccount(result);

    const { sendAccountStatusEmails } = await import("@/lib/account-admin.server");
    const emailError = await sendAccountStatusEmails({
      action: data.action,
      email: account.email,
      fullName: account.fullName,
      businessName: account.businessName,
      reason,
      accountId: account.id,
    });

    return { ok: true as const, emailError };
  });

function formatReason(reason: (typeof SUSPENSION_REASONS)[number] | undefined, note: string | undefined): string {
  if (!reason) return "";
  if (reason === "Other") return note ? `Other: ${note}` : "Other";
  return note ? `${reason}: ${note}` : reason;
}

function parseAccount(value: Json): { id: string; email: string | null; fullName: string; businessName: string } {
  if (!value || typeof value !== "object" || Array.isArray(value) || typeof value["id"] !== "string") {
    throw new Error("The account could not be updated.");
  }
  return {
    id: value["id"],
    email: typeof value["email"] === "string" ? value["email"] : null,
    fullName: typeof value["full_name"] === "string" ? value["full_name"] : "",
    businessName: typeof value["business_name"] === "string" ? value["business_name"] : "",
  };
}
