import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, Star, StarOff, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminUtils";

type Row = { id: string; title: string; type: string | null; category: string | null; country: string | null; deadline: string | null; description: string | null; link: string | null; featured: boolean; status: "pending"|"approved"|"rejected"; university_id: string | null };

const empty: Omit<Row, "id"> = { title: "", type: "internship", category: "", country: "", deadline: null, description: "", link: "", featured: false, status: "approved", university_id: null };

export default function AdminOpportunitiesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<(Row | (Omit<Row, "id"> & { id?: string })) | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("opportunities").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing || !editing.title.trim()) return toast({ title: "Title required", variant: "destructive" });
    const payload = { title: editing.title, type: editing.type, category: editing.category, country: editing.country, deadline: editing.deadline || null, description: editing.description, link: editing.link, featured: editing.featured, status: editing.status, university_id: editing.university_id };
    if ("id" in editing && editing.id) {
      const { error } = await supabase.from("opportunities").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
      await logAdminAction("opportunity.update", "opportunity", editing.id);
    } else {
      const { error, data } = await supabase.from("opportunities").insert(payload).select().single();
      if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
      await logAdminAction("opportunity.create", "opportunity", data?.id);
    }
    toast({ title: "Saved" });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete opportunity?")) return;
    const { error } = await supabase.from("opportunities").delete().eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    await logAdminAction("opportunity.delete", "opportunity", id);
    load();
  };

  const setStatus = async (r: Row, status: "approved"|"rejected") => {
    const { error } = await supabase.from("opportunities").update({ status }).eq("id", r.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    await logAdminAction(`opportunity.${status}`, "opportunity", r.id);
    load();
  };

  const toggleFeatured = async (r: Row) => {
    await supabase.from("opportunities").update({ featured: !r.featured }).eq("id", r.id);
    await logAdminAction("opportunity.feature", "opportunity", r.id, { featured: !r.featured });
    load();
  };

  const filtered = rows.filter(r =>
    (statusFilter === "all" || r.status === statusFilter) &&
    (r.title.toLowerCase().includes(search.toLowerCase()) ||
     (r.country ?? "").toLowerCase().includes(search.toLowerCase()) ||
     (r.category ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Opportunities</h1>
          <p className="mt-1 text-muted-foreground">Internships, scholarships, jobs and more</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4 mr-2" /> Add</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline">{rows.length}</Badge>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.type || "—"}</TableCell>
                <TableCell>{r.country || "—"}</TableCell>
                <TableCell>{r.deadline ? new Date(r.deadline).toLocaleDateString() : "—"}</TableCell>
                <TableCell><Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "outline"}>{r.status}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => toggleFeatured(r)}>
                    {r.featured ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  {r.status !== "approved" && <Button variant="ghost" size="icon" onClick={() => setStatus(r, "approved")}><CheckCircle2 className="h-4 w-4 text-primary" /></Button>}
                  {r.status !== "rejected" && <Button variant="ghost" size="icon" onClick={() => setStatus(r, "rejected")}><XCircle className="h-4 w-4 text-destructive" /></Button>}
                  <Button variant="ghost" size="icon" onClick={() => setEditing(r)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">None.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing && "id" in editing && editing.id ? "Edit" : "Add"} Opportunity</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div><Label>Title *</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                  <Select value={editing.type ?? "internship"} onValueChange={(v) => setEditing({ ...editing, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="job">Job</SelectItem>
                      <SelectItem value="scholarship">Scholarship</SelectItem>
                      <SelectItem value="fellowship">Fellowship</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Category</Label><Input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Country</Label><Input value={editing.country ?? ""} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></div>
                <div><Label>Deadline</Label><Input type="date" value={editing.deadline ?? ""} onChange={(e) => setEditing({ ...editing, deadline: e.target.value })} /></div>
              </div>
              <div><Label>Link</Label><Input value={editing.link ?? ""} onChange={(e) => setEditing({ ...editing, link: e.target.value })} placeholder="https://" /></div>
              <div><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={4} /></div>
              <div><Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as Row["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
