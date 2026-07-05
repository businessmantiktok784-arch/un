import { FileText, Download, Star, ArrowUpRight, Bookmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useBookmarks } from "@/lib/localStore";

interface DocumentCardProps {
  id?: string;
  title: string;
  course: string;
  university: string;
  type: string;
  downloads: number;
  rating: number;
  uploadedBy: string;
  date: string;
  index?: number;
}

const typeColors: Record<string, string> = {
  Exam: "bg-destructive/10 text-destructive",
  CAT: "bg-blue-100 text-blue-700",
  Assignment: "bg-accent/20 text-accent-foreground",
  Notes: "bg-primary/10 text-primary",
  "Lab Report": "bg-green-100 text-green-700",
  Project: "bg-amber-100 text-amber-700",
};

export default function DocumentCard({
  id, title, course, university, type, downloads, rating, uploadedBy, date, index = 0,
}: DocumentCardProps) {
  const { ids, toggle } = useBookmarks();
  const isBookmarked = id ? ids.includes(id) : false;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="group relative rounded-xl border bg-card p-5 shadow-soft transition-all hover:shadow-elevated hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          {id && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle({ id, title, course, university, type });
              }}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label={isBookmarked ? "Remove bookmark" : "Save bookmark"}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </button>
          )}
          <Badge variant="secondary" className={typeColors[type] || ""}>
            {type}
          </Badge>
        </div>
      </div>

      <h3 className="mt-3 font-display text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
        {title}
      </h3>

      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{course}</span>
        <span>·</span>
        <span>{university}</span>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {downloads.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {rating}
          </span>
        </div>
        <span className="text-xs">{uploadedBy}</span>
      </div>

      <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowUpRight className="h-4 w-4 text-primary" />
      </div>
    </motion.div>
  );

  if (id) {
    return <Link to={`/document/${id}`}>{content}</Link>;
  }

  return content;
}
