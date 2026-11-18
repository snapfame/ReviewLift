import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchMemberships } from "@/lib/business";
import { SUSPENDED_LOGIN_MESSAGE } from "@/lib/account-status";
import { relativeRedirect } from "@/lib/urls";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    if (typeof search["redirect"] === "string") return { redirect: search["redirect"] };
    return {};
  },
  head: () => ({
    meta: [
      { title: "Log in — ReviewLift" },
      { name: "description", content: "Log in to your ReviewLift business dashboard." },
    ],
  }),
  component: LoginPage,
});

function isSuspensionError(message: string): boolean {
  return /banned|suspended/i.test(message);
}

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const message = sessionStorage.getItem("reviewlift:suspended");
    if (!message) return;
    sessionStorage.removeItem("reviewlift:suspended");
    toast.error(message);
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(isSuspensionError(error.message) ? SUSPENDED_LOGIN_MESSAGE : error.message);
      return;
    }
    const user = data.user;
    const requested = relativeRedirect(search.redirect, "");
    if (!user) {
      await navigate({ to: requested || "/dashboard" });
      return;
    }
    const profileResult = await supabase
      .from("profiles")
      .select("system_role,account_status")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileResult.error
      ? (await supabase.from("profiles").select("system_role").eq("id", user.id).maybeSingle()).data
      : profileResult.data;
    if (profile && "account_status" in profile && profile.account_status === "suspended") {
      await supabase.auth.signOut();
      toast.error(SUSPENDED_LOGIN_MESSAGE);
      return;
    }
    if (profile?.system_role === "super_admin") {
      await navigate({ to: "/admin" });
      return;
    }
    try {
      const memberships = await fetchMemberships(user.id);
      const completed = memberships.some((membership) => membership.business.onboarding_completed);
      if (!completed) {
        await navigate({ to: "/onboarding" });
        return;
      }
    } catch {
      // fall through to dashboard
    }
    if (requested && requested !== "/onboarding" && !requested.startsWith("/onboarding?")) {
      await navigate({ to: requested });
      return;
    }
    await navigate({ to: "/dashboard" });
  };

  return (
    <AuthCard title="Welcome back" description="Log in to manage your review page, QR code and analytics.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
