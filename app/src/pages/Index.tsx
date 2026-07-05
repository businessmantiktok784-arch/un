import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DocumentCard from "@/components/DocumentCard";
import UniversityCard from "@/components/UniversityCard";

import Footer from "@/components/Footer";
import TestimonialsSection from "@/components/TestimonialsSection";
import { useUniversities, useDocuments, useOpportunities } from "@/hooks/useLiveData";
import { useSEO } from "@/lib/useSEO";
import { ArrowRight, Sparkles, MessageSquarePlus, Clock, Briefcase, MapPin, ExternalLink, Upload, Search, Download, HelpCircle, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

function toCardProps(d: any, university: string) {
  return {
    id: d.id,
    title: d.title,
    course: d.course_code,
    university,
    type: d.doc_type,
    downloads: d.downloads_count ?? 0,
    rating: Number(d.rating_avg ?? 0),
    uploadedBy: "",
    date: d.created_at,
  };
}

const Index = () => {
  useSEO({
    title: "Past Exams, Notes & Assignments",
    description: "Worldwide's student-driven academic resource platform. Share and download past exams, notes & assignments from UR, AUCA, CMU, UK, MKU & INES.",
  });
  const { universities } = useUniversities();
  const { docs: trending, loading: trendingLoading } = useDocuments({ limit: 6, sort: "downloads" });
  const { docs: recent } = useDocuments({ limit: 3, sort: "recent" });
  const { opportunities } = useOpportunities({ limit: 3 });
  const [selectedCountry, setSelectedCountry] = useState("all");
  const countries = [...new Set(universities.map((u) => u.country).filter(Boolean))] as string[];
  const filteredUniversities = selectedCountry === "all" ? universities : universities.filter((u) => u.country === selectedCountry);
  const supportedFaq = (() => {
    const grouped: Record<string, string[]> = {};
    universities.forEach((u) => {
      const c = u.country || "Other";
      if (!grouped[c]) grouped[c] = [];
      grouped[c].push(`${u.name} (${u.abbr})`);
    });
    return Object.entries(grouped).map(([country, list]) => `${country}: ${list.join(", ")}`).join(". ") + ". Other countries worldwide are not supported yet — coming soon!";
  })();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />

      {/* Trending Documents */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Trending Documents
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Most downloaded right now</p>
            </div>
            <Link to="/browse">
              <Button variant="ghost" size="sm" className="gap-1.5 text-primary">View all <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
          {trendingLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : trending.length === 0 ? (
            <p className="mt-8 text-sm text-muted-foreground">No documents yet — be the first to upload!</p>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trending.map((doc, i) => <DocumentCard key={doc.id} {...toCardProps(doc, doc.university)} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* Recent Uploads */}
      {recent.length > 0 && (
        <section className="border-t bg-muted/20 py-16">
          <div className="container">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                  <Clock className="mr-2 inline h-6 w-6 text-primary" />
                  Recent Uploads
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Freshly shared by the community</p>
              </div>
              <Link to="/browse"><Button variant="ghost" size="sm" className="gap-1.5 text-primary">See more <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((doc, i) => <DocumentCard key={doc.id} {...toCardProps(doc, doc.university)} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* Universities */}
      <section className="border-t py-16">
        <div className="container">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Universities</h2>
            <p className="mt-1 text-sm text-muted-foreground">Browse by institution</p>
            {countries.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Badge variant={selectedCountry === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedCountry("all")}>All</Badge>
                {countries.map((c) => (
                  <Badge key={c} variant={selectedCountry === c ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelectedCountry(c)}>{c}</Badge>
                ))}
              </div>
            )}
            <div className="mt-6 grid gap-3">
              {filteredUniversities.map((uni, i) => (
                <UniversityCard key={uni.id} id={uni.id} name={uni.name} abbr={uni.abbr} campuses={uni.campuses} docs={uni.docs_count ?? 0} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Internship Highlights */}
      {opportunities.length > 0 && (
        <section className="border-t bg-muted/20 py-16">
          <div className="container">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                  <Briefcase className="mr-2 inline h-6 w-6 text-primary" />
                  Internship Highlights
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Latest opportunities for students</p>
              </div>
              <Link to="/opportunities"><Button variant="ghost" size="sm" className="gap-1.5 text-primary">View all <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((opp, i) => (
                <motion.div key={opp.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-xl border bg-card p-5 shadow-soft transition-all hover:shadow-elevated">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">{opp.title}</h3>
                      {opp.category && <p className="mt-1 text-sm text-muted-foreground">{opp.category}</p>}
                    </div>
                    {opp.type && <Badge variant="secondary" className="shrink-0 text-xs">{opp.type}</Badge>}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {opp.country && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opp.country}</span>}
                    {opp.deadline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Deadline: {opp.deadline}</span>}
                  </div>
                  <Link to="/opportunities"><Button variant="outline" size="sm" className="mt-4 gap-1.5 w-full">View Details <ExternalLink className="h-3.5 w-3.5" /></Button></Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">How It Works</h2>
            <p className="mt-2 text-muted-foreground">Get started in 3 simple steps</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Upload, step: "1", title: "Upload & Share", desc: "Share your past exams, notes, or assignments with the community." },
              { icon: Search, step: "2", title: "Browse & Find", desc: "Search across universities by course code, faculty, semester, or document type." },
              { icon: Download, step: "3", title: "Download & Study", desc: "Access quality study materials and ace your exams." },
            ].map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <Card className="text-center h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4 relative">
                      <item.icon className="h-7 w-7 text-primary" />
                      <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{item.step}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="border-t bg-muted/20 py-16">
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <HelpCircle className="mx-auto h-8 w-8 text-primary mb-3" />
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "How do I sign in?", a: "Click 'Sign in' in the header and continue with Google. First-time users answer three short questions about their university, program and year." },
              { q: "Do I need an account to browse?", a: "No. Browsing, searching and viewing documents is free for everyone. Sign in only to bookmark items, sync your history across devices, post requests, or receive notifications." },
              { q: "Which universities are supported?", a: supportedFaq },
              { q: "How do I upload a document?", a: "Click Upload, fill in course code, university, type and year, then submit your PDF. An admin reviews every upload before it goes live." },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm text-left font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-6 text-center">
            <Link to="/help"><Button variant="outline" className="gap-2">View all FAQs <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* Document Requests CTA */}
      <section className="py-16">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-2xl bg-hero p-8 md:p-12">
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <MessageSquarePlus className="mx-auto h-10 w-10 text-accent" />
              <h2 className="mt-4 font-display text-2xl font-bold text-primary-foreground md:text-3xl">Can't Find What You Need?</h2>
              <p className="mt-3 text-primary-foreground/80">Request specific past exams, notes, or assignments and the community will help you out.</p>
              <Link to="/requests"><Button size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 shadow-soft font-semibold">Make a Request</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
