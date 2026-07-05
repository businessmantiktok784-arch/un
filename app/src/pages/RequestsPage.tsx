import { useSEO } from "@/lib/useSEO";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUniversities } from "@/hooks/useLiveData";
import { MessageSquarePlus, Search, ArrowUp, Clock, CheckCircle2, User, Upload, FileText, X, Paperclip, ArrowUpDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/contexts/CreditContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { sanitizeInput, checkRateLimit } from "@/lib/security";

interface ReqRow {
  id: string;
  requester_id: string;
  title: string;
  course_code: string | null;
  university: string | null;
  details: string | null;
  status: string;
  votes_count: number;
  answers_count: number;
  created_at: string;
}
interface AnswerRow {
  id: string;
  request_id: string;
  responder_id: string;
  body: string | null;
  file_name: string | null;
  file_url: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 6;

export default function RequestsPage() {
  useSEO({ title: "Document Requests", description: "Request specific past exams, notes or assignments. The community responds with the materials you need." });
  const { universities } = useUniversities();
  const { toast } = useToast();
  const { isLoggedIn, user } = useCredits();

  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [answersByReq, setAnswersByReq] = useState<Record<string, AnswerRow[]>>({});
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<"all" | "open" | "fulfilled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"votes" | "recent">("votes");
  const [currentPage, setCurrentPage] = useState(1);

  // New request
  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newUni, setNewUni] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Answer
  const [answerDialogId, setAnswerDialogId] = useState<string | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [answerBody, setAnswerBody] = useState("");
  const [posting, setPosting] = useState(false);

  const loadAll = async () => {
    const { data: reqs } = await supabase
      .from("document_requests" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const list = ((reqs ?? []) as any) as ReqRow[];
    setRequests(list);
    if (list.length) {
      const ids = list.map((r) => r.id);
      const { data: ans } = await supabase
        .from("request_answers" as any)
        .select("*")
        .in("request_id", ids)
        .order("created_at", { ascending: true });
      const grouped: Record<string, AnswerRow[]> = {};
      ((ans ?? []) as any as AnswerRow[]).forEach((a) => {
        (grouped[a.request_id] = grouped[a.request_id] || []).push(a);
      });
      setAnswersByReq(grouped);
    } else {
      setAnswersByReq({});
    }
    if (user) {
      const { data: votes } = await supabase
        .from("request_votes" as any)
        .select("request_id")
        .eq("user_id", user.id);
      setVotedIds(new Set(((votes ?? []) as any[]).map((v) => v.request_id)));
    } else {
      setVotedIds(new Set());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel("requests-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "document_requests" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "request_answers" }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    return requests
      .filter((r) => filter === "all" || r.status === filter)
      .filter((r) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return r.title.toLowerCase().includes(q) || (r.course_code ?? "").toLowerCase().includes(q);
      })
      .sort((a, b) => sortBy === "votes" ? b.votes_count - a.votes_count : +new Date(b.created_at) - +new Date(a.created_at));
  }, [requests, filter, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const requireLogin = (msg: string) => {
    toast({ title: "Sign in required", description: msg, variant: "destructive" });
  };

  const handleNewRequest = async () => {
    if (!user) return requireLogin("Please sign in to post a request.");
    const rateLimit = checkRateLimit(`request:${user.id}`);
    if (!rateLimit.allowed) { toast({ title: "Rate limit", description: "Please wait before posting again.", variant: "destructive" }); return; }
    if (!newTitle.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (newTitle.length > 200) { toast({ title: "Title too long", description: "Maximum 200 characters.", variant: "destructive" }); return; }
    if (newDetails.length > 2000) { toast({ title: "Details too long", description: "Maximum 2000 characters.", variant: "destructive" }); return; }
    setSubmitting(true);
    const { error } = await supabase.from("document_requests" as any).insert({
      requester_id: user.id,
      title: sanitizeInput(newTitle.trim()),
      course_code: sanitizeInput(newCourse.trim()) || null,
      university: newUni ? sanitizeInput(newUni) : null,
      details: sanitizeInput(newDetails.trim()) || null,
    });
    setSubmitting(false);
    if (error) { toast({ title: "Could not post", description: error.message, variant: "destructive" }); return; }
    setNewTitle(""); setNewCourse(""); setNewUni(""); setNewDetails("");
    setNewRequestOpen(false);
    setCurrentPage(1);
    toast({ title: "Request submitted!", description: "Other students at your university will be notified." });
  };

  const handleVote = async (id: string) => {
    if (!user) return requireLogin("Please sign in to vote.");
    if (votedIds.has(id)) {
      await supabase.from("request_votes" as any).delete().eq("request_id", id).eq("user_id", user.id);
      setVotedIds((s) => { const n = new Set(s); n.delete(id); return n; });
    } else {
      await supabase.from("request_votes" as any).insert({ request_id: id, user_id: user.id });
      setVotedIds((s) => new Set(s).add(id));
    }
  };

  const handlePostAnswer = async () => {
    if (!user || !answerDialogId) return;
    if (!answerBody.trim() && !answerFile) {
      toast({ title: "Add an answer", description: "Attach a file or write a short message.", variant: "destructive" });
      return;
    }
    setPosting(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      if (answerFile) {
        const safe = answerFile.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-80);
        const path = `${user.id}/answers/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, answerFile, { upsert: false });
        if (upErr) throw upErr;
        fileUrl = path;
        fileName = answerFile.name;
      }
      const { error } = await supabase.from("request_answers" as any).insert({
        request_id: answerDialogId,
        responder_id: user.id,
        body: answerBody.trim() || null,
        file_name: fileName,
        file_url: fileUrl,
      });
      if (error) throw error;
      toast({ title: "Answer posted", description: "The requester has been notified." });
      setAnswerDialogId(null); setAnswerFile(null); setAnswerBody("");
    } catch (e: any) {
      toast({ title: "Could not post", description: e?.message ?? "Try again", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Document Requests</h1>
            <p className="mt-1 text-muted-foreground">Can't find it? Ask the community!</p>
          </div>
          {!isLoggedIn ? (
            <Link to="/login"><Button className="gap-2"><MessageSquarePlus className="h-4 w-4" /> Sign in to post</Button></Link>
          ) : (
            <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><MessageSquarePlus className="h-4 w-4" /> New Request</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-display">Request a Document</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2"><Label>What do you need?</Label><Input placeholder="e.g. Calculus II 2024 CAT" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>Course Code</Label><Input placeholder="e.g. MTH 2102" value={newCourse} onChange={(e) => setNewCourse(e.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>University</Label>
                      <Select value={newUni} onValueChange={setNewUni}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{universities.map((u) => <SelectItem key={u.id} value={u.name}>{u.abbr}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Additional Details</Label><Textarea placeholder="Specify campus, year, semester..." rows={3} value={newDetails} onChange={(e) => setNewDetails(e.target.value)} /></div>
                  <Button className="w-full" onClick={handleNewRequest} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search requests..." className="pl-9" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
          </div>
          <div className="flex gap-2">
            {(["all", "open", "fulfilled"] as const).map((f) => (
              <Badge key={f} variant={filter === f ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => { setFilter(f); setCurrentPage(1); }}>{f}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="votes">Most Voted</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="py-16 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : paginated.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquarePlus className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No requests yet — be the first to post!</p>
            </div>
          ) : paginated.map((req, i) => {
            const answers = answersByReq[req.id] ?? [];
            const voted = votedIds.has(req.id);
            return (
              <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-soft transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button className={`transition-colors ${voted ? "text-primary" : "text-muted-foreground hover:text-primary"}`} onClick={() => handleVote(req.id)}>
                          <ArrowUp className="h-5 w-5" />
                        </button>
                        <span className="text-sm font-semibold text-foreground">{req.votes_count}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold text-foreground truncate">{req.title}</h3>
                          {req.status === "fulfilled" ? (
                            <Badge className="bg-primary/10 text-primary shrink-0"><CheckCircle2 className="mr-1 h-3 w-3" /> Fulfilled</Badge>
                          ) : (
                            <Badge variant="outline" className="shrink-0"><Clock className="mr-1 h-3 w-3" /> Open</Badge>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" /> Student</span>
                          {req.course_code && <Badge variant="secondary" className="text-xs">{req.course_code}</Badge>}
                          {req.university && <Badge variant="secondary" className="text-xs">{req.university}</Badge>}
                          <span>{new Date(req.created_at).toLocaleDateString()}</span>
                          <span>{req.answers_count} {req.answers_count === 1 ? "reply" : "replies"}</span>
                        </div>
                        {req.details && <p className="mt-2 text-sm text-muted-foreground">{req.details}</p>}
                        {answers.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Answers:</p>
                            {answers.map((a) => (
                              <div key={a.id} className="rounded-md bg-muted/50 px-3 py-2 text-xs">
                                {a.body && <p className="text-foreground">{a.body}</p>}
                                {a.file_name && (
                                  <a href="#" onClick={async (e) => {
                                    e.preventDefault();
                                    if (!a.file_url) return;
                                    const { data } = await supabase.storage.from("documents").createSignedUrl(a.file_url, 60 * 5);
                                    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                                  }} className="mt-1 inline-flex items-center gap-1 text-primary hover:underline">
                                    <Paperclip className="h-3 w-3" /> {a.file_name}
                                  </a>
                                )}
                                <p className="mt-1 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => {
                        if (!isLoggedIn) return requireLogin("Please sign in to answer.");
                        setAnswerDialogId(req.id);
                      }}>
                        <Upload className="h-3.5 w-3.5" /> Answer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>Previous</Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button key={i + 1} variant={currentPage === i + 1 ? "default" : "outline"} size="sm" className="w-9" onClick={() => setCurrentPage(i + 1)}>{i + 1}</Button>
            ))}
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      <Dialog open={answerDialogId !== null} onOpenChange={(open) => { if (!open) { setAnswerDialogId(null); setAnswerFile(null); setAnswerBody(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Upload className="h-5 w-5 text-primary" /> Post an Answer</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea rows={3} placeholder="Add a short note..." value={answerBody} onChange={(e) => setAnswerBody(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Attach file (optional)</Label>
              {answerFile ? (
                <div className="flex items-center gap-3 rounded-xl border bg-primary/5 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <span className="flex-1 truncate text-sm">{answerFile.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAnswerFile(null)}><X className="h-3.5 w-3.5" /></Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => document.getElementById("answer-file")?.click()}>
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Attach a PDF</span>
                </div>
              )}
              <input id="answer-file" type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && setAnswerFile(e.target.files[0])} />
            </div>
            <Button className="w-full gap-2" onClick={handlePostAnswer} disabled={posting}>
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Post Answer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
