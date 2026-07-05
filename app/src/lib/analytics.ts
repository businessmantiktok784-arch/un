import { supabase } from "@/integrations/supabase/client";
import { hasConsent } from "@/lib/cookieConsent";

type EventName =
  | "page_view"
  | "login"
  | "signup"
  | "logout"
  | "document_upload"
  | "document_download"
  | "search"
  | "request_created"
  | "request_fulfilled";

const queue: Array<Record<string, unknown>> = [];
let flushing = false;

async function flush() {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.splice(0, queue.length);
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id ?? null;
    const rows = batch.map((b) => ({ ...b, user_id: uid }));
    await (supabase.from("analytics_events") as any).insert(rows);
  } catch {
    // re-queue on failure (best effort, drop if too big)
    if (queue.length < 50) queue.unshift(...batch);
  } finally {
    flushing = false;
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;
function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    flush();
  }, 1500);
}

export function track(event: EventName, metadata: Record<string, unknown> = {}) {
  try {
    if (!hasConsent("analytics")) return;
    queue.push({
      event_name: event,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      metadata,
    });
    scheduleFlush();
  } catch {
    // never throw from analytics
  }
}

export async function logError(err: unknown, extra: Record<string, unknown> = {}) {
  try {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack ?? null : null;
    const { data: sessionData } = await supabase.auth.getSession();
    await (supabase.from("error_logs") as any).insert({
      user_id: sessionData.session?.user?.id ?? null,
      message: message.slice(0, 1000),
      stack: stack?.slice(0, 5000) ?? null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      severity: "error",
      metadata: extra,
    });
  } catch {
    // swallow
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    logError(e.error ?? e.message, { type: "window.error" });
  });
  window.addEventListener("unhandledrejection", (e) => {
    logError(e.reason, { type: "unhandledrejection" });
  });
  window.addEventListener("beforeunload", () => {
    if (queue.length) flush();
  });
}
