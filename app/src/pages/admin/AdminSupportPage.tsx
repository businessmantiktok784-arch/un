import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminUtils";

type Row = { id: string; key: string; title: string; body: string | null; sort_order: number };
const empty: Omit<Row, "id"> = { key: "faq", title: "", body: "", sort_order: 0 };

export default function AdminSupportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<(Row | (Omit<Row, "id"> & { id?: string })) | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("support_content").select("*").order("key").order("sort_order");
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); const ch = supabase.channel("admin-support").on("postgres_changes", { event: "*", schema: "public", table: "support_content" }, () => { load(); }).subscribe(); return () => { supabase.removeChannel(ch); }; }, [load]);

  const save = async () => {
    if (!editing || !editing.title.trim()) return toast({ title: "Title required", variant: "destructive" });
    const payload = { key: editing.key, title: editing.title, body: editing.body, sort_order: editing.sort_order };
    if ("id" in editing && editing.id) {
      await supabase.from("support_content").update(payload).eq("id", editing.id);
      await logAdminAction("support.update", "support_content", editing.id);
    } else {
      const { data } = await supabase.from("support_content").insert(payload).select().single();
      await logAdminAction("support.create", "support_content", data?.id);
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete entry?")) return;
    await supabase.from("support_content").delete().eq("id", id);
    await logAdminAction("support.delete", "support_content", id);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Support Content</h1>
          <p className="mt-1 text-muted-foreground">FAQs, help center entries and support details</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4 mr-2" /> Add</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Section</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.key}</TableCell>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>{r.sort_order}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(r)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No entries.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing && "id" in editing && editing.id ? "Edit" : "Add"} Support Entry</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Section</Label>
                <Select value={editing.key} onValueChange={(v) => setEditing({ ...editing, key: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faq">FAQ</SelectItem>
                    <SelectItem value="help">Help Center</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Title *</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Body</Label><Textarea value={editing.body ?? ""} rows={6} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></div>
              <div><Label>Sort</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
              <Button className="w-full" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
