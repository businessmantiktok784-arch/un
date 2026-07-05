import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { type Permission, hasPermission } from "@/lib/rbac";

// Route-to-permission mapping for RBAC
const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/admin": "view_dashboard",
  "/admin/analytics": "view_analytics",
  "/admin/users": "view_users",
  "/admin/staff": "manage_roles",
  "/admin/organizations": "manage_organizations",
  "/admin/profile": "view_dashboard",
  "/admin/documents": "view_documents",
  "/admin/universities": "view_universities",
  "/admin/opportunities": "view_opportunities",
  "/admin/testimonials": "view_testimonials",
  "/admin/browse": "manage_browse",
  "/admin/courses": "manage_courses",
  "/admin/contact": "view_contact",
  "/admin/support": "view_support",
  "/admin/reports": "view_reports",
  "/admin/notifications": "send_notifications",
  "/admin/ads": "manage_ads",
  "/admin/monitoring": "view_monitoring",
  "/admin/audit": "view_audit_log",
  "/admin/settings": "manage_settings",
};

function getRequiredPermission(pathname: string): Permission | null {
  // Exact match first
  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];
  // Try matching parent routes
  for (const [route, perm] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route + "/")) return perm;
  }
  return null;
}

export default function AdminLayout() {
  const [state, setState] = useState<"loading" | "ok" | "deny" | "no_permission">("loading");
  const location = useLocation();
  const { role, loading: roleLoading } = useRole();

  useEffect(() => {
    if (roleLoading) return;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setState("deny");
        return;
      }

      if (!role) {
        setState("deny");
        return;
      }

      // Check if user has minimum moderator access
      const moderatorRoles = ["moderator", "staff", "manager", "org_admin", "super_admin"];
      if (!moderatorRoles.includes(role)) {
        setState("deny");
        return;
      }

      // Check route-specific permissions
      const requiredPerm = getRequiredPermission(location.pathname);
      if (requiredPerm && !hasPermission(role, requiredPerm)) {
        setState("no_permission");
        return;
      }

      setState("ok");
    })();
  }, [role, roleLoading, location.pathname]);

  if (state === "loading" || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (state === "deny") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (state === "no_permission") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mx-auto">
            <Loader2 className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don&apos;t have permission to access this page. Contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:underline text-sm"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="pb-20 lg:ml-72 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
