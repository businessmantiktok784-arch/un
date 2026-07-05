import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Mail, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminUtils";

type Row = { id: string; name: string; email: string; subject: string | null; body: string; status: "new"|"replied"|"resolved"; reply_body: string | null; created_at: string };

export default function AdminContactPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState<Row | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); const ch = supabase.channel("admin-contact").on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => { load(); }).subscribe(); return () => { supabase.removeChannel(ch); }; }, [load]);

  const sendReply = async () => {
    if (!open) return;
    if (!reply.trim()) return toast({ title: "Reply cannot be empty", variant: "destructive" });
    const { error } = await supabase.from("contact_messages").update({ status: "replied", reply_body: reply, replied_at: new Date().toISOString() }).eq("id", open.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    await logAdminAction("contact.reply", "contact_message", open.id);
    toast({ title: "Reply saved", description: "Email delivery requires email infrastructure setup." });
    setOpen(null);
    setReply("");
    load();
  };

  const resolve = async (r: Row) => {
    await supabase.from("contact_messages").update({ status: "resolved" }).eq("id", r.id);
    await logAdminAction("contact.resolve", "contact_message", r.id);
    load();
  };

  const remove = async (r: Row) => {
    if (!confirm("Delete message?")) return;
    await supabase.from("contact_messages").delete().eq("id", r.id);
    await logAdminAction("contact.delete", "contact_message", r.id);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Contact Messages</h1>
        <p className="mt-1 text-muted-foreground">Inquiries from the public contact form</p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => { setOpen(r); setReply(r.reply_body ?? ""); }}>
                <TableCell><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.email}</div></TableCell>
                <TableCell>{r.subject || "(no subject)"}</TableCell>
                <TableCell><Badge variant={r.status === "new" ? "destructive" : r.status === "replied" ? "default" : "outline"}>{r.status}</Badge></TableCell>
                <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {r.status !== "resolved" && <Button variant="ghost" size="icon" onClick={() => resolve(r)} title="Mark resolved"><CheckCircle2 className="h-4 w-4 text-primary" /></Button>}
                  <Button variant="ghost" size="icon" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No messages yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!open} onOpenChange={(o) => { if (!o) { setOpen(null); setReply(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> {open?.subject || "Message"}</DialogTitle></DialogHeader>
          {open && (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">{open.name} &lt;{open.email}&gt;</div>
                <div className="text-xs text-muted-foreground">{new Date(open.created_at).toLocaleString()}</div>
              </div>
              <div className="rounded border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{open.body}</div>
              <div>
                <Label>Reply</Label>
                <Textarea value={reply} rows={5} onChange={(e) => setReply(e.target.value)} placeholder="Write your reply…" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={sendReply}>Save reply</Button>
                <Button variant="outline" onClick={() => { setOpen(null); setReply(""); }}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
