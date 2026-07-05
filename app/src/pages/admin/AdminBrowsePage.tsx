import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminUtils";

type Row = { id: string; name: string; slug: string; icon: string | null; sort_order: number };
const empty: Omit<Row, "id"> = { name: "", slug: "", icon: "", sort_order: 0 };

export default function AdminBrowsePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<(Row | (Omit<Row, "id"> & { id?: string })) | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("browse_categories").select("*").order("sort_order").order("name");
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); const ch = supabase.channel("admin-browse").on("postgres_changes", { event: "*", schema: "public", table: "browse_categories" }, () => { load(); }).subscribe(); return () => { supabase.removeChannel(ch); }; }, [load]);

  const save = async () => {
    if (!editing || !editing.name.trim() || !editing.slug.trim()) return toast({ title: "Name and slug required", variant: "destructive" });
    const payload = { name: editing.name, slug: editing.slug, icon: editing.icon, sort_order: editing.sort_order };
    if ("id" in editing && editing.id) {
      const { error } = await supabase.from("browse_categories").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
      await logAdminAction("browse.update", "category", editing.id);
    } else {
      const { error, data } = await supabase.from("browse_categories").insert(payload).select().single();
      if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
      await logAdminAction("browse.create", "category", data?.id);
    }
    setEditing(null);
    toast({ title: "Saved" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("browse_categories").delete().eq("id", id);
    await logAdminAction("browse.delete", "category", id);
    load();
  };

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Browse Categories</h1>
          <p className="mt-1 text-muted-foreground">Categories shown on the Browse page</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4 mr-2" /> Add</Button>
      </div>

      <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-xs">{r.slug}</TableCell>
                <TableCell>{r.icon || "—"}</TableCell>
                <TableCell>{r.sort_order}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(r)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No categories.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing && "id" in editing && editing.id ? "Edit" : "Add"} Category</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Slug *</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value.replace(/\s+/g, "-").toLowerCase() })} /></div>
              <div><Label>Icon (lucide name)</Label><Input value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="book" /></div>
              <div><Label>Sort order</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
              <Button className="w-full" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
