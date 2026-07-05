import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, Eye, TrendingUp } from "lucide-react";

interface EventRow {
  id: string;
  event_name: string;
  path: string | null;
  user_id: string | null;
  metadata: any;
  created_at: string;
}
interface ErrorRow {
  id: string;
  message: string;
  stack: string | null;
  path: string | null;
  user_id: string | null;
  severity: string;
  created_at: string;
}

export default function AdminMonitoringPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [errors, setErrors] = useState<ErrorRow[]>([]);
  const [stats, setStats] = useState({ pageViews: 0, totalEvents: 0, totalErrors: 0, uniqueUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ data: ev }, { data: er }] = await Promise.all([
        (supabase.from("analytics_events") as any)
          .select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(200),
        (supabase.from("error_logs") as any)
          .select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      const evs = (ev ?? []) as EventRow[];
      const ers = (er ?? []) as ErrorRow[];
      setEvents(evs);
      setErrors(ers);
      setStats({
        pageViews: evs.filter(e => e.event_name === "page_view").length,
        totalEvents: evs.length,
        totalErrors: ers.length,
        uniqueUsers: new Set(evs.map(e => e.user_id).filter(Boolean)).size,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Monitoring</h1>
        <p className="text-muted-foreground">Live analytics and error tracking</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<Eye className="h-5 w-5" />} label="Page Views (24h)" value={stats.pageViews} />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Events (24h)" value={stats.totalEvents} />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Active Users (24h)" value={stats.uniqueUsers} />
        <StatCard icon={<AlertCircle className="h-5 w-5 text-destructive" />} label="Errors (recent)" value={stats.totalErrors} />
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>
        <TabsContent value="events">
          <Card>
            <CardHeader><CardTitle>Latest events</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-auto">
              {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!loading && events.length === 0 && <p className="text-sm text-muted-foreground">No events yet.</p>}
              {events.map(e => (
                <div key={e.id} className="flex items-center justify-between border-b py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{e.event_name}</Badge>
                    <span className="text-muted-foreground truncate max-w-[300px]">{e.path}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="errors">
          <Card>
            <CardHeader><CardTitle>Recent errors</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-auto">
              {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
              {!loading && errors.length === 0 && <p className="text-sm text-muted-foreground">No errors. 🎉</p>}
              {errors.map(e => (
                <div key={e.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="destructive">{e.severity}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                  <p className="font-mono text-sm">{e.message}</p>
                  {e.path && <p className="text-xs text-muted-foreground">at {e.path}</p>}
                  {e.stack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Stack</summary>
                      <pre className="mt-1 whitespace-pre-wrap break-all bg-muted/50 p-2 rounded">{e.stack}</pre>
                    </details>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
