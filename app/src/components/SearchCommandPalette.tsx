import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileText, GraduationCap, Briefcase, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const pages = [
  { label: "Browse Documents", href: "/browse", icon: FileText },
  { label: "Opportunities", href: "/opportunities", icon: Briefcase },
  { label: "Document Requests", href: "/requests", icon: Search },
];

interface CourseSuggestion {
  course_code: string;
  title: string;
}

export default function SearchCommandPalette() {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<CourseSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch courses from Supabase when the dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("courses")
        .select("course_code, title")
        .order("title")
        .limit(20);
      if (!cancelled) {
        setCourses((data ?? []) as CourseSuggestion[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="pointer-events-none ml-2 inline-flex h-5 items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, courses, tools..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((p) => (
              <CommandItem key={p.href} onSelect={() => go(p.href)}>
                <p.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {p.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Popular Courses">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              courses.map((c) => (
                <CommandItem
                  key={c.course_code}
                  onSelect={() => go(/browse?course=)}
                >
                  <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                  {c.course_code} – {c.title}
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
