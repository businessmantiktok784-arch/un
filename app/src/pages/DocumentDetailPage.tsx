import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentProtection from "@/components/ContentProtection";
import Breadcrumbs from "@/components/Breadcrumbs";
import DrivePdfViewer from "@/components/DrivePdfViewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Download, Star, ArrowLeft, FileText, Calendar, User, BookOpen,
  Share2, Bookmark, Loader2, Flag,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import ShareModal from "@/components/ShareModal";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/lib/useSEO";
import CommentsSection from "@/components/CommentsSection";
import FairUseNotice from "@/components/FairUseNotice";
import AdSlot from "@/components/AdSlot";
import { useBookmarks, pushHistory } from "@/lib/localStore";

interface DocRow {
  id: string;
  title: string;
  description: string | null;
  course_code: string;
  course_name: string | null;
  university: string;
  faculty: string | null;
  semester: string | null;
  academic_year: string | null;
  doc_type: string;
  downloads_count: number;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  uploader_id: string;
  page_count: number | null;
  file_size_bytes: number;
  storage_path?: string;
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { ids, toggle } = useBookmarks();

  const [doc, setDoc] = useState<DocRow | null>(null);
  const [uploaderName, setUploaderName] = useState<string>("Anonymous");
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const handleReport = async () => {
    if (!reportReason) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to report content." });
      return;
    }
    setReporting(true);
    const { error } = await supabase.from("content_reports").insert({
      document_id: doc!.id,
      reporter_id: user.id,
      reason: reportReason,
    });
    setReporting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Report submitted", description: "Thank you. Our team will review it." });
    setReportOpen(false);
    setReportReason("");
  };

  useSEO({
    title: doc?.title,
    description: doc?.description || (doc ? `${doc.doc_type} for ${doc.course_code} — ${doc.course_name || ""} at ${doc.university}.` : undefined),
    type: "article",
    jsonLd: doc ? {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: doc.title,
      description: doc.description || undefined,
      learningResourceType: doc.doc_type,
      educationalLevel: "University",
      inLanguage: "en",
      provider: { "@type": "Organization", name: "UniHub" },
      about: doc.course_name || doc.course_code,
      aggregateRating: doc.rating_count > 0 ? {
        "@type": "AggregateRating",
        ratingValue: doc.rating_avg,
        ratingCount: doc.rating_count,
      } : undefined,
    } : undefined,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setDoc(data as DocRow);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.uploader_id)
        .maybeSingle();
      if (!cancelled && profile?.full_name) setUploaderName(profile.full_name);

      // Inline preview URL (signed, short-lived)
      if (data.storage_path) {
        const { data: signed } = await supabase
          .storage
          .from("documents")
          .createSignedUrl(data.storage_path, 60 * 30);
        if (!cancelled && signed?.signedUrl) setViewUrl(signed.signedUrl);
      }

      pushHistory({
        id: data.id,
        title: data.title,
        course: data.course_code,
        university: data.university,
        type: data.doc_type,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Real-time: refresh document details when that document changes
  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`doc-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "documents", filter: `id=eq.${id}` }, () => {
        if (!id) return;
        (async () => {
          const { data } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
          if (data) setDoc(data as DocRow);
        })();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  const handleDownload = async () => {
    if (!doc) return;
    setDownloading(true);
    try {
      // Try edge function (handles signed URLs + download counter)
      const { data, error } = await supabase.functions.invoke("document-download", {
        body: { document_id: doc.id },
      });

      let downloadUrl: string | null = data?.url ?? null;

      // Fallback: directly sign the storage path if the edge function is unavailable.
      if ((error || !downloadUrl) && doc.storage_path) {
        const { data: signed } = await supabase
          .storage
          .from("documents")
          .createSignedUrl(doc.storage_path, 60 * 10);
        downloadUrl = signed?.signedUrl ?? null;
      }

      if (!downloadUrl) throw new Error("Could not prepare download link.");

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${doc.title}.pdf`;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({ title: "Download started", description: "Enjoy the document — and consider uploading one of yours to pay it forward." });
    } catch (err: any) {
      toast({ title: "Download failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (notFound || !doc) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-lg py-20 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Document Not Found</h1>
          <p className="mt-2 text-muted-foreground">This document may have been removed or never existed.</p>
          <Button className="mt-6" onClick={() => navigate("/browse")}>Browse Documents</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isBookmarked = ids.includes(doc.id);
  const sizeMB = (doc.file_size_bytes / 1024 / 1024).toFixed(2);

  return (
    <ContentProtection>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Breadcrumbs />
        <div className="container max-w-4xl py-4">
          <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Browse
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge>{doc.doc_type}</Badge>
                  <Badge variant="outline">{doc.university}</Badge>
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{doc.title}</h1>
                {doc.description && (
                  <p className="mt-2 text-muted-foreground">{doc.description}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {uploaderName}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {doc.created_at.split("T")[0]}</span>
                <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {doc.course_code}</span>
              </div>

              {viewUrl ? (
                <DrivePdfViewer src={viewUrl} title={doc.title} onDownload={handleDownload} />
              ) : (
                <Card className="overflow-hidden">
                  <CardContent className="p-8 text-center">
                    <FileText className="mx-auto h-16 w-16 text-primary/40" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Preview unavailable. Download to view the {sizeMB} MB document.
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-6 flex items-center justify-between">
                  <h3 className="font-display font-semibold text-foreground">Share or save</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setShareOpen(true)}>
                      <Share2 className="h-4 w-4" /> Share
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        toggle({
                          id: doc.id,
                          title: doc.title,
                          course: doc.course_code,
                          university: doc.university,
                          type: doc.doc_type,
                        });
                        toast({ title: isBookmarked ? "Removed from saved" : "Saved to this browser" });
                      }}
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
                      {isBookmarked ? "Saved" : "Save"}
                    </Button>
                    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive">
                          <Flag className="h-4 w-4" /> Report
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Report this document</DialogTitle>
                          <DialogDescription>Let us know if this content violates our guidelines.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label>Reason</Label>
                            <Select value={reportReason} onValueChange={setReportReason}>
                              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="copyright">Copyright violation</SelectItem>
                                <SelectItem value="plagiarism">Plagiarism</SelectItem>
                                <SelectItem value="duplicate">Duplicate content</SelectItem>
                                <SelectItem value="low_quality">Low quality</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button className="w-full" onClick={handleReport} disabled={!reportReason || reporting}>
                            {reporting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Submit Report
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              <FairUseNotice uploaderName={uploaderName} />

              <AdSlot slot="doc-detail-inline" className="my-2" minHeight={120} />

              <CommentsSection documentId={doc.id} />
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Button className="w-full gap-2" size="lg" onClick={handleDownload} disabled={downloading}>
                    {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                    {downloading ? "Preparing..." : "Download PDF"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Free download — no account, no credits. Please credit the original author.
                  </p>
                  <Separator />
                  <div className="space-y-3 text-sm">
                    {[
                      { label: "Downloads", value: doc.downloads_count.toLocaleString() },
                      { label: "Course", value: doc.course_code },
                      { label: "University", value: doc.university },
                      { label: "Type", value: doc.doc_type },
                      { label: "Size", value: `${sizeMB} MB` },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium text-foreground">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rating</span>
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Star className="h-4 w-4 fill-accent text-accent" /> {Number(doc.rating_avg).toFixed(1)} ({doc.rating_count})
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>

        <ShareModal open={shareOpen} onOpenChange={setShareOpen} title={doc.title} url={`/document/${doc.id}`} />

        <Footer />
      </div>
    </ContentProtection>
  );
}
