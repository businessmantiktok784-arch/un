import { supabase } from './supabase';

type EventName =
  | 'page_view'
  | 'login'
  | 'document_upload'
  | 'download'
  | 'search'
  | 'request_created'
  | 'request_fulfilled';

const queue: { event_name: EventName; metadata?: Record<string, any> }[] = [];
let flushing = false;

async function flush() {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.splice(0);
  try {
    await supabase.from('analytics_events').insert(
      batch.map((e) => ({
        event_name: e.event_name,
        metadata: e.metadata ?? {},
      }))
    );
  } catch {
    // silently fail
  } finally {
    flushing = false;
    if (queue.length > 0) flush();
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;

export function trackEvent(event_name: EventName, metadata?: Record<string, any>) {
  queue.push({ event_name, metadata });
  if (!timer) {
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, 1500);
  }
}

export async function trackError(error: Error, context?: string) {
  try {
    await supabase.from('error_logs').insert({
      message: error.message,
      metadata: { stack: error.stack, context },
      severity: 'error',
    });
  } catch {
    // silently fail
  }
}
