// Realtime hooks for live backend data. All public pages use these so
// admin edits in the dashboard show up everywhere without a refresh.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UniversityRow {
  id: string;
  name: string;
  abbr: string;
  country: string | null;
  city: string | null;
  campuses: string[];
  featured: boolean;
  description: string | null;
  logo_url: string | null;
  docs_count?: number;
}

export interface DocumentRow {
  id: string;
  title: string;
  course_code: string;
  course_name: string | null;
  university: string;
  faculty: string | null;
  semester: string | null;
  academic_year: string | null;
  doc_type: string;
  downloads_count: number;
  rating_avg: number;
  created_at: string;
}

export interface OpportunityRow {
  id: string;
  title: string;
  type: string | null;
  category: string | null;
  country: string | null;
  deadline: string | null;
  description: string | null;
  link: string | null;
  featured: boolean;
  status: string;
}

export interface TestimonialRow {
  id: string;
  student_name: string;
  university: string | null;
  quote: string;
  photo_url: string | null;
  featured: boolean;
}

export function useUniversities() {
  const [rows, setRows] = useState<UniversityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: unis } = await supabase
        .from("universities")
        .select("id,name,abbr,country,city,campuses,featured,description,logo_url")
        .order("featured", { ascending: false })
        .order("name");
      const list = (unis ?? []) as unknown as UniversityRow[];

      // Doc counts per university name
      const counts: Record<string, number> = {};
      const names = list.map((u) => u.name);
      if (names.length) {
        const { data: docs } = await supabase
          .from("documents")
          .select("university")
          .eq("status", "approved")
          .in("university", names);
        (docs ?? []).forEach((d: any) => { counts[d.university] = (counts[d.university] ?? 0) + 1; });
      }
      if (cancelled) return;
      setRows(list.map((u) => ({ ...u, abbr: u.abbr || u.name.slice(0, 3).toUpperCase(), campuses: u.campuses ?? [], docs_count: counts[u.name] ?? 0 })));
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("universities-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "universities" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  return { universities: rows, loading };
}

export function useDocuments(opts: { limit?: number; sort?: "downloads" | "recent"; university?: string } = {}) {
  const { limit = 6, sort = "downloads", university } = opts;
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let q = supabase
        .from("documents")
        .select("id,title,course_code,course_name,university,faculty,semester,academic_year,doc_type,downloads_count,rating_avg,created_at")
        .eq("status", "approved");
      if (university) q = q.eq("university", university);
      q = q.order(sort === "downloads" ? "downloads_count" : "created_at", { ascending: false }).limit(limit);
      const { data } = await q;
      if (cancelled) return;
      setRows((data ?? []) as DocumentRow[]);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`docs-live-${sort}-${university ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [limit, sort, university]);

  return { docs: rows, loading };
}

export function useOpportunities(opts: { limit?: number; featuredOnly?: boolean } = {}) {
  const { limit, featuredOnly } = opts;
  const [rows, setRows] = useState<OpportunityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let q = supabase
        .from("opportunities")
        .select("id,title,type,category,country,deadline,description,link,featured,status")
        .eq("status", "approved")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (featuredOnly) q = q.eq("featured", true);
      if (limit) q = q.limit(limit);
      const { data } = await q;
      if (cancelled) return;
      setRows((data ?? []) as OpportunityRow[]);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`opps-live-${limit ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "opportunities" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [limit, featuredOnly]);

  return { opportunities: rows, loading };
}

export function useTestimonials(limit = 8) {
  const [rows, setRows] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("id,student_name,university,quote,photo_url,featured")
        .eq("status", "approved")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (cancelled) return;
      setRows((data ?? []) as TestimonialRow[]);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("testimonials-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "testimonials" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [limit]);

  return { testimonials: rows, loading };
}

export interface DonationSettingsRow {
  momo_number: string | null;
  momo_name: string | null;
  enabled: boolean;
}

export function useDonationSettings() {
  const [settings, setSettings] = useState<DonationSettingsRow>({ momo_number: null, momo_name: null, enabled: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("donation_settings")
        .select("momo_number,momo_name,enabled")
        .maybeSingle();
      if (cancelled) return;
      if (data) setSettings(data as DonationSettingsRow);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("donation-settings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "donation_settings" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  return { donationSettings: settings, loading };
}

export interface SiteSettingsRow {
  platform_name: string | null;
  support_email: string | null;
  auto_approve: boolean;
  email_notifications: boolean;
  maintenance_mode: boolean;
  play_store_url: string | null;
  app_store_url: string | null;
  play_store_enabled: boolean;
  app_store_enabled: boolean;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettingsRow>({
    platform_name: null, support_email: null,
    auto_approve: false, email_notifications: false, maintenance_mode: false,
    play_store_url: null, app_store_url: null, play_store_enabled: false, app_store_enabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("platform_name,support_email,auto_approve,email_notifications,maintenance_mode,play_store_url,app_store_url,play_store_enabled,app_store_enabled")
        .maybeSingle();
      if (cancelled) return;
      if (data) setSettings(data as SiteSettingsRow);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("site-settings-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, load)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  return { siteSettings: settings, loading };
}

// Shared singleton for usePlatformStats to avoid duplicate channel subscriptions
const statsShared: {
  channel: ReturnType<typeof supabase.channel> | null;
  listeners: Set<(s: { documents: number; students: number; universities: number; downloads: number }) => void>;
} = { channel: null, listeners: new Set() };

export function usePlatformStats() {
  const [stats, setStats] = useState({ documents: 0, students: 0, universities: 0, downloads: 0 });

  useEffect(() => {
    const load = async () => {
      const [docsRes, profilesRes, unisRes, dlAgg] = await Promise.all([
        supabase.from("documents").select("downloads_count", { count: "exact" }).eq("status", "approved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("universities").select("id", { count: "exact", head: true }),
        supabase.from("documents").select("downloads_count").eq("status", "approved"),
      ]);
      const downloads = (dlAgg.data ?? []).reduce((s: number, r: any) => s + (r.downloads_count ?? 0), 0);
      const next = {
        documents: docsRes.count ?? 0,
        students: profilesRes.count ?? 0,
        universities: unisRes.count ?? 0,
        downloads,
      };
      statsShared.listeners.forEach(fn => fn(next));
    };

    statsShared.listeners.add(setStats);
    if (!statsShared.channel) {
      statsShared.channel = supabase
        .channel("stats-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, load)
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
        .on("postgres_changes", { event: "*", schema: "public", table: "universities" }, load)
        .subscribe();
      load();
    }
    return () => {
      statsShared.listeners.delete(setStats);
      if (statsShared.listeners.size === 0 && statsShared.channel) {
        supabase.removeChannel(statsShared.channel);
        statsShared.channel = null;
      }
    };
  }, []);

  return stats;
}
