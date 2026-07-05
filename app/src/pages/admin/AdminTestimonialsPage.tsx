import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Star, StarOff, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminUtils";

type Row = { id: string; student_name: string; photo_url: string | null; university: string | null; quote: string; featured: boolean; status: "pending"|"approved"|"rejected" };
const empty: Omit<Row, "id"> = { student_name: "", photo_url: "", university: "", quote: "", featured: false, status: "approved" };

export default function AdminTestimonialsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<(Row | (Omit<Row, "id"> & { id?: string })) | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); const ch = supabase.channel("admin-testimonials").on("postgres_changes", { event: "*", schema: "public", table: "testimonials" }, () => { load(); }).subscribe(); return () => { supabase.removeChannel(ch); }; }, [load]);

  const save = async () => {
    if (!editing || !editing.student_name.trim() || !editing.quote.trim()) return toast({ title: "Name and quote required", variant: "destructive" });
    const payload = { student_name: editing.student_name, photo_url: editing.photo_url, university: editing.university, quote: editing.quote, featured: editing.featured, status: editing.status };
    if ("id" in editing && editing.id) {
      const { error } = await supabase.from("testimonials").update(payload).eq("id", editing.id);
      if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
      await logAdminAction("testimonial.update", "testimonial", editing.id);
    } else {
      const { error, data } = await supabase.from("testimonials").insert(payload).select().single();
      if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
      await logAdminAction("testimonial.create", "testimonial", data?.id);
    }
    toast({ title: "Saved" });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete testimonial?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    await logAdminAction("testimonial.delete", "testimonial", id);
    load();
  };

  const setStatus = async (r: Row, status: "approved"|"rejected") => {
    await supabase.from("testimonials").update({ status }).eq("id", r.id);
    await logAdminAction(`testimonial.${status}`, "testimonial", r.id);
    load();
  };

  const toggleFeatured = async (r: Row) => {
    await supabase.from("testimonials").update({ featured: !r.featured }).eq("id", r.id);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">What Students Say</h1>
          <p className="mt-1 text-muted-foreground">Manage student testimonials</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4 mr-2" /> Add</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.student_name}</TableCell>
                <TableCell>{r.university || "—"}</TableCell>
                <TableCell className="max-w-md truncate">{r.quote}</TableCell>
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
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No testimonials.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing && "id" in editing && editing.id ? "Edit" : "Add"} Testimonial</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Student name *</Label><Input value={editing.student_name} onChange={(e) => setEditing({ ...editing, student_name: e.target.value })} /></div>
              <div><Label>University</Label><Input value={editing.university ?? ""} onChange={(e) => setEditing({ ...editing, university: e.target.value })} /></div>
              <div><Label>Photo URL</Label><Input value={editing.photo_url ?? ""} onChange={(e) => setEditing({ ...editing, photo_url: e.target.value })} /></div>
              <div><Label>Quote *</Label><Textarea value={editing.quote} rows={4} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} /></div>
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
