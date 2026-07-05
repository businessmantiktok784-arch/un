import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Search, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction, exportToExcel } from "@/lib/adminUtils";

type Row = { id: string; title: string; status: string; university: string | null; created_at: string; uploader_id: string | null };

export default function AdminDocumentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("documents").select("id, title, status, university, created_at, uploader_id").order("created_at", { ascending: false }).limit(500);
    if (status !== "all") q = q.eq("status", status as "approved" | "pending" | "rejected");
    const { data, error } = await q;
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [status, toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  const update = async (id: string, patch: Partial<Row>, action: string) => {
    const { error } = await supabase.from("documents").update(patch as never).eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    await logAdminAction(action, "document", id, patch as Record<string, unknown>);
    toast({ title: "Updated" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Permanently remove this document?")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    await logAdminAction("document.delete", "document", id);
    toast({ title: "Removed" });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Document Management</h1>
          <p className="mt-1 text-muted-foreground">Approve, reject, and moderate uploads</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToExcel(filtered.map(r => ({ id: r.id, title: r.title, status: r.status, university: r.university ?? "", date: r.created_at })), "documents")}>
          <Download className="h-4 w-4 mr-2" /> Excel
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search title…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline">{filtered.length}</Badge>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell>{d.university || "—"}</TableCell>
                <TableCell><Badge variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "outline"}>{d.status}</Badge></TableCell>
                <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {d.status !== "approved" && (
                      <Button variant="ghost" size="icon" onClick={() => update(d.id, { status: "approved" }, "document.approve")} title="Approve">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    {d.status !== "rejected" && (
                      <Button variant="ghost" size="icon" onClick={() => update(d.id, { status: "rejected" }, "document.reject")} title="Reject">
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => remove(d.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No documents.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
