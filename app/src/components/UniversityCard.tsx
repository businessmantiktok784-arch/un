import { GraduationCap, FileText, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface UniversityCardProps {
  id?: string;
  name: string;
  abbr: string;
  campuses: string[];
  docs: number;
  index?: number;
}

export default function UniversityCard({ id, name, abbr, campuses, docs, index = 0 }: UniversityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link
        to={`/university/${abbr.toLowerCase()}`}
        className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-soft transition-all hover:shadow-elevated hover:-translate-y-0.5"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-lg font-bold text-primary">
          {abbr.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm font-semibold text-foreground truncate">{name}</h3>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {campuses.length} campus{campuses.length > 1 ? "es" : ""}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {docs.toLocaleString()} docs
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
