import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, GraduationCap, Briefcase, Inbox, Mail, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

type Stat = { icon: typeof Users; label: string; value: string; href: string };

export default function AdminOverview() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [recent, setRecent] = useState<{ action: string; entity_type: string | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const counts = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("universities").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("opportunities").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
      ]);
      setStats([
        { icon: Users, label: "Users", value: String(counts[0].count ?? 0), href: "/admin/users" },
        { icon: GraduationCap, label: "Universities", value: String(counts[1].count ?? 0), href: "/admin/universities" },
        { icon: FileText, label: "Documents", value: String(counts[2].count ?? 0), href: "/admin/documents" },
        { icon: Briefcase, label: "Opportunities", value: String(counts[3].count ?? 0), href: "/admin/opportunities" },
        { icon: Inbox, label: "Pending Docs", value: String(counts[4].count ?? 0), href: "/admin/documents" },
        { icon: Mail, label: "New Messages", value: String(counts[5].count ?? 0), href: "/admin/contact" },
      ]);
      const { data: log } = await supabase
        .from("admin_audit_log")
        .select("action, entity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      setRecent(log ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Live overview of platform activity</p>
        </div>
        <Badge className="bg-primary/10 text-primary">Admin</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {(loading ? Array.from({ length: 6 }).map((_, i) => ({ icon: Users, label: "…", value: "—", href: "#", _k: i } as Stat & { _k: number })) : stats).map((stat, i) => (
          <motion.div key={stat.label + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link to={stat.href}>
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Admin Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No actions logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between text-sm border-b last:border-0 py-2">
                  <span className="font-mono">{r.action}</span>
                  <span className="text-muted-foreground text-xs">
                    {r.entity_type ?? "—"} · {new Date(r.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
