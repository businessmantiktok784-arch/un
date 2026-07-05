import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportToExcel, exportToTxt } from "@/lib/adminUtils";

type Row = { id: string; actor_id: string | null; action: string; entity_type: string | null; entity_id: string | null; metadata: Record<string, unknown>; created_at: string };

export default function AdminAuditLogPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(500);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Audit Log</h1>
          <p className="mt-1 text-muted-foreground">All admin actions, newest first</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToTxt(rows.map(r => ({ time: new Date(r.created_at).toLocaleString(), action: r.action, entity: r.entity_type ?? "", id: r.entity_id ?? "" })), "audit-log")}>
            <Download className="h-4 w-4 mr-2" /> TXT
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToExcel(rows.map(r => ({ time: r.created_at, action: r.action, entity: r.entity_type ?? "", id: r.entity_id ?? "" })), "audit-log")}>
            <Download className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline" className="font-mono text-xs">{r.action}</Badge></TableCell>
                <TableCell>{r.entity_type || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{r.entity_id || "—"}</TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No actions yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
