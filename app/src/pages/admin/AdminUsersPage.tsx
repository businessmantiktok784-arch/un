import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, XCircle, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel, exportToPDF, logAdminAction } from "@/lib/adminUtils";

type Row = { id: string; full_name: string | null; email: string | null; university: string | null; suspended: boolean; created_at: string };

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, university, suspended, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast({ title: "Failed to load users", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { load(); const ch = supabase.channel("admin-users").on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => { load(); }).subscribe(); return () => { supabase.removeChannel(ch); }; }, [load]);

  const filtered = rows.filter(u =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.university ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleSuspend = async () => {
    if (!target) return;
    const { error } = await supabase.rpc("admin_suspend_user", { _target: target.id, _suspend: !target.suspended });
    if (error) return toast({ title: "Action failed", description: error.message, variant: "destructive" });
    toast({ title: target.suspended ? "User reactivated" : "User suspended" });
    setTarget(null);
    load();
  };

  const exportRows = filtered.map(r => ({
    name: r.full_name ?? "",
    email: r.email ?? "",
    university: r.university ?? "",
    status: r.suspended ? "suspended" : "active",
    joined: new Date(r.created_at).toLocaleDateString(),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">User Management</h1>
          <p className="mt-1 text-muted-foreground">All registered users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { exportToExcel(exportRows, "users"); logAdminAction("export.users", "users"); }}>
            <Download className="h-4 w-4 mr-2" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => { exportToPDF("Users", ["Name","Email","University","Status","Joined"], exportRows.map(r => [r.name, r.email, r.university, r.status, r.joined]), "users"); logAdminAction("export.users.pdf", "users"); }}>
            <Download className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, email, university…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline">{rows.length} users</Badge>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
            {!loading && filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                <TableCell>{u.email || "—"}</TableCell>
                <TableCell>{u.university || "—"}</TableCell>
                <TableCell>
                  <Badge variant={u.suspended ? "destructive" : "default"}>{u.suspended ? "suspended" : "active"}</Badge>
                </TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setTarget(u)} title={u.suspended ? "Reactivate" : "Suspend"}>
                    {u.suspended ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-destructive" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{target?.suspended ? "Reactivate" : "Suspend"} {target?.full_name || target?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.suspended ? "Restores platform access." : "Prevents the user from uploading or downloading documents."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={toggleSuspend}>{target?.suspended ? "Reactivate" : "Suspend"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
