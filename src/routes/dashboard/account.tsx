import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/account")({
  component: AccountPage,
});

function AccountPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const changePassword = async () => {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setPassword("");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    await navigate({ to: "/login" });
  };

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title="Account / Security" />
      <div className="panel space-y-2 p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Name: </span>
          {profile?.full_name || user?.user_metadata["full_name"] || "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Email: </span>
          {user?.email}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pw">Change password</Label>
        <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button disabled={busy} onClick={() => void changePassword()}>
          Update password
        </Button>
      </div>
      <Button variant="outline" onClick={() => void logout()}>
        Log out
      </Button>
    </div>
  );
}
