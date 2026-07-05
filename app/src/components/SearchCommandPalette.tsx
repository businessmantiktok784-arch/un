import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileText, GraduationCap, Briefcase, Search } from "lucide-react";

const pages = [
  { label: "Browse Documents", href: "/browse", icon: FileText },
  { label: "Opportunities", href: "/opportunities", icon: Briefcase },
  { label: "Document Requests", href: "/requests", icon: Search },
];

const courses = [
  { label: "CSC 2103 – Data Structures", href: "/browse?course=CSC+2103" },
  { label: "CHM 2201 – Organic Chemistry II", href: "/browse?course=CHM+2201" },
  { label: "ACC 1101 – Financial Accounting", href: "/browse?course=ACC+1101" },
  { label: "MAT 1101 – Calculus I", href: "/browse?course=MAT+1101" },
  { label: "CS 6301 – Machine Learning", href: "/browse?course=CS+6301" },
];

export default function SearchCommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
            {courses.map((c) => (
              <CommandItem key={c.href} onSelect={() => go(c.href)}>
                <GraduationCap className="mr-2 h-4 w-4 text-muted-foreground" />
                {c.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
