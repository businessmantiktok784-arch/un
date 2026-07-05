import { useSEO } from "@/lib/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen, Upload, Shield, MessageSquare, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useUniversities } from "@/hooks/useLiveData";
import { useMemo } from "react";

function buildSupportedFaq(universities: { name: string; abbr: string; country: string | null }[]) {
  const grouped: Record<string, string[]> = {};
  universities.forEach((u) => {
    const c = u.country || "Other";
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(`${u.name} (${u.abbr})`);
  });
  return Object.entries(grouped).map(([country, list]) => `${country}: ${list.join(", ")}`).join(". ") + ". More universities are added regularly.";
}

function useFaqCategories() {
  const { universities } = useUniversities();
  const supported = useMemo(() => buildSupportedFaq(universities), [universities]);
  return [
    {
      title: "Getting Started",
      icon: BookOpen,
      faqs: [
        { q: "What is UniHub?", a: "UniHub is a student-driven platform where university students worldwide share and access past exams, notes, assignments, lab reports and other study materials as PDFs." },
        { q: "How do I sign in?", a: "Click 'Sign in' in the header and continue with your Google account. The first time, we ask three quick questions — your university, program and year of study — then you're in." },
        { q: "Do I need an account to read documents?", a: "No. Anyone can browse and view documents. You need a Google account to download, bookmark, comment, upload or get notifications." },
        { q: "How do credits work?", a: "You earn 5 credits for every approved upload and spend 1 credit to download a document you don't own. Your own uploads are always free to download." },
        { q: "Which universities are supported?", a: supported },
      ],
    },
  {
    title: "Uploading Documents",
    icon: Upload,
    faqs: [
      { q: "What file types can I upload?", a: "PDF only. Make sure your document is clear and legible before uploading." },
      { q: "What information do I need to provide?", a: "Title, course code, document type (exam, notes, assignment, etc.), university, faculty, semester and academic year. Tags and a description are optional but help others find your upload." },
      { q: "Are uploaded documents reviewed?", a: "Yes — every upload is reviewed by an admin before it appears publicly. You'll be notified once it's approved." },
      { q: "Can I upload from any university?", a: "Yes. You can contribute material for any of the supported universities, not just your own." },
    ],
  },
  {
    title: "Bookmarks, History & Notifications",
    icon: MessageSquare,
    faqs: [
      { q: "Where are my bookmarks saved?", a: "Bookmarks and view history sync to your account, so they follow you to any device once you sign in." },
      { q: "What notifications will I get?", a: "By default you'll be notified when someone at your university posts a new request. You can opt in to opportunity alerts and replies on your uploads from the Settings page." },
      { q: "How do requests work?", a: "Open the Requests page, describe what you need, and students at your university will see it. Anyone can attach a document to fulfil a request — it goes through normal admin review." },
    ],
  },
  {
    title: "Privacy & Security",
    icon: Shield,
    faqs: [
      { q: "Is my personal information safe?", a: "Authentication is handled by Google — we never see your password. Your private data is protected with row-level security so other users only see what you've made public." },
      { q: "Can I delete my account?", a: "Yes. From the Settings page you can export your data or permanently delete your account." },
      { q: "How do I report inappropriate content?", a: "Open the document and click the 'Report' button. Admins will review and take action." },
    ],
  },
];
}

export default function HelpPage() {
  const faqCategories = useFaqCategories();
  useSEO({ title: "Help Center", description: "Find answers about downloads, uploads, and account questions on UniHub." });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden bg-hero py-16">
        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <HelpCircle className="mx-auto h-10 w-10 text-primary-foreground mb-4" />
            <h1 className="font-display text-4xl font-bold text-primary-foreground">Help Center</h1>
            <p className="mt-3 text-primary-foreground/80 max-w-lg mx-auto">
              Find answers to common questions about using UniHub.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-4xl py-12">
        <div className="space-y-8">
          {faqCategories.map((cat, ci) => (
            <motion.div key={cat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ci * 0.05 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 font-display">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <cat.icon className="h-5 w-5 text-primary" />
                    </div>
                    {cat.title}
                    <Badge variant="secondary" className="ml-auto">{cat.faqs.length} questions</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {cat.faqs.map((faq, fi) => (
                      <AccordionItem key={fi} value={`${ci}-${fi}`}>
                        <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Still need help? */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8">
              <h3 className="font-display text-xl font-bold text-foreground">Still have questions?</h3>
              <p className="mt-2 text-sm text-muted-foreground">Can't find what you're looking for? Reach out to our team.</p>
              <Link to="/contact">
                <Button className="mt-4 gap-2">
                  Contact Support <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
