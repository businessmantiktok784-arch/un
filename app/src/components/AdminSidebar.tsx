import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, GraduationCap, BookOpen, Settings, LogOut,
  Shield, BarChart3, Bell, Activity, ShieldAlert, Briefcase, MessageSquareQuote,
  Compass, Mail, LifeBuoy, ScrollText, UserCircle, Building2, Megaphone,
  TrendingUp, Tag, ChevronDown, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { ADMIN_NAV_GROUPS, type Permission } from "@/lib/rbac";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, FileText, GraduationCap, BookOpen, Settings, LogOut,
  Shield, BarChart3, Bell, Activity, ShieldAlert, Briefcase, MessageSquareQuote,
  Compass, Mail, LifeBuoy, ScrollText, UserCircle, Building2, Megaphone,
  TrendingUp, Tag,
};

function getIcon(iconName: string) {
  return iconMap[iconName] ?? LayoutDashboard;
}

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, isSuperAdmin, checkPermission } = useRole();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate("/login");
    setLogoutOpen(false);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Filter nav groups based on permissions
  const filteredGroups = ADMIN_NAV_GROUPS.filter((group) =>
    checkPermission(group.requiredPermission)
  ).map((group) => ({
    ...group,
    links: group.links.filter((link) => checkPermission(link.requiredPermission as Permission)),
  })).filter((group) => group.links.length > 0);

  const flatLinks = filteredGroups.flatMap((g) => g.links);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r bg-card/95 backdrop-blur lg:flex shadow-soft">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex flex-col items-center">
            <span className="font-display text-xl font-bold text-foreground leading-none">
              UniHub
            </span>
            <span className="mt-0.5 h-0.5 w-6 bg-primary rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Badge variant="secondary" className="text-[9px] uppercase tracking-wider">Admin</Badge>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {filteredGroups.map((group) => (
              <div key={group.label} className="mb-2">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between px-3 py-2 text-[11px] uppercase tracking-widest text-muted-foreground/70 font-medium hover:text-muted-foreground transition-colors"
                >
                  {group.label}
                  {expandedGroups[group.label] ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                <div className={cn("space-y-0.5 transition-all", expandedGroups[group.label] === false && "hidden")}>
                  {group.links.map((link) => {
                    const isActive = location.pathname === link.href;
                    const Icon = getIcon(link.icon);
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isActive && "text-primary-foreground")} />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <Separator />
        <div className="p-3 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            Back to Site
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-card/95 backdrop-blur px-4 lg:hidden shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="font-display text-lg font-bold text-foreground leading-none">UniHub</span>
            <span className="mt-0.5 h-0.5 w-6 bg-primary rounded-full" />
          </div>
          {role && (
            <Badge variant="outline" className="text-[9px] uppercase">
              {role.replace("_", " ")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Site
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setLogoutOpen(true)}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur lg:hidden shadow-soft">
        <div className="flex items-center overflow-x-auto py-2 px-1 gap-0.5">
          {flatLinks.slice(0, 8).map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = getIcon(item.icon);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors shrink-0 min-w-[56px] rounded-lg",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>You will be redirected to the login page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="rounded-xl">Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
