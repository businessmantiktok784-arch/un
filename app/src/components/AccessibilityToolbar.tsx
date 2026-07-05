import { useState, useEffect, useCallback } from "react";
import { Accessibility, Plus, Minus, Type, Moon, Sun, RotateCcw, Eye, X, Contrast, MousePointer2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const FONT_SIZES = [87.5, 100, 112.5, 125, 150];
const DEFAULT_INDEX = 1;
const STORAGE_KEY = "a11y-prefs";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch { return null; }
}

function savePrefs(prefs: Record<string, unknown>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* noop */ }
}

export default function AccessibilityToolbar() {
  const saved = loadPrefs();
  const [open, setOpen] = useState(false);
  const [fontIndex, setFontIndex] = useState<number>((saved?.fontIndex as number) ?? DEFAULT_INDEX);
  const [highContrast, setHighContrast] = useState<boolean>((saved?.highContrast as boolean) ?? false);
  const [bigCursor, setBigCursor] = useState<boolean>((saved?.bigCursor as boolean) ?? false);
  const [readingGuide, setReadingGuide] = useState<boolean>((saved?.readingGuide as boolean) ?? false);
  const [desaturate, setDesaturate] = useState<boolean>((saved?.desaturate as boolean) ?? false);

  useEffect(() => {
    savePrefs({ fontIndex, highContrast, bigCursor, readingGuide, desaturate });
  }, [fontIndex, highContrast, bigCursor, readingGuide, desaturate]);

  // Apply font size
  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_SIZES[fontIndex]}%`;
    return () => { document.documentElement.style.fontSize = ""; };
  }, [fontIndex]);

  // Apply high contrast
  useEffect(() => {
    document.documentElement.classList.toggle("a11y-high-contrast", highContrast);
  }, [highContrast]);

  // Apply big cursor
  useEffect(() => {
    document.documentElement.classList.toggle("a11y-big-cursor", bigCursor);
  }, [bigCursor]);

  // Apply desaturate
  useEffect(() => {
    document.documentElement.classList.toggle("a11y-desaturate", desaturate);
  }, [desaturate]);

  // Reading guide (follows mouse)
  useEffect(() => {
    if (!readingGuide) return;
    const guide = document.createElement("div");
    guide.id = "a11y-reading-guide";
    Object.assign(guide.style, {
      position: "fixed",
      left: "0",
      right: "0",
      height: "40px",
      borderTop: "2px solid hsl(var(--primary) / 0.4)",
      borderBottom: "2px solid hsl(var(--primary) / 0.4)",
      background: "hsl(var(--primary) / 0.05)",
      pointerEvents: "none",
      zIndex: "9999",
      top: "50%",
      willChange: "transform",
    });
    document.body.appendChild(guide);
    let rafId: number;
    const move = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        guide.style.transform = `translateY(${e.clientY - window.innerHeight / 2 - 20}px)`;
      });
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", move);
      guide.remove();
    };
  }, [readingGuide]);

  const reset = useCallback(() => {
    setFontIndex(DEFAULT_INDEX);
    setHighContrast(false);
    setBigCursor(false);
    setReadingGuide(false);
    setDesaturate(false);
  }, []);

  const increase = () => setFontIndex((i) => Math.min(i + 1, FONT_SIZES.length - 1));
  const decrease = () => setFontIndex((i) => Math.max(i - 1, 0));

  const tools = [
    { label: "Increase Text", icon: Plus, action: increase, active: fontIndex > DEFAULT_INDEX },
    { label: "Decrease Text", icon: Minus, action: decrease, active: fontIndex < DEFAULT_INDEX },
    { label: "High Contrast", icon: Contrast, action: () => setHighContrast(!highContrast), active: highContrast },
    { label: "Desaturate", icon: Eye, action: () => setDesaturate(!desaturate), active: desaturate },
    { label: "Big Cursor", icon: MousePointer2, action: () => setBigCursor(!bigCursor), active: bigCursor },
    { label: "Reading Guide", icon: BookOpen, action: () => setReadingGuide(!readingGuide), active: readingGuide },
    { label: "Reset All", icon: RotateCcw, action: reset, active: false },
  ];

  const hasChanges = fontIndex !== DEFAULT_INDEX || highContrast || bigCursor || readingGuide || desaturate;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed right-4 top-1/2 -translate-y-1/2 z-[100] flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          "bg-primary text-primary-foreground hover:scale-110",
          hasChanges && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
          open && "rotate-12"
        )}
        aria-label="Accessibility options"
      >
        <Accessibility className="h-5 w-5" />
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed right-4 top-1/2 z-[100] w-56 -translate-y-1/2 rounded-xl border bg-card shadow-2xl transition-all duration-300 origin-right",
          open ? "scale-100 opacity-100 translate-x-0 mr-14" : "scale-90 opacity-0 pointer-events-none translate-x-4"
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Accessibility</span>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 border-b px-4 py-2">
          <span className="text-xs text-muted-foreground mr-auto">Text Size</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={decrease} disabled={fontIndex === 0}>
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-10 text-center text-xs font-medium text-foreground">{FONT_SIZES[fontIndex]}%</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={increase} disabled={fontIndex === FONT_SIZES.length - 1}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-0.5 p-2">
          {tools.slice(2).map((tool) => (
            <button
              key={tool.label}
              onClick={tool.action}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                tool.active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tool.icon className="h-4 w-4 shrink-0" />
              {tool.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
