// Anonymous-mode stub. The site no longer has user accounts or credits.
// This file is kept only so older imports keep compiling while we migrate.
// Admin auth still uses Supabase directly (see AdminLoginPage / AdminLayout).
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useBookmarks as useLocalBookmarks } from "@/lib/localStore";

interface CreditContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoggedIn: boolean;   // anonymous mode: always true for site features
  isAdmin: boolean;      // true only when a Supabase admin is signed in
  credits: number;
  refreshCredits: () => Promise<void>;
  earnCredits: (amount: number, reason: string) => Promise<boolean>;
  spendCredits: (amount: number, reason?: string) => Promise<boolean>;
  addCredits: (amount: number, reason?: string) => Promise<boolean>;
  bookmarks: string[];
  toggleBookmark: (docId: string) => Promise<void>;
  signOut: () => Promise<void>;
  setLoggedIn: (val: boolean) => void;
  setAdmin: (val: boolean) => void;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

export const CREDIT_PER_UPLOAD = 0;
export const CREDIT_PER_DOWNLOAD = 0;

export function CreditProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { ids: bookmarks, toggle } = useLocalBookmarks();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (!s?.user) setIsAdmin(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["super_admin","org_admin","manager","staff","moderator"])
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user?.id]);

  const noop = useCallback(async () => true, []);
  const noopVoid = useCallback(async () => {}, []);
  const setLoggedIn = useCallback(() => {}, []);
  const setAdmin = useCallback(() => {}, []);

  const toggleBookmark = useCallback(async (docId: string) => {
    toggle({ id: docId, title: docId });
  }, [toggle]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
  }, []);

  return (
    <CreditContext.Provider
      value={{
        user,
        session,
        loading,
        isLoggedIn: true, // anonymous mode — site features are open to everyone
        isAdmin,
        credits: 0,
        refreshCredits: noopVoid,
        earnCredits: noop,
        spendCredits: noop,
        addCredits: noop,
        bookmarks,
        toggleBookmark,
        signOut,
        setLoggedIn,
        setAdmin,
      }}
    >
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditContext);
  if (!ctx) throw new Error("useCredits must be used within CreditProvider");
  return ctx;
}
