import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminUtils";

interface ContentReport {
  id: string;
  document_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("content_reports")
      .select("*")
      .order("created_at", { ascending: false });
    setReports((data ?? []) as ContentReport[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDismiss = async (id: string) => {
    const { error } = await supabase
      .from("content_reports")
      .update({ status: "dismissed" })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Report dismissed" });
    logAdminAction("dismiss_report", "content_reports", id);
    load();
  };

  const handleRemove = async (id: string) => {
    const report = reports.find(r => r.id === id);
    if (!report) return;
    // Dismiss the report and remove the document
    const { error: reportError } = await supabase
      .from("content_reports")
      .update({ status: "resolved" })
      .eq("id", id);
    if (reportError) {
      toast({ title: "Error", description: reportError.message, variant: "destructive" });
      setRemoveId(null);
      return;
    }
    const { error: docError } = await supabase
      .from("documents")
      .update({ status: "rejected" })
      .eq("id", report.document_id);
    if (docError) {
      toast({ title: "Error", description: docError.message, variant: "destructive" });
      setRemoveId(null);
      return;
    }
    toast({ title: "Document removed", description: "The reported document has been rejected.", variant: "destructive" });
    setRemoveId(null);
    logAdminAction("remove_reported_document", "documents", report.document_id);
    load();
  };

  const removeReport = reports.find(r => r.id === removeId);
  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Reports & Flags</h1>
          <p className="mt-1 text-muted-foreground">Review flagged content and user reports</p>
        </div>
        <Badge variant="outline">{pendingCount} pending</Badge>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document ID</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : reports.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-mono text-xs">{doc.document_id.slice(0, 8)}…</TableCell>
                <TableCell><Badge variant="outline">{doc.reason}</Badge></TableCell>
                <TableCell>
                  <Badge variant={doc.status === "pending" ? "destructive" : "default"}>{doc.status}</Badge>
                </TableCell>
                <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {doc.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => handleDismiss(doc.id)}>Dismiss</Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => setRemoveId(doc.id)}>Remove</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && reports.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No reports.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!removeId} onOpenChange={(o) => !o && setRemoveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove reported document?</AlertDialogTitle>
            <AlertDialogDescription>
              The document will be rejected. Reason: {removeReport?.reason}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => removeId && handleRemove(removeId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
