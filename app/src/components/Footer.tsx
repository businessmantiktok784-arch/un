import { Link } from "react-router-dom";
import { Heart, Github, Twitter, Mail, MapPin, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useSiteSettings } from "@/hooks/useLiveData";

const footerLinks = {
  Platform: [
    { label: "Browse", href: "/browse" },
    { label: "Opportunities", href: "/opportunities" },
    { label: "Upload", href: "/upload" },
    { label: "Requests", href: "/requests" },
  ],
  Support: [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "About", href: "/about" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Copyright", href: "/copyright" },
  ],
};

function AppStoreButtons() {
  const { siteSettings } = useSiteSettings();
  const showPlayStore = siteSettings.play_store_enabled && siteSettings.play_store_url;
  const showAppStore = siteSettings.app_store_enabled && siteSettings.app_store_url;

  if (!showPlayStore && !showAppStore) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {showPlayStore && (
        <a
          href={siteSettings.play_store_url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors"
        >
          <ExternalLink className="h-3 w-3" /> Google Play
        </a>
      )}
      {showAppStore && (
        <a
          href={siteSettings.app_store_url!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors"
        >
          <ExternalLink className="h-3 w-3" /> App Store
        </a>
      )}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex flex-col items-center group">
              <span className="font-display text-2xl font-bold text-foreground leading-none">
                UniHub
              </span>
              <span className="mt-0.5 h-0.5 w-8 bg-primary rounded-full" />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Your academic resource platform. Share and access past exams, notes, and assignments from universities worldwide.
            </p>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground cursor-default" title="Coming soon">
                <Twitter className="h-4 w-4" />
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground cursor-default" title="Coming soon">
                <Github className="h-4 w-4" />
              </span>
              <Link to="/contact" className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
            <AppStoreButtons />
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} UniHub. Built with <Heart className="h-3 w-3 inline text-destructive" /> for students everywhere.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Made for students worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
