import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("admin_audit_log")
        .select("id,action,entity_type,entity_id,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setEntries((data ?? []) as AuditEntry[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">System Activity</h1>
          <p className="mt-1 text-muted-foreground">
            Recent admin actions and system events — read-only log
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <ScrollText className="h-3 w-3" /> Audit Log
        </Badge>
      </div>
      <div className="space-y-3">
        {loading && [1,2,3].map(i => (
          <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-5 bg-muted rounded w-3/4" /></CardContent></Card>
        ))}
        {!loading && entries.map((e) => (
          <Card key={e.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{e.action}</p>
                <p className="text-xs text-muted-foreground">
                  {e.entity_type && `${e.entity_type}${e.entity_id ? `: ${e.entity_id}` : ""}`}
                  {e.entity_type && " · "}
                  {new Date(e.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{e.action.split("_").slice(0, 2).join(" ")}</Badge>
            </CardContent>
          </Card>
        ))}
        {!loading && entries.length === 0 && (
          <div className="py-12 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
