import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, Star, StarOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminUtils";

type Row = { id: string; name: string; country: string | null; city: string | null; website: string | null; description: string | null; logo_url: string | null; featured: boolean };

const empty: Omit<Row, "id"> = { name: "", country: "", city: "", website: "", description: "", logo_url: "", featured: false };

export default function AdminUniversitiesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<(Row | (Omit<Row, "id"> & { id?: string })) | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("universities").select("*").order("name");
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); const ch = supabase.channel("admin-universities").on("postgres_changes", { event: "*", schema: "public", table: "universities" }, () => { load(); }).subscribe(); return () => { supabase.removeChannel(ch); }; }, [load]);

  const save = async () => {
    if (!editing || !editing.name.trim()) return toast({ title: "Name required", variant: "destructive" });
    const payload = { name: editing.name, country: editing.country, city: editing.city, website: editing.website, description: editing.description, logo_url: editing.logo_url, featured: editing.featured };
    if ("id" in editing && editing.id) {
      const { error } = await supabase.from("universities").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
      await logAdminAction("university.update", "university", editing.id);
    } else {
      const { error, data } = await supabase.from("universities").insert(payload).select().single();
      if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
      await logAdminAction("university.create", "university", data?.id);
    }
    toast({ title: "Saved" });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this university?")) return;
    const { error } = await supabase.from("universities").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    await logAdminAction("university.delete", "university", id);
    toast({ title: "Deleted" });
    load();
  };

  const toggleFeatured = async (r: Row) => {
    const { error } = await supabase.from("universities").update({ featured: !r.featured }).eq("id", r.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    await logAdminAction("university.feature", "university", r.id, { featured: !r.featured });
    load();
  };

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.country ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (r.city ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Universities</h1>
          <p className="mt-1 text-muted-foreground">Manage universities listed on the platform</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4 mr-2" /> Add</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline">{rows.length}</Badge>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.country || "—"}</TableCell>
                <TableCell>{r.city || "—"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => toggleFeatured(r)}>
                    {r.featured ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(r)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No universities yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing && "id" in editing && editing.id ? "Edit" : "Add"} University</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Country</Label><Input value={editing.country ?? ""} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></div>
                <div><Label>City</Label><Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></div>
              </div>
              <div><Label>Website</Label><Input value={editing.website ?? ""} onChange={(e) => setEditing({ ...editing, website: e.target.value })} placeholder="https://" /></div>
              <div><Label>Logo URL</Label><Input value={editing.logo_url ?? ""} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} placeholder="https://…/logo.png" /></div>
              <div><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} /></div>
              <Button className="w-full" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
