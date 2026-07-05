import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import DocumentCard from "@/components/DocumentCard";
import AdSlot from "@/components/AdSlot";

import { documentTypes, faculties } from "@/lib/mockData";
import { useUniversities } from "@/hooks/useLiveData";
import { Search, ArrowUpDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/lib/useSEO";

const ITEMS_PER_PAGE = 12;
const semesters = ["Semester 1", "Semester 2", "Semester 3"];

interface DocRow {
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
  uploader_id: string;
}

export default function BrowsePage() {
  useSEO({
    title: "Browse Documents",
    description: "Search past exams, notes and assignments from universities. Filter by university, faculty, course and semester.",
  });
  const { universities } = useUniversities();
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"downloads" | "rating" | "recent">("downloads");
  const [selectedUni, setSelectedUni] = useState<string>("all");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sync URL params (from hero search / command palette)
  useEffect(() => {
    const q = searchParams.get("q");
    const course = searchParams.get("course");
    if (q) setSearchQuery(q);
    if (course) setSearchQuery(course);
  }, [searchParams]);

  // Fetch from Supabase whenever filters change
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const uniRecord = selectedUni === "all" ? null : universities.find((u) => u.id === selectedUni);
      const uniLabel = uniRecord?.name;

      let query = supabase
        .from("documents")
        .select("id,title,course_code,course_name,university,faculty,semester,academic_year,doc_type,downloads_count,rating_avg,created_at,uploader_id", { count: "exact" })
        .eq("status", "approved");

      if (selectedType) query = query.eq("doc_type", selectedType as any);
      if (uniLabel) query = query.eq("university", uniLabel);
      if (selectedFaculty !== "all") query = query.eq("faculty", selectedFaculty);
      if (selectedYear !== "all") query = query.eq("academic_year", selectedYear);
      if (selectedSemester !== "all") query = query.eq("semester", selectedSemester);
      if (searchQuery.trim()) {
        const q = searchQuery.trim().replace(/[%_,;']/g, "").slice(0, 100);
        if (q) query = query.or(`title.ilike.%${q}%,course_code.ilike.%${q}%,course_name.ilike.%${q}%`);
      }

      const sortColumn = sortBy === "downloads" ? "downloads_count" : sortBy === "rating" ? "rating_avg" : "created_at";
      query = query.order(sortColumn, { ascending: false });

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(from, from + ITEMS_PER_PAGE - 1);

      const { data, count, error } = await query;
      if (cancelled) return;
      if (error) {
        console.error("Browse query failed:", error);
        setDocs([]);
        setTotalCount(0);
      } else {
        setDocs((data ?? []) as DocRow[]);
        setTotalCount(count ?? 0);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [selectedType, searchQuery, sortBy, selectedUni, selectedFaculty, selectedYear, selectedSemester, currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const handleFilterChange = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Breadcrumbs />

      <div className="container py-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Browse Documents</h1>
        <p className="mt-1 text-muted-foreground">Find academic resources across universities</p>

        <div className="mt-6 flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or course code..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
            />
          </div>
          <Select value={selectedUni} onValueChange={(v) => handleFilterChange(setSelectedUni, v)}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="University" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {universities.map((u) => <SelectItem key={u.id} value={u.id}>{u.abbr}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedFaculty} onValueChange={(v) => handleFilterChange(setSelectedFaculty, v)}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Faculty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              {faculties.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={(v) => handleFilterChange(setSelectedYear, v)}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {["2025-2026", "2024-2025", "2023-2024", "2022-2023"].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSemester} onValueChange={(v) => handleFilterChange(setSelectedSemester, v)}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {semesters.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Badge variant={selectedType === null ? "default" : "outline"} className="cursor-pointer" onClick={() => handleFilterChange(setSelectedType, null)}>All</Badge>
            {documentTypes.map((t) => (
              <Badge key={t} variant={selectedType === t ? "default" : "outline"} className="cursor-pointer" onClick={() => handleFilterChange(setSelectedType, t)}>{t}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="downloads">Most Downloaded</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {docs.map((doc, i) => (
                <DocumentCard
                  key={doc.id}
                  id={doc.id}
                  title={doc.title}
                  course={doc.course_code}
                  university={doc.university}
                  type={doc.doc_type}
                  downloads={doc.downloads_count}
                  rating={Number(doc.rating_avg) || 0}
                  uploadedBy=""
                  date={doc.created_at.split("T")[0]}
                  index={i}
                />
              ))}
            </div>

            {docs.length >= 6 && (
              <AdSlot slot="browse-inline" className="mt-6" minHeight={100} />
            )}


            {docs.length === 0 && (
              <div className="py-16 text-center">
                <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No documents found. Try adjusting your filters or be the first to upload!</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className="w-9" onClick={() => setCurrentPage(page)}>{page}</Button>
                  );
                })}
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
              </div>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Showing {docs.length} of {totalCount} documents
            </p>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
