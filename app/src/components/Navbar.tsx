import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/contexts/NotificationContext";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import {
  Menu, Search, Bell, Shield, LogOut, X, History, Settings
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Browse", href: "/browse" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Upload", href: "/upload" },
  { label: "Requests", href: "/requests" },
];

export default function Navbar() {
  const location = useLocation();
  const { notifications, unreadCount } = useNotifications();
  const { isAdmin } = useRole();
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = location.pathname === "/";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || !isHome
          ? "bg-background/95 backdrop-blur-md border-b shadow-soft"
          : "bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex flex-col items-center group">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground leading-none">
            UniHub
          </span>
          <span className="mt-0.5 h-0.5 w-8 bg-primary rounded-full" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <LanguageSwitcher compact />
          <Link to="/browse">
            <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 md:hidden">
              <Search className="h-4 w-4" />
            </Button>
          </Link>

          {user && (
            <Link to="/bookmarks">
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[10px] rounded-full bg-destructive text-destructive-foreground">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {user && (
            <Link to="/history">
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                <History className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {isAdmin && (
            <Link to="/admin" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="gap-1.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Dashboard</span>
              </Button>
            </Link>
          )}

          {user ? (
            <div className="hidden sm:flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                      <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                        {(user.email?.split("@")[0]?.charAt(0) || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => supabase.auth.signOut()} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link to="/login" className="hidden sm:block">
              <Button size="sm" className="rounded-xl gap-1.5 shadow-soft">
                <LogOut className="h-3.5 w-3.5" /> Sign In
              </Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl md:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center">
                      <span className="font-display text-xl font-bold leading-none">UniHub</span>
                      <span className="mt-0.5 h-0.5 w-6 bg-primary rounded-full" />
                    </div>
                  </div>
                </div>
                <nav className="flex-1 p-3 space-y-1">
                  {[...navLinks, { label: "Bookmarks", href: "/bookmarks" }, { label: "History", href: "/history" }, { label: "Settings", href: "/settings" }, { label: "Help", href: "/help" }].map((link) => {
                    const active = location.pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                          active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                    >
                      <Shield className="h-4 w-4" /> Dashboard
                    </Link>
                  )}
                </nav>
                <div className="p-3 border-t space-y-2">
                  {user ? (
                    <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => supabase.auth.signOut()}>
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                  ) : (
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="block">
                      <Button className="w-full rounded-xl">Sign In</Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
