import { useSEO } from "@/lib/useSEO";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DocumentCard from "@/components/DocumentCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useUniversities, useDocuments } from "@/hooks/useLiveData";
import { faculties } from "@/lib/mockData";
import { GraduationCap, FileText, Users, MapPin, ArrowLeft, Building2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

export default function UniversityDetailPage() {
  useSEO({ title: "University", description: "Browse documents, faculties and courses for this university." });
  const { id } = useParams();
  const { universities, loading } = useUniversities();
  const [selectedFaculty, setSelectedFaculty] = useState("all");

  const uni = useMemo(() => {
    if (!universities.length) return null;
    const key = (id ?? "").toLowerCase();
    return (
      universities.find((u) => u.abbr.toLowerCase() === key) ||
      universities.find((u) => u.id === id) ||
      universities[0]
    );
  }, [universities, id]);

  const { docs } = useDocuments({ limit: 12, sort: "recent", university: uni?.name });

  const courses = useMemo(() => {
    const map = new Map<string, { code: string; name: string; faculty: string; docs: number }>();
    docs.forEach((d) => {
      const key = d.course_code;
      if (!map.has(key)) {
        map.set(key, { code: d.course_code, name: d.course_name || d.course_code, faculty: d.faculty || "General", docs: 0 });
      }
      map.get(key)!.docs += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.docs - a.docs);
  }, [docs]);

  const filteredCourses = selectedFaculty === "all" ? courses : courses.filter((c) => c.faculty === selectedFaculty);

  if (loading || !uni) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden py-12 md:py-16">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(/hero/priscilla-du-preez-XkKCui44iM0-unsplash.jpg)" }} />
        <div className="absolute inset-0 bg-black/50" />
        <div className="container relative z-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 font-display text-2xl font-bold text-primary-foreground">
                {uni.abbr.slice(0, 2)}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-primary-foreground md:text-4xl">{uni.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-primary-foreground/70">
                  {uni.campuses.length > 0 && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{uni.campuses.join(", ")}</span>}
                  <span className="flex items-center gap-1"><FileText className="h-4 w-4" />{(uni.docs_count ?? 0).toLocaleString()} documents</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{courses.length} courses</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {uni.campuses.length > 0 && (
        <section className="border-b bg-card">
          <div className="container py-6">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {uni.campuses.map((campus) => (
                <Card key={campus} className="shrink-0 min-w-[160px]">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{campus}</p>
                      <p className="text-xs text-muted-foreground">Campus</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> Courses
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={selectedFaculty === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedFaculty("all")}>All</Badge>
              {faculties.slice(0, 6).map((f) => (
                <Badge key={f} variant={selectedFaculty === f ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedFaculty(f)}>{f}</Badge>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {filteredCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6">No courses yet for this university. Be the first to upload!</p>
              ) : (
                filteredCourses.map((course, i) => (
                  <motion.div key={course.code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link to={`/browse?course=${encodeURIComponent(course.code)}`} className="flex items-center justify-between rounded-lg border bg-card p-4 transition-all hover:shadow-soft hover:-translate-y-0.5">
                      <div>
                        <p className="font-display text-sm font-semibold text-foreground">{course.code}</p>
                        <p className="text-sm text-muted-foreground">{course.name}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">{course.faculty}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-primary">{course.docs}</p>
                        <p className="text-xs text-muted-foreground">docs</p>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Recent Documents</h2>
            <div className="mt-4 space-y-3">
              {docs.slice(0, 3).map((doc, i) => (
                <DocumentCard
                  key={doc.id}
                  id={doc.id}
                  title={doc.title}
                  course={doc.course_code}
                  university={uni.abbr}
                  type={doc.doc_type}
                  downloads={doc.downloads_count}
                  rating={Number(doc.rating_avg) || 0}
                  uploadedBy=""
                  date={doc.created_at.split("T")[0]}
                  index={i}
                />
              ))}
              {docs.length === 0 && <p className="text-sm text-muted-foreground">No documents yet.</p>}
            </div>
            <Link to={`/browse?university=${uni.abbr}`}>
              <Button variant="outline" className="mt-4 w-full">View All Documents</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
