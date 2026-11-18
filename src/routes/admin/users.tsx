import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { setAccountAccess } from "@/lib/account-admin.functions";
import { SUSPENSION_REASONS, type SuspensionReason } from "@/lib/account-status";

type AccountRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  business_name: string | null;
  registered_at: string;
  last_sign_in_at: string | null;
  account_status: string;
  suspension_reason: string | null;
};

export const Route = createFileRoute("/admin/users")({
  component: ManageAccounts,
});

function ManageAccounts() {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [target, setTarget] = useState<AccountRow | null>(null);
  const [action, setAction] = useState<"suspend" | "reactivate">("suspend");
  const [reason, setReason] = useState<SuspensionReason | "">("");
  const [note, setNote] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_accounts");
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows(data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== "all" && row.account_status !== status) return false;
      if (!needle) return true;
      return [row.full_name, row.email, row.business_name].some((value) => value?.toLowerCase().includes(needle));
    });
  }, [rows, query, status]);

  const close = () => {
    if (pendingId) return;
    setTarget(null);
    setReason("");
    setNote("");
  };

  const confirm = async () => {
    if (!target) return;
    setPendingId(target.id);
    try {
      const result = await setAccountAccess({
        data: {
          userId: target.id,
          action,
          ...(reason ? { reason } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      });
      toast.success(action === "suspend" ? "Account suspended" : "Account reactivated");
      if (result.emailError) toast.error("The account was updated, but an email could not be sent.");
      setTarget(null);
      setReason("");
      setNote("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The account could not be updated.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold">Manage Accounts</h1>
      <p className="mt-1 text-sm text-muted-foreground">Suspend or restore customer access. Business data, QR codes, and review history stay in place.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or business" aria-label="Search accounts" />
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={status}
          aria-label="Filter by status"
          onChange={(event) => setStatus(event.target.value as "all" | "active" | "suspended")}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Business</th>
              <th className="py-2 pr-3">Registered</th>
              <th className="py-2 pr-3">Last login</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const suspended = row.account_status === "suspended";
              return (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="py-2 pr-3">{row.full_name || "—"}</td>
                  <td className="py-2 pr-3">{row.email || "—"}</td>
                  <td className="py-2 pr-3">{row.business_name || "—"}</td>
                  <td className="py-2 pr-3">{formatWhen(row.registered_at)}</td>
                  <td className="py-2 pr-3">{row.last_sign_in_at ? formatWhen(row.last_sign_in_at) : "Never"}</td>
                  <td className="py-2 pr-3">{suspended ? "Suspended" : "Active"}</td>
                  <td className="py-2">
                    <Button
                      size="sm"
                      variant={suspended ? "outline" : "destructive"}
                      disabled={pendingId === row.id}
                      onClick={() => {
                        setTarget(row);
                        setAction(suspended ? "reactivate" : "suspend");
                        setReason("");
                        setNote("");
                      }}
                    >
                      {suspended ? "Reactivate" : "Suspend"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && visible.length === 0 ? <p className="py-6 text-sm text-muted-foreground">No accounts match.</p> : null}
      </div>

      <AlertDialog open={Boolean(target)} onOpenChange={(open) => { if (!open) close(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{action === "suspend" ? "Suspend this account?" : "Reactivate this account?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {action === "suspend"
                ? `${target?.email || "This customer"} will be signed out and blocked from the dashboard. Their business, QR codes, analytics, and reviews are kept.`
                : `${target?.email || "This customer"} can sign in again. Previous settings and data stay as they were. They will need to log in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {action === "suspend" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="suspension-reason">Reason (optional)</Label>
                <select
                  id="suspension-reason"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={reason}
                  onChange={(event) => setReason(event.target.value as SuspensionReason | "")}
                >
                  <option value="">No reason</option>
                  {SUSPENSION_REASONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              {reason === "Other" || reason === "Unauthorized Login" ? (
                <div className="space-y-2">
                  <Label htmlFor="suspension-note">{reason === "Other" ? "Details" : "Note"}</Label>
                  <Input id="suspension-note" value={note} onChange={(event) => setNote(event.target.value)} />
                </div>
              ) : null}
              {reason === "Unauthorized Login" ? (
                <p className="text-xs text-muted-foreground">A password reset email will also be sent, and current sessions will be revoked.</p>
              ) : null}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(pendingId)}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={Boolean(pendingId)} onClick={(event) => { event.preventDefault(); void confirm(); }}>
              {pendingId ? "Saving…" : action === "suspend" ? "Suspend account" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function formatWhen(value: string): string {
  return new Date(value).toLocaleString();
}
