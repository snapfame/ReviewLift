import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import { fetchMemberships, type Business, type Membership } from "@/lib/business";

interface BusinessContextValue {
  memberships: Membership[];
  business: Business | null;
  role: Membership["role"] | null;
  loading: boolean;
  setBusinessId: (id: string) => void;
  reload: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);
const STORAGE_KEY = "reviewlift:current-business";

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [businessId, setBusinessIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!user) {
      setMemberships([]);
      setBusinessIdState(null);
      return;
    }
    const rows = await fetchMemberships(user.id);
    setMemberships(rows);
    const stored = localStorage.getItem(STORAGE_KEY);
    const match = rows.find((row) => row.business.id === stored) ?? rows[0];
    setBusinessIdState(match?.business.id ?? null);
  };

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    reload()
      .catch(() => {
        if (!cancelled) setMemberships([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // reload closes over the current user. Re-run only when that user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  const setBusinessId = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setBusinessIdState(id);
  };

  const current = memberships.find((row) => row.business.id === businessId) ?? memberships[0] ?? null;

  const value = useMemo<BusinessContextValue>(
    () => ({
      memberships,
      business: current?.business ?? null,
      role: current?.role ?? null,
      loading,
      setBusinessId,
      reload,
    }),
    [memberships, current, loading],
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used inside BusinessProvider");
  return ctx;
}
