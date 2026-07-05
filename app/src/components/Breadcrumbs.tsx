import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  browse: "Browse",
  document: "Document",
  upload: "Upload",
  requests: "Requests",
  opportunities: "Opportunities",
  profile: "Profile",
  settings: "Settings",
  bookmarks: "Bookmarks",
  history: "History",
  onboarding: "Onboarding",
  university: "University",
  admin: "Admin",
  notifications: "Notifications",
  login: "Login",
  signup: "Sign Up",
  terms: "Terms",
  privacy: "Privacy",
  copyright: "Copyright",
  about: "About Us",
  contact: "Contact Us",
  help: "Help Center",
  "forgot-password": "Forgot Password",
  "reset-password": "Reset Password",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="container py-3 flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto" aria-label="Breadcrumb">
      <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors shrink-0">
        <Home className="h-3 w-3" />
        <span>Home</span>
      </Link>
      {segments.map((seg, i) => {
        const path = "/" + segments.slice(0, i + 1).join("/");
        const label = routeLabels[seg] || decodeURIComponent(seg);
        const isLast = i === segments.length - 1;
        return (
          <span key={path} className="flex items-center gap-1.5 shrink-0">
            <ChevronRight className="h-3 w-3" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
