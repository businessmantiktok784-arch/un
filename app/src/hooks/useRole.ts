import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  type AppRole,
  type Permission,
  hasPermission,
  hasAnyPermission,
  ROLE_HIERARCHY,
} from "@/lib/rbac";

interface UserRole {
  role: AppRole;
  user_id: string;
  id: string;
  created_at: string;
}

export function useRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) { setRole(null); setUserId(null); setLoading(false); }
          return;
        }
        if (!cancelled) setUserId(user.id);

        // Sync admin role server-side
        try { await supabase.rpc("sync_admin_role"); } catch { /* ignore */ }

        // Get user roles from user_roles table
        const { data: roles } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!cancelled) {
          if (roles && roles.length > 0) {
            // Get the highest role in the hierarchy
            const highestRole = (roles as UserRole[]).reduce((highest, current) => {
              return ROLE_HIERARCHY[current.role] > ROLE_HIERARCHY[highest.role] ? current : highest;
            });
            setRole(highestRole.role);
          } else {
            setRole("user");
          }
        }
      } catch (err) {
        console.error("Error loading role:", err);
        if (!cancelled) setRole("user");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRole();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setRole(null);
        setUserId(null);
        setLoading(false);
      } else {
        loadRole();
      }
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const checkPermission = useCallback(
    (permission: Permission) => {
      if (!role) return false;
      return hasPermission(role, permission);
    },
    [role]
  );

  const checkAnyPermission = useCallback(
    (permissions: Permission[]) => {
      if (!role) return false;
      return hasAnyPermission(role, permissions);
    },
    [role]
  );

  const isAdmin = role && ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.moderator;
  const isSuperAdmin = role === "super_admin";
  const isOrgAdmin = role === "org_admin";
  const canManage = role && ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.manager;

  return {
    role,
    userId,
    loading,
    isAdmin: !!isAdmin,
    isSuperAdmin,
    isOrgAdmin,
    canManage: !!canManage,
    checkPermission,
    checkAnyPermission,
  };
}
