import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2, ArrowRight, FileText } from "lucide-react";
import { useBookmarks } from "@/lib/localStore";
import { useSEO } from "@/lib/useSEO";
import { motion } from "framer-motion";

export default function BookmarksPage() {
  useSEO({
    title: "Saved Documents",
    description: "Your bookmarked study documents — saved in this browser, no account needed.",
  });
  const { bookmarks, remove, clear } = useBookmarks();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Breadcrumbs />
      <div className="container max-w-3xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl flex items-center gap-2">
              <Bookmark className="h-7 w-7 text-primary" /> Saved
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stored in this browser only. {bookmarks.length} saved.
            </p>
          </div>
          {bookmarks.length > 0 && (
            <Button variant="outline" size="sm" onClick={clear} className="gap-1.5">
              <Trash2 className="h-4 w-4" /> Clear all
            </Button>
          )}
        </div>

        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <Bookmark className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 font-medium text-foreground">No saved documents yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Tap the bookmark icon on any document to save it here for quick access later.
            </p>
            <Link to="/browse" className="mt-5">
              <Button>Browse documents</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {bookmarks.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-soft"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <Link to={`/document/${b.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate group-hover:text-primary">
                    {b.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[b.course, b.university, b.type].filter(Boolean).join(" · ")}
                  </p>
                </Link>
                <button
                  onClick={() => remove(b.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove bookmark"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link to={`/document/${b.id}`} className="hidden sm:inline-flex">
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
