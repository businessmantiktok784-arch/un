// Browser-local persistence for bookmarks + recently-viewed history,
// with optional Supabase sync when a user is signed in (so they keep
// these across devices).
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const BOOKMARK_KEY = "unihub_bookmarks_v1";
const HISTORY_KEY = "unihub_history_v1";
const HISTORY_MAX = 200;

export interface HistoryItem {
  id: string;
  title: string;
  course?: string;
  university?: string;
  type?: string;
  viewedAt: number;
}

export interface BookmarkItem {
  id: string;
  title: string;
  course?: string;
  university?: string;
  type?: string;
  savedAt: number;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(`${key}:changed`));
  } catch {
    /* quota/private mode — ignore */
  }
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export const getBookmarks = (): BookmarkItem[] => readJSON<BookmarkItem[]>(BOOKMARK_KEY, []);
export const getHistory = (): HistoryItem[] => readJSON<HistoryItem[]>(HISTORY_KEY, []);
export const isBookmarked = (id: string) => getBookmarks().some((b) => b.id === id);

export const toggleBookmark = (item: Omit<BookmarkItem, "savedAt">) => {
  const current = getBookmarks();
  const exists = current.some((b) => b.id === item.id);
  const next = exists
    ? current.filter((b) => b.id !== item.id)
    : [{ ...item, savedAt: Date.now() }, ...current];
  writeJSON(BOOKMARK_KEY, next);

  // Cloud sync (fire and forget) — only when logged in
  (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    if (exists) {
      await supabase.from("bookmarks").delete().eq("user_id", uid).eq("document_id", item.id);
    } else {
      await supabase.from("bookmarks").upsert({ user_id: uid, document_id: item.id }, { onConflict: "user_id,document_id" });
    }
  })();

  return !exists;
};

export const removeBookmark = (id: string) => {
  writeJSON(BOOKMARK_KEY, getBookmarks().filter((b) => b.id !== id));
  (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from("bookmarks").delete().eq("user_id", uid).eq("document_id", id);
  })();
};

export const clearBookmarks = () => {
  writeJSON(BOOKMARK_KEY, []);
  (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from("bookmarks").delete().eq("user_id", uid);
  })();
};

export const pushHistory = (item: Omit<HistoryItem, "viewedAt">) => {
  const current = getHistory().filter((h) => h.id !== item.id);
  const next = [{ ...item, viewedAt: Date.now() }, ...current].slice(0, HISTORY_MAX);
  writeJSON(HISTORY_KEY, next);
  (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from("view_history").upsert(
      { user_id: uid, document_id: item.id, viewed_at: new Date().toISOString() },
      { onConflict: "user_id,document_id" },
    );
  })();
};

export const removeHistory = (id: string) => {
  writeJSON(HISTORY_KEY, getHistory().filter((h) => h.id !== id));
  (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from("view_history").delete().eq("user_id", uid).eq("document_id", id);
  })();
};

export const clearHistory = () => {
  writeJSON(HISTORY_KEY, []);
  (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from("view_history").delete().eq("user_id", uid);
  })();
};

// Pull cloud rows into local cache after sign-in.
export async function hydrateFromCloud() {
  const uid = await currentUserId();
  if (!uid) return;

  // Bookmarks: load doc info for any saved doc ids
  const [{ data: bRows }, { data: hRows }] = await Promise.all([
    supabase.from("bookmarks").select("document_id, created_at").eq("user_id", uid),
    supabase.from("view_history").select("document_id, viewed_at").eq("user_id", uid).order("viewed_at", { ascending: false }).limit(HISTORY_MAX),
  ]);

  const allIds = Array.from(new Set([
    ...(bRows?.map((r) => r.document_id) ?? []),
    ...(hRows?.map((r) => r.document_id) ?? []),
  ]));
  if (allIds.length === 0) return;

  const { data: docs } = await supabase
    .from("documents")
    .select("id,title,course_code,university,doc_type")
    .in("id", allIds);
  const docMap = new Map(docs?.map((d) => [d.id, d]) ?? []);

  if (bRows) {
    const localById = new Map(getBookmarks().map((b) => [b.id, b]));
    bRows.forEach((row) => {
      if (localById.has(row.document_id)) return;
      const d = docMap.get(row.document_id);
      if (!d) return;
      localById.set(row.document_id, {
        id: d.id,
        title: d.title,
        course: d.course_code,
        university: d.university,
        type: d.doc_type,
        savedAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
      });
    });
    writeJSON(BOOKMARK_KEY, Array.from(localById.values()).sort((a, b) => b.savedAt - a.savedAt));
  }

  if (hRows) {
    const localById = new Map(getHistory().map((h) => [h.id, h]));
    hRows.forEach((row) => {
      const d = docMap.get(row.document_id);
      if (!d) return;
      const viewedAt = row.viewed_at ? Date.parse(row.viewed_at) : Date.now();
      const existing = localById.get(row.document_id);
      if (existing && existing.viewedAt >= viewedAt) return;
      localById.set(row.document_id, {
        id: d.id,
        title: d.title,
        course: d.course_code,
        university: d.university,
        type: d.doc_type,
        viewedAt,
      });
    });
    const merged = Array.from(localById.values()).sort((a, b) => b.viewedAt - a.viewedAt).slice(0, HISTORY_MAX);
    writeJSON(HISTORY_KEY, merged);
  }
}

function useLocalList<T>(key: string, read: () => T[]): T[] {
  const [list, setList] = useState<T[]>(read);
  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener(`${key}:changed`, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(`${key}:changed`, sync);
      window.removeEventListener("storage", sync);
    };
  }, [key, read]);
  return list;
}

export function useBookmarks() {
  const items = useLocalList<BookmarkItem>(BOOKMARK_KEY, getBookmarks);
  const ids = items.map((b) => b.id);
  const toggle = useCallback((item: Omit<BookmarkItem, "savedAt">) => toggleBookmark(item), []);
  const remove = useCallback((id: string) => removeBookmark(id), []);
  const clear = useCallback(() => clearBookmarks(), []);
  return { bookmarks: items, ids, toggle, remove, clear };
}

export function useHistory() {
  const items = useLocalList<HistoryItem>(HISTORY_KEY, getHistory);
  const push = useCallback((item: Omit<HistoryItem, "viewedAt">) => pushHistory(item), []);
  const remove = useCallback((id: string) => removeHistory(id), []);
  const clear = useCallback(() => clearHistory(), []);
  return { history: items, push, remove, clear };
}
