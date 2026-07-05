import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { History, Trash2, ArrowRight, FileText } from "lucide-react";
import { useHistory } from "@/lib/localStore";
import { useSEO } from "@/lib/useSEO";
import { motion } from "framer-motion";

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function HistoryPage() {
  useSEO({
    title: "Recently Viewed",
    description: "Documents you've opened recently. Stored in this browser — no account needed.",
  });
  const { history, remove, clear } = useHistory();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Breadcrumbs />
      <div className="container max-w-3xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl flex items-center gap-2">
              <History className="h-7 w-7 text-primary" /> Recently viewed
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Last {history.length} documents you opened (max 200, this browser only).
            </p>
          </div>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clear} className="gap-1.5">
              <Trash2 className="h-4 w-4" /> Clear history
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <History className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 font-medium text-foreground">No history yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Documents you open will show up here so you can return to them without searching again.
            </p>
            <Link to="/browse" className="mt-5">
              <Button>Browse documents</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-2">
            {history.map((h, i) => (
              <motion.div
                key={h.id + h.viewedAt}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 20) * 0.02 }}
                className="group flex items-center gap-3 rounded-xl border bg-card p-3.5 hover:shadow-soft"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <Link to={`/document/${h.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm group-hover:text-primary">
                    {h.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[h.course, h.university, h.type].filter(Boolean).join(" · ")} · {timeAgo(h.viewedAt)}
                  </p>
                </Link>
                <button
                  onClick={() => remove(h.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove from history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link to={`/document/${h.id}`} className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
