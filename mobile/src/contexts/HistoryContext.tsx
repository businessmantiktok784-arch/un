import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const MAX_HISTORY = 200;
const STORAGE_KEY = 'unihub_history';

interface HistoryEntry {
  id: string;
  title: string;
  course_code: string;
  university: string;
  viewed_at: string;
}

interface HistoryContextType {
  entries: HistoryEntry[];
  addEntry: (doc: { id: string; title: string; course_code: string; university: string }) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
}

const HistoryContext = createContext<HistoryContextType>({ entries: [], addEntry: () => {}, removeEntry: () => {}, clearAll: () => {} });

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => { if (v) setEntries(JSON.parse(v)); });
  }, []);

  useEffect(() => { AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }, [entries]);

  const addEntry = useCallback((doc: { id: string; title: string; course_code: string; university: string }) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== doc.id);
      return [{ ...doc, viewed_at: new Date().toISOString() }, ...filtered].slice(0, MAX_HISTORY);
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
  }, []);

  return (
    <HistoryContext.Provider value={{ entries, addEntry, removeEntry, clearAll }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  return useContext(HistoryContext);
}
