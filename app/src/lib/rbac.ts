// Role-Based Access Control (RBAC) System
// Hierarchical permission system for UniHub

export type AppRole =
  | "super_admin"      // Full platform access - can manage everything including other admins
  | "org_admin"        // Organization-level admin - manages their organization
  | "manager"          // Department/team manager - manages content and users in their scope
  | "staff"            // Staff member - can create/edit content, moderate
  | "moderator"        // Content moderator - can approve/reject content, handle reports
  | "user";            // Regular user - standard platform access

// Role hierarchy (higher index = more permissions)
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  user: 0,
  moderator: 1,
  staff: 2,
  manager: 3,
  org_admin: 4,
  super_admin: 5,
};

// Role display labels
export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Organization Admin",
  manager: "Manager",
  staff: "Staff",
  moderator: "Moderator",
  user: "User",
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  super_admin: "Full platform control. Can manage all organizations, admins, and system settings.",
  org_admin: "Manages their organization: users, content, and settings within their scope.",
  manager: "Manages teams and content within their department. Can approve/reject and manage staff.",
  staff: "Can create and edit content, manage documents, and assist users.",
  moderator: "Reviews and moderates user-generated content. Handles reports and flags.",
  user: "Standard platform user with browsing, uploading, and downloading capabilities.",
};

// Permission types
export type Permission =
  // Dashboard & Analytics
  | "view_dashboard"
  | "view_analytics"
  | "view_advanced_analytics"
  | "export_reports"
  // User Management
  | "view_users"
  | "manage_users"
  | "suspend_users"
  | "manage_roles"
  // Content Management
  | "view_documents"
  | "manage_documents"
  | "approve_documents"
  | "delete_documents"
  | "view_universities"
  | "manage_universities"
  | "view_opportunities"
  | "manage_opportunities"
  | "view_testimonials"
  | "manage_testimonials"
  | "manage_browse"
  | "manage_courses"
  // Communication
  | "view_contact"
  | "reply_contact"
  | "view_support"
  | "manage_support"
  | "view_reports"
  | "manage_reports"
  | "send_notifications"
  // System
  | "view_monitoring"
  | "view_audit_log"
  | "manage_settings"
  | "manage_organizations"
  | "view_all_organizations"
  | "manage_admins"
  // Monetization (future)
  | "manage_ads";

// Permission matrix - which roles have which permissions
export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  user: [],

  moderator: [
    "view_dashboard",
    "view_documents",
    "approve_documents",
    "delete_documents",
    "view_opportunities",
    "view_testimonials",
    "view_reports",
    "manage_reports",
    "view_contact",
    "reply_contact",
    "send_notifications",
    "view_users",
  ],

  staff: [
    "view_dashboard",
    "view_analytics",
    "view_documents",
    "manage_documents",
    "approve_documents",
    "view_universities",
    "view_opportunities",
    "manage_opportunities",
    "view_testimonials",
    "manage_testimonials",
    "manage_browse",
    "manage_courses",
    "view_contact",
    "reply_contact",
    "view_support",
    "manage_support",
    "send_notifications",
    "view_users",
  ],

  manager: [
    "view_dashboard",
    "view_analytics",
    "export_reports",
    "view_users",
    "manage_users",
    "view_documents",
    "manage_documents",
    "approve_documents",
    "delete_documents",
    "view_universities",
    "view_opportunities",
    "manage_opportunities",
    "view_testimonials",
    "manage_testimonials",
    "manage_browse",
    "manage_courses",
    "view_contact",
    "reply_contact",
    "view_support",
    "manage_support",
    "view_reports",
    "manage_reports",
    "send_notifications",
    "view_monitoring",
  ],

  org_admin: [
    "view_dashboard",
    "view_analytics",
    "view_advanced_analytics",
    "export_reports",
    "view_users",
    "manage_users",
    "suspend_users",
    "view_documents",
    "manage_documents",
    "approve_documents",
    "delete_documents",
    "view_universities",
    "manage_universities",
    "view_opportunities",
    "manage_opportunities",
    "view_testimonials",
    "manage_testimonials",
    "manage_browse",
    "manage_courses",
    "view_contact",
    "reply_contact",
    "view_support",
    "manage_support",
    "view_reports",
    "manage_reports",
    "send_notifications",
    "view_monitoring",
    "view_audit_log",
    "manage_settings",
  ],

  super_admin: [
    // Everything
    "view_dashboard",
    "view_analytics",
    "view_advanced_analytics",
    "export_reports",
    "view_users",
    "manage_users",
    "suspend_users",
    "manage_roles",
    "view_documents",
    "manage_documents",
    "approve_documents",
    "delete_documents",
    "view_universities",
    "manage_universities",
    "view_opportunities",
    "manage_opportunities",
    "view_testimonials",
    "manage_testimonials",
    "manage_browse",
    "manage_courses",
    "view_contact",
    "reply_contact",
    "view_support",
    "manage_support",
    "view_reports",
    "manage_reports",
    "send_notifications",
    "view_monitoring",
    "view_audit_log",
    "manage_settings",
    "manage_organizations",
    "view_all_organizations",
    "manage_admins",
    // Monetization
    "manage_ads",
  ],
};

