import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export async function logAdminAction(
  action: string,
  entityType?: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await supabase.rpc("log_admin_action", {
      _action: action,
      _entity_type: entityType ?? null,
      _entity_id: entityId ?? null,
      _metadata: metadata as never,
    });
  } catch (e) {
    // Audit failures should not block the action; surface to console.
    console.warn("[audit] failed", action, e);
  }
}

export function exportToExcel<T extends Record<string, unknown>>(rows: T[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToTxt(rows: { time: string; action: string; entity: string; id: string }[], filename: string) {
  const header = "Time\tAction\tEntity\tID";
  const body = rows.map(r => `${r.time}\t${r.action}\t${r.entity}\t${r.id}`).join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPDF(title: string, columns: string[], rows: (string | number)[][], filename: string) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 14);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString(), 14, 20);
  autoTable(doc, { head: [columns], body: rows, startY: 26, styles: { fontSize: 8 } });
  doc.save(`${filename}.pdf`);
}
