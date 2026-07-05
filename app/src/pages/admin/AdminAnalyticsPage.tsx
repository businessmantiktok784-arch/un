import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToExcel } from "@/lib/adminUtils";

type Point = { month: string; count: number };

function bucket(rows: { created_at: string }[]): Point[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort().map(([month, count]) => ({ month, count }));
}

export default function AdminAnalyticsPage() {
  const [users, setUsers] = useState<Point[]>([]);
  const [docs, setDocs] = useState<Point[]>([]);
  const [opps, setOpps] = useState<Point[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [u, d, o] = await Promise.all([
        supabase.from("profiles").select("created_at").order("created_at"),
        supabase.from("documents").select("created_at").order("created_at"),
        supabase.from("opportunities").select("created_at").order("created_at"),
      ]);
      if (cancelled) return;
      setUsers(bucket((u.data ?? []) as { created_at: string }[]));
      setDocs(bucket((d.data ?? []) as { created_at: string }[]));
      setOpps(bucket((o.data ?? []) as { created_at: string }[]));
    };
    load();
    const ch = supabase.channel("admin-analytics")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => { load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => { load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "opportunities" }, () => { load(); })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  const cfg = { count: { label: "Count", color: "hsl(var(--primary))" } };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Live trends across the platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToExcel([
          ...users.map(p => ({ metric: "users", ...p })),
          ...docs.map(p => ({ metric: "documents", ...p })),
          ...opps.map(p => ({ metric: "opportunities", ...p })),
        ], "analytics")}><Download className="h-4 w-4 mr-2" /> Excel</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">User Growth</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={cfg} className="h-[260px]">
              <LineChart data={users}>
                <XAxis dataKey="month" /><YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Document Uploads</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={cfg} className="h-[260px]">
              <BarChart data={docs}>
                <XAxis dataKey="month" /><YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Opportunities Added</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={cfg} className="h-[260px]">
              <BarChart data={opps}>
                <XAxis dataKey="month" /><YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