// Helper: Check if a role has a specific permission
export function hasPermission(role: AppRole, permission: Permission): boolean {
  if (ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.super_admin) {
    return true; // Super admin has all permissions
  }
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Helper: Check if a role has any of the given permissions
export function hasAnyPermission(role: AppRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

// Helper: Check if role A can manage role B (role A must be higher in hierarchy)
export function canManageRole(managerRole: AppRole, targetRole: AppRole): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

// Helper: Get all permissions for a role
export function getPermissionsForRole(role: AppRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// Helper: Get all manageable roles for a given role
export function getManageableRoles(role: AppRole): AppRole[] {
  const allRoles = Object.keys(ROLE_HIERARCHY) as AppRole[];
  return allRoles.filter((r) => ROLE_HIERARCHY[r] < ROLE_HIERARCHY[role] && r !== "user");
}

// Navigation item permissions - controls which sidebar items are visible
export interface NavItemPermission {
  label: string;
  href: string;
  icon: string;
  requiredPermission: Permission;
}

// Admin sidebar grouped navigation with RBAC
export const ADMIN_NAV_GROUPS = [
  {
    label: "Overview",
    requiredPermission: "view_dashboard" as Permission,
    links: [
      { label: "Dashboard", href: "/admin", icon: "LayoutDashboard", requiredPermission: "view_dashboard" },
      { label: "Analytics", href: "/admin/analytics", icon: "BarChart3", requiredPermission: "view_analytics" },
    ],
  },
  {
    label: "People",
    requiredPermission: "view_users" as Permission,
    links: [
      { label: "Users", href: "/admin/users", icon: "Users", requiredPermission: "view_users" },
      { label: "Staff & Roles", href: "/admin/staff", icon: "Shield", requiredPermission: "manage_roles" },
      { label: "Organizations", href: "/admin/organizations", icon: "Building2", requiredPermission: "manage_organizations" },
      { label: "Profile", href: "/admin/profile", icon: "UserCircle", requiredPermission: "view_dashboard" },
    ],
  },
  {
    label: "Content",
    requiredPermission: "view_documents" as Permission,
    links: [
      { label: "Universities", href: "/admin/universities", icon: "GraduationCap", requiredPermission: "view_universities" },
      { label: "Documents", href: "/admin/documents", icon: "FileText", requiredPermission: "view_documents" },
      { label: "Opportunities", href: "/admin/opportunities", icon: "Briefcase", requiredPermission: "view_opportunities" },
      { label: "Testimonials", href: "/admin/testimonials", icon: "MessageSquareQuote", requiredPermission: "view_testimonials" },
      { label: "Browse", href: "/admin/browse", icon: "Compass", requiredPermission: "manage_browse" },
      { label: "Courses", href: "/admin/courses", icon: "BookOpen", requiredPermission: "manage_courses" },
    ],
  },
  {
    label: "Inbox",
    requiredPermission: "view_contact" as Permission,
    links: [
      { label: "Contact", href: "/admin/contact", icon: "Mail", requiredPermission: "view_contact" },
      { label: "Support", href: "/admin/support", icon: "LifeBuoy", requiredPermission: "view_support" },
      { label: "Reports", href: "/admin/reports", icon: "ShieldAlert", requiredPermission: "view_reports" },
      { label: "Notifications", href: "/admin/notifications", icon: "Bell", requiredPermission: "send_notifications" },
    ],
  },
  {
    label: "Monetization",
    requiredPermission: "manage_ads" as Permission,
    links: [
      { label: "Ad Manager", href: "/admin/ads", icon: "Megaphone", requiredPermission: "manage_ads" },
    ],
  },
  {
    label: "System",
    requiredPermission: "view_monitoring" as Permission,
    links: [
      { label: "Monitoring", href: "/admin/monitoring", icon: "Activity", requiredPermission: "view_monitoring" },
      { label: "Audit Log", href: "/admin/audit", icon: "ScrollText", requiredPermission: "view_audit_log" },
      { label: "Settings", href: "/admin/settings", icon: "Settings", requiredPermission: "manage_settings" },
    ],
  },
];
