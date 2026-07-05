// Hardcoded list of Gmail addresses granted admin access.
// Add your address(es) here — sign in with Google and you'll be routed to /admin.
// Server-side enforcement is also in the public.admin_emails table (kept in sync below).
export const ADMIN_EMAILS: string[] = [
  "imbutoconnect@gmail.com",
];

export const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
