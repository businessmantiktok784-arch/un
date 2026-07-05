import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TableName = "documents" | "universities" | "opportunities" | "testimonials" | "contact_messages" | "admin_audit_log" | "analytics_events" | "error_logs" | "content_reports" | "courses" | "browse_categories" | "support_content" | "document_comments" | "document_requests" | "request_answers" | "profiles" | "user_roles" | "notifications" | "site_settings" | "donation_settings";

interface UseRealtimeOptions {
  table: TableName;
  select?: string;
  filter?: (q: any) => any;
  order?: { column: string; ascending?: boolean }[];
  limit?: number;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  channelName?: string;
  singleRow?: boolean;
  where?: Record<string, any>;
}

export function useRealtimeData<T = any>(opts: UseRealtimeOptions) {
  const { table, select = "*", filter, order, limit, event = "*", channelName, singleRow = false, where } = opts;
  const [data, setData] = useState<T | T[] | null>(singleRow ? null : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef<(() => void) | null>(null);

  const load = useCallback(async () => {
    try {
      let q = supabase.from(table).select(select);
      if (where) {
        for (const [key, val] of Object.entries(where)) {
          q = q.eq(key, val);
        }
      }
      if (filter) q = filter(q);
      if (order) {
        for (const o of order) {
          q = q.order(o.column, { ascending: o.ascending ?? false });
        }
      }
      if (limit) q = q.limit(limit);
      const result = singleRow ? await q.maybeSingle() : await q;
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setData(result.data as any);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [table, select, filter ? "filter" : "no-filter", JSON.stringify(order), limit, singleRow, JSON.stringify(where)]);

  useEffect(() => {
    loadRef.current = load;
    load();
    const chName = channelName ?? `${table}-live-${Math.random().toString(36).slice(2, 8)}`;
    const ch = supabase
      .channel(chName)
      .on("postgres_changes", { event, schema: "public", table }, () => { loadRef.current?.(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const mutate = async (fn: () => Promise<any>) => {
    await fn();
    loadRef.current?.();
  };

  return { data, loading, error, refetch: load, mutate };
}
