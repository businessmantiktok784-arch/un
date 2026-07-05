import { useSEO } from "@/lib/useSEO";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { documentTypes, faculties } from "@/lib/mockData";
import { useUniversities } from "@/hooks/useLiveData";
import { Upload, FileText, X, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useCredits } from "@/contexts/CreditContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { sanitizeInput, checkRateLimit } from "@/lib/security";

const semesters = ["Semester 1", "Semester 2", "Semester 3"] as const;
const academicYears = ["2025-2026", "2024-2025", "2023-2024", "2022-2023"];

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

export default function UploadPage() {
  useSEO({ title: "Upload Document", description: "Share past exams, notes or assignments with fellow students." });
  const { universities } = useUniversities();
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useCredits();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [docType, setDocType] = useState("");
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [description, setDescription] = useState("");
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);

  const validateFile = (f: File): string | null => {
    if (f.type !== "application/pdf") return "Only PDF files are accepted.";
    if (f.size > MAX_FILE_BYTES) return "File too large. Maximum size is 20MB.";
    if (f.size === 0) return "File appears to be empty.";
    return null;
  };

  const handleSetFile = (f: File) => {
    const err = validateFile(f);
    if (err) {
      toast({ title: "Invalid file", description: err, variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleSetFile(dropped);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Rate limiting
    const rateLimit = checkRateLimit(`upload:${user?.id || 'anonymous'}`);
    if (!rateLimit.allowed) {
      toast({ title: "Upload limit reached", description: "Please wait before uploading again.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "No file selected", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (!courseCode.trim()) {
      toast({ title: "Course code required", variant: "destructive" });
      return;
    }
    if (!university) {
      toast({ title: "University required", variant: "destructive" });
      return;
    }
    if (title.length > 200) {
      toast({ title: "Title too long", description: "Maximum 200 characters.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // 0) Compute SHA-256 hash to detect duplicates BEFORE uploading
      const buf = await file.arrayBuffer();
      const hashBuf = await crypto.subtle.digest("SHA-256", buf);
      const fileHash = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { data: existing } = await supabase
        .from("documents")
        .select("id, title")
        .eq("file_hash", fileHash)
        .eq("status", "approved")
        .maybeSingle();

      if (existing) {
        toast({
          title: "Duplicate file detected",
          description: `This exact file already exists as "${existing.title}". No need to re-upload — opening it now.`,
          variant: "destructive",
        });
        setUploading(false);
        navigate(`/document/${existing.id}`);
        return;
      }

      // Resolve university label
      const uniRecord = universities.find((u) => u.id === university);
      const uniLabel = uniRecord?.name ?? university;

      // Path: <user_id>/<timestamp>-<safe-name>.pdf
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
      const path = `${user.id}/${Date.now()}-${safeName}`;

      // 1) Upload to private bucket
      const { error: uploadErr } = await supabase
        .storage.from("documents")
        .upload(path, file, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (uploadErr) throw uploadErr;

      // 2) Insert metadata row (with sanitization)
      const { data: docRow, error: insertErr } = await supabase
        .from("documents")
        .insert({
          uploader_id: user.id,
          title: sanitizeInput(title.trim()),
          description: sanitizeInput(description.trim()) || null,
          university: sanitizeInput(uniLabel),
          faculty: faculty ? sanitizeInput(faculty) : null,
          course_code: sanitizeInput(courseCode.trim()),
          academic_year: academicYear || null,
          semester: semester || null,
          doc_type: (docType as any) || "Notes",
          tags: tags.length > 0 ? tags : null,
          storage_path: path,
          file_size_bytes: file.size,
          mime_type: "application/pdf",
          file_hash: fileHash,
        } as any)
        .select("id")
        .single();

      if (insertErr) {
        // rollback the file upload
        await supabase.storage.from("documents").remove([path]);
        if ((insertErr as any).code === "23505") {
          throw new Error("This file is already on the platform.");
        }
        throw insertErr;
      }

      setCreatedDocId(docRow.id);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast({
        title: "Upload failed",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false); setFile(null); setTags([]); setTitle(""); setCourseCode("");
    setDocType(""); setUniversity(""); setFaculty(""); setSemester(""); setAcademicYear(""); setDescription("");
    setCreatedDocId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {submitted ? (
        <div className="container max-w-lg py-16">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Upload Successful!</h2>
            <p className="mt-2 text-muted-foreground">Your document is live and other students can now find it.</p>
            <div className="mt-6 flex justify-center gap-2">
              <Button onClick={resetForm}>Upload Another</Button>
              {createdDocId && (
                <Button variant="outline" onClick={() => navigate(`/document/${createdDocId}`)}>
                  View Document
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="container max-w-3xl py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-2">
              <h1 className="font-display text-3xl font-bold text-foreground">Upload Document</h1>
            </div>
            <p className="text-muted-foreground">Share academic resources with fellow students</p>

            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
              <p className="font-semibold text-foreground">📚 Just finished an exam, CAT or quiz?</p>
              <p className="mt-1 text-muted-foreground">
                Pay it forward — upload your past paper or notes so juniors can study from them next year.
                We automatically detect duplicate files so the same paper is never stored twice.
              </p>
            </div>


            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Document File</CardTitle><CardDescription>Upload a PDF file (max 20MB)</CardDescription></CardHeader>
                <CardContent>
                  {file ? (
                    <div className="flex items-center gap-4 rounded-xl border bg-primary/5 p-4">
                      <FileText className="h-10 w-10 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Button variant="ghost" size="sm" type="button" onClick={() => setFile(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                      onClick={() => document.getElementById("file-upload")?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                    >
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <p className="mt-3 text-sm text-muted-foreground">Drag and drop or <span className="text-primary font-medium">click to browse</span></p>
                      <p className="mt-1 text-xs text-muted-foreground">PDF files only, max 20MB</p>
                    </div>
                  )}
                  <input id="file-upload" type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleSetFile(e.target.files[0])} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Document Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>Title *</Label><Input placeholder="e.g. Data Structures Final 2024" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>Course Code *</Label><Input placeholder="e.g. CSC 2103" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} maxLength={32} /></div>
                    <div className="space-y-2">
                      <Label>Document Type</Label>
                      <Select value={docType} onValueChange={setDocType}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{documentTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>University *</Label>
                      <Select value={university} onValueChange={setUniversity}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{universities.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Faculty</Label>
                      <Select value={faculty} onValueChange={setFaculty}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{faculties.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Academic Year</Label>
                      <Select value={academicYear} onValueChange={setAcademicYear}><SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger><SelectContent>{academicYears.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <Select value={semester} onValueChange={setSemester}><SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger><SelectContent>{semesters.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea placeholder="Brief description of the document..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={1000} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} maxLength={24} />
                      <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tags.map((t) => (
                          <Badge key={t} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setTags(tags.filter((x) => x !== t))}>{t} <X className="h-3 w-3" /></Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={uploading}>
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                {uploading ? "Uploading..." : "Upload Document"}
              </Button>
            </form>
          </motion.div>
        </div>
      )}
      <Footer />
    </div>
  );
}
