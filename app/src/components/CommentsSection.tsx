import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Reply, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/contexts/CreditContext";
import { useToast } from "@/hooks/use-toast";
import { sanitizeInput } from "@/lib/security";

interface CommentRow {
  id: string;
  document_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  deleted_at: string | null;
  created_at: string;
  author_name?: string;
}

interface Props { documentId: string }

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function CommentsSection({ documentId }: Props) {
  const { user, isAdmin, isLoggedIn } = useCredits();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("document_comments")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Could not load comments", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as CommentRow[];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const byId = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name || "Anonymous"]));
      rows.forEach((r) => { r.author_name = byId.get(r.user_id) || "Anonymous"; });
    }
    setComments(rows);
    setLoading(false);
  }, [documentId, toast]);

  useEffect(() => { load(); const ch = supabase.channel(`comments-${documentId}`).on("postgres_changes", { event: "*", schema: "public", table: "document_comments", filter: `document_id=eq.${documentId}` }, () => { load(); }).subscribe(); return () => { supabase.removeChannel(ch); }; }, [load, documentId]);

  const post = async (text: string, parentId: string | null) => {
    if (!user?.id) {
      toast({ title: "Sign in to comment", variant: "destructive" });
      return false;
    }
    const trimmed = sanitizeInput(text.trim());
    if (trimmed.length < 1 || trimmed.length > 4000) {
      toast({ title: "Comment must be 1–4000 chars", variant: "destructive" });
      return false;
    }
    setPosting(true);
    const { error } = await supabase.from("document_comments").insert({
      document_id: documentId,
      user_id: user.id,
      parent_id: parentId,
      body: trimmed,
    });
    setPosting(false);
    if (error) {
      toast({ title: "Could not post", description: error.message, variant: "destructive" });
      return false;
    }
    await load();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from("document_comments")
      .update({ deleted_at: new Date().toISOString(), body: "[deleted]" })
      .eq("id", id);
    if (error) toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    else load();
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (pid: string) => comments.filter((c) => c.parent_id === pid);

  const renderOne = (c: CommentRow, depth = 0) => {
    const initials = (c.author_name || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
    const canDelete = (user?.id === c.user_id || isAdmin) && !c.deleted_at;
    return (
      <div key={c.id} className={depth > 0 ? "ml-8 mt-3" : "mt-4"}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{c.author_name}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
            </div>
            <p className={`mt-1 text-sm whitespace-pre-wrap ${c.deleted_at ? "italic text-muted-foreground" : "text-foreground"}`}>
              {c.body}
            </p>
            {!c.deleted_at && (
              <div className="mt-1 flex items-center gap-3">
                {isLoggedIn && depth === 0 && (
                  <button
                    onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyBody(""); }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Reply className="h-3 w-3" /> Reply
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => remove(c.id)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                )}
              </div>
            )}
            {replyTo === c.id && (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  maxLength={4000}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={posting || !replyBody.trim()}
                    onClick={async () => {
                      const ok = await post(replyBody, c.id);
                      if (ok) { setReplyBody(""); setReplyTo(null); }
                    }}
                  >
                    {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reply"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
        {repliesOf(c.id).map((r) => renderOne(r, depth + 1))}
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Comments ({comments.filter((c) => !c.deleted_at).length})
        </h3>

        {isLoggedIn ? (
          <div className="mt-4 space-y-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts about this document..."
              rows={3}
              maxLength={4000}
            />
            <div className="flex justify-end">
              <Button
                disabled={posting || !body.trim()}
                onClick={async () => {
                  const ok = await post(body, null);
                  if (ok) setBody("");
                }}
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post comment"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Comments are currently read-only. Only moderators can reply.
          </p>
        )}

        <div className="mt-2">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : topLevel.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Be the first to comment.</p>
          ) : (
            topLevel.map((c) => renderOne(c))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
