import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Search, Upload, Download, MessageSquare, Users, TrendingUp, Award, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Contributor {
  id: string;
  full_name: string | null;
  email: string | null;
  university: string | null;
  created_at: string;
  uploads: number;
  downloads: number;
  requests: number;
  answers: number;
}

interface UploadByUni {
  university: string;
  uploads: number;
  color: string;
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142, 60%, 45%)",
  "hsl(42, 90%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(280, 50%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(320, 60%, 50%)",
];

const chartConfig = {
  uploads: { label: "Uploads", color: "hsl(var(--primary))" },
  answers: { label: "Answers", color: "hsl(var(--accent))" },
};

export default function AdminContributorsPage() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [uploadsByUni, setUploadsByUni] = useState<UploadByUni[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"uploads" | "downloads" | "requests" | "answers">("uploads");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);

      // 1) Collect IDs of all users who have contributed in any way
      const [docRes, reqRes, ansRes] = await Promise.all([
        supabase.from("documents").select("uploader_id"),
        supabase.from("document_requests").select("requester_id"),
        supabase.from("request_answers").select("responder_id"),
      ]);

      const ids = new Set<string>();
      (docRes.data ?? []).forEach((r: any) => r.uploader_id && ids.add(r.uploader_id));
      (reqRes.data ?? []).forEach((r: any) => r.requester_id && ids.add(r.requester_id));
      (ansRes.data ?? []).forEach((r: any) => r.responder_id && ids.add(r.responder_id));

      if (cancelled || ids.size === 0) {
        setContributors([]);
        setUploadsByUni([]);
        setLoading(false);
        return;
      }

      // 2) Fetch profiles for those IDs
      const idArr = Array.from(ids);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, university, created_at")
        .in("id", idArr);

      if (cancelled) return;

      // 3) Aggregate upload counts per uploader
      const uploadCounts: Record<string, number> = {};
      (docRes.data ?? []).forEach((d: any) => {
        if (d.uploader_id) {
          uploadCounts[d.uploader_id] = (uploadCounts[d.uploader_id] ?? 0) + 1;
        }
      });

      // 4) Aggregate download totals per uploader (from approved docs)
      const downloadTotals: Record<string, number> = {};
      const { data: dlData } = await supabase
        .from("documents")
        .select("uploader_id, downloads_count")
        .eq("status", "approved");
      (dlData ?? []).forEach((d: any) => {
        if (d.uploader_id) {
          downloadTotals[d.uploader_id] = (downloadTotals[d.uploader_id] ?? 0) + (d.downloads_count ?? 0);
        }
      });

      // 5) Aggregate request counts per requester
      const requestCounts: Record<string, number> = {};
      (reqRes.data ?? []).forEach((r: any) => {
        if (r.requester_id) requestCounts[r.requester_id] = (requestCounts[r.requester_id] ?? 0) + 1;
      });

      // 6) Aggregate answer counts per responder
      const answerCounts: Record<string, number> = {};
      (ansRes.data ?? []).forEach((a: any) => {
        if (a.responder_id) answerCounts[a.responder_id] = (answerCounts[a.responder_id] ?? 0) + 1;
      });

      // 7) Build university upload breakdown
      const { data: uniAgg } = await supabase
        .from("documents")
        .select("university")
        .eq("status", "approved");
      const uniCounts: Record<string, number> = {};
      (uniAgg ?? []).forEach((d: any) => {
        if (d.university) uniCounts[d.university] = (uniCounts[d.university] ?? 0) + 1;
      });
      const uniList = Object.entries(uniCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([university, uploads], i) => ({
          university,
          uploads,
          color: PIE_COLORS[i % PIE_COLORS.length],
        }));

      if (cancelled) return;
      setUploadsByUni(uniList);

      // 8) Merge everything per profile
      const merged: Contributor[] = (profiles ?? [])
        .filter((p: any) => p.id && (uploadCounts[p.id] || requestCounts[p.id] || answerCounts[p.id]))
        .map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          university: p.university,
          created_at: p.created_at,
          uploads: uploadCounts[p.id] ?? 0,
          downloads: downloadTotals[p.id] ?? 0,
          requests: requestCounts[p.id] ?? 0,
          answers: answerCounts[p.id] ?? 0,
        }))
        .sort((a, b) => b.uploads - a.uploads);

      setContributors(merged);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const totalContributors = contributors.length;
  const totalUploads = contributors.reduce((s, c) => s + c.uploads, 0);
  const totalRequests = contributors.reduce((s, c) => s + c.requests, 0);
  const totalAnswers = contributors.reduce((s, c) => s + c.answers, 0);

  const filtered = contributors
    .filter(
      (c) =>
        !search ||
        (c.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.email ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const topUploaders = filtered.slice(0, 5).map((c) => ({
    name: (c.full_name ?? "Unknown").split(" ")[0],
    uploads: c.uploads,
  }));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
          <Award className="h-7 w-7 text-primary" /> Contributors
        </h1>
        <p className="mt-1 text-muted-foreground">
          Upload, download, request and answer statistics aggregated from real database data
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Active Contributors", value: totalContributors, color: "text-primary" },
          { icon: Upload, label: "Total Uploads", value: totalUploads, color: "text-primary" },
          { icon: MessageSquare, label: "Total Requests", value: totalRequests, color: "text-primary" },
          { icon: TrendingUp, label: "Answers Given", value: totalAnswers, color: "text-primary" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Top Uploaders</CardTitle></CardHeader>
          <CardContent>
            {topUploaders.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data yet.</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[220px]">
                <BarChart data={topUploaders}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="uploads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Uploads by University</CardTitle></CardHeader>
          <CardContent>
            {uploadsByUni.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data yet.</div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[220px]">
                <PieChart>
                  <Pie
                    data={uploadsByUni}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="uploads"
                    label={({ university, percent }) => `${university} ${(percent * 100).toFixed(0)}%`}
                  >
                    {uploadsByUni.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="uploads">Sort by Uploads</SelectItem>
            <SelectItem value="downloads">Sort by Downloads</SelectItem>
            <SelectItem value="requests">Sort by Requests</SelectItem>
            <SelectItem value="answers">Sort by Answers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>University</TableHead>
                <TableHead className="text-center">Uploads</TableHead>
                <TableHead className="text-center">Downloads</TableHead>
                <TableHead className="text-center">Requests</TableHead>
                <TableHead className="text-center">Answers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{c.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{c.email || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.university || "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-foreground">{c.uploads}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{c.downloads}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{c.requests}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{c.answers}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filtered.length === 0 && (
        <div className="py-10 text-center text-muted-foreground text-sm">No contributors found.</div>
      )}
    </div>
  );
}
