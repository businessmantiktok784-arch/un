import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Search, Upload, Download, MessageSquare, Users, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";

const contributors = [
  { id: 1, name: "Marie Claire U.", email: "marie@ur.ac.rw", university: "UR", uploads: 34, downloads: 120, requests: 8, answers: 12, joined: "2024-09-01" },
  { id: 2, name: "Jean Pierre K.", email: "jean@auca.ac.rw", university: "AUCA", uploads: 28, downloads: 95, requests: 5, answers: 9, joined: "2024-10-15" },
  { id: 3, name: "Eric Niyonzima", email: "eric@ur.ac.rw", university: "UR", uploads: 22, downloads: 88, requests: 12, answers: 15, joined: "2024-08-20" },
  { id: 4, name: "Grace Mutoni", email: "grace@uk.ac.rw", university: "UK", uploads: 19, downloads: 76, requests: 3, answers: 7, joined: "2024-11-05" },
  { id: 5, name: "Diane Kamaliza", email: "diane@cmu.ac.rw", university: "CMU", uploads: 17, downloads: 64, requests: 6, answers: 4, joined: "2025-01-10" },
  { id: 6, name: "Patrick Ndayisaba", email: "patrick@ur.ac.rw", university: "UR", uploads: 15, downloads: 52, requests: 4, answers: 6, joined: "2024-12-01" },
  { id: 7, name: "Alice Mukamana", email: "alice@ines.ac.rw", university: "INES", uploads: 12, downloads: 41, requests: 7, answers: 3, joined: "2025-02-01" },
  { id: 8, name: "Samuel Habimana", email: "samuel@mku.ac.rw", university: "MKU", uploads: 10, downloads: 38, requests: 2, answers: 5, joined: "2025-01-20" },
];

const uploadsByUni = [
  { university: "UR", uploads: 71, color: "hsl(var(--primary))" },
  { university: "AUCA", uploads: 28, color: "hsl(var(--accent))" },
  { university: "UK", uploads: 19, color: "hsl(142, 60%, 45%)" },
  { university: "CMU", uploads: 17, color: "hsl(42, 90%, 55%)" },
  { university: "INES", uploads: 12, color: "hsl(200, 70%, 50%)" },
  { university: "MKU", uploads: 10, color: "hsl(280, 50%, 55%)" },
];

const topUploaders = contributors.slice(0, 5).map(c => ({ name: c.name.split(" ")[0], uploads: c.uploads }));

const chartConfig = {
  uploads: { label: "Uploads", color: "hsl(var(--primary))" },
  answers: { label: "Answers", color: "hsl(var(--accent))" },
};

export default function AdminContributorsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"uploads" | "downloads" | "requests" | "answers">("uploads");

  const totalUploads = contributors.reduce((s, c) => s + c.uploads, 0);
  const totalRequests = contributors.reduce((s, c) => s + c.requests, 0);
  const totalAnswers = contributors.reduce((s, c) => s + c.answers, 0);

  const filtered = contributors
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
          <Award className="h-7 w-7 text-primary" /> Contributors
        </h1>
        <p className="mt-1 text-muted-foreground">Upload and request statistics per user (admin only)</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Total Contributors", value: contributors.length, color: "text-primary" },
          { icon: Upload, label: "Total Uploads", value: totalUploads, color: "text-primary" },
          { icon: MessageSquare, label: "Total Requests", value: totalRequests, color: "text-primary" },
          { icon: TrendingUp, label: "Answers Given", value: totalAnswers, color: "text-primary" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
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
            <ChartContainer config={chartConfig} className="h-[220px]">
              <BarChart data={topUploaders}>
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="uploads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Uploads by University</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px]">
              <PieChart>
                <Pie data={uploadsByUni} cx="50%" cy="50%" outerRadius={80} dataKey="uploads" label={({ university, percent }) => `${university} ${(percent * 100).toFixed(0)}%`}>
                  {uploadsByUni.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{c.university}</Badge></TableCell>
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
