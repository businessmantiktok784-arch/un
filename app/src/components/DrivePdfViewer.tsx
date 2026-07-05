import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Printer,
  Menu, Loader2, Maximize2,
} from "lucide-react";
// Load the worker as a Vite asset URL — keeps everything self-hosted.
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Props {
  src: string;            // signed URL or public URL to the PDF
  title?: string;
  onDownload?: () => void;
}

export default function DrivePdfViewer({ src, title, onDownload }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pagesRef = useRef<Record<number, HTMLDivElement | null>>({});

  // Memoize options/file so react-pdf doesn't reload on every render.
  const file = useMemo(() => ({ url: src }), [src]);
  const options = useMemo(() => ({
    cMapUrl: "https://unpkg.com/pdfjs-dist@6.0.227/cmaps/",
    cMapPacked: true,
  }), []);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 32);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Track which page is in view for the "page X of Y" indicator.
  useEffect(() => {
    if (!numPages) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const p = Number((visible.target as HTMLDivElement).dataset.page);
          if (p) setCurrentPage(p);
        }
      },
      { threshold: [0.25, 0.5, 0.75], root: containerRef.current }
    );
    Object.values(pagesRef.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [numPages]);

  const goToPage = (p: number) => {
    const el = pagesRef.current[p];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const zoomIn = () => setScale((s) => Math.min(3, s + 0.2));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.2));
  const fitWidth = () => setScale(1.1);
  const handlePrint = () => {
    const w = window.open(src, "_blank", "noopener,noreferrer");
    if (w) setTimeout(() => { try { w.print(); } catch { /* ignore */ } }, 700);
  };

  const Thumbs = (
    <div className="h-full overflow-y-auto bg-muted/30 p-3 space-y-3">
      {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => goToPage(p)}
          className={`block w-full rounded-md border-2 overflow-hidden transition-all ${
            currentPage === p ? "border-primary" : "border-transparent hover:border-border"
          }`}
        >
          <Page pageNumber={p} width={140} renderAnnotationLayer={false} renderTextLayer={false} />
          <div className="text-center text-xs py-1 bg-card text-muted-foreground">{p}</div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-[85vh] bg-card rounded-lg border overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-1 px-2 sm:px-3 h-12 border-b bg-card">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="lg:hidden gap-1" aria-label="Pages">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0">{Thumbs}</SheetContent>
        </Sheet>

        <div className="hidden sm:block truncate text-sm font-medium text-foreground flex-1 min-w-0 px-2" title={title}>
          {title}
        </div>
        <div className="flex-1 sm:hidden" />

        <div className="flex items-center gap-0.5 text-sm text-muted-foreground">
          <Button variant="ghost" size="icon" onClick={() => goToPage(Math.max(1, currentPage - 1))} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="tabular-nums px-1">{currentPage}/{numPages || "—"}</span>
          <Button variant="ghost" size="icon" onClick={() => goToPage(Math.min(numPages, currentPage + 1))} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden md:flex items-center gap-0.5 ml-2 border-l pl-2">
          <Button variant="ghost" size="icon" onClick={zoomOut} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs tabular-nums w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={zoomIn} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={fitWidth} aria-label="Fit width"><Maximize2 className="h-4 w-4" /></Button>
        </div>

        <div className="flex items-center gap-0.5 ml-2 border-l pl-2">
          <Button variant="ghost" size="icon" onClick={handlePrint} aria-label="Print"><Printer className="h-4 w-4" /></Button>
          {onDownload && (
            <Button variant="ghost" size="icon" onClick={onDownload} aria-label="Download"><Download className="h-4 w-4" /></Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:block w-44 border-r">{Thumbs}</aside>
        <div ref={containerRef} className="flex-1 overflow-y-auto bg-muted/40">
          <Document
            file={file}
            options={options}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div className="flex items-center justify-center h-full p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
            error={<div className="p-10 text-center text-sm text-muted-foreground">Could not load the PDF.</div>}
          >
            <div className="flex flex-col items-center gap-4 py-4">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
                <div
                  key={p}
                  data-page={p}
                  ref={(el) => { pagesRef.current[p] = el; }}
                  className="shadow-md bg-white"
                >
                  <Page
                    pageNumber={p}
                    width={containerWidth ? containerWidth * scale : undefined}
                    renderAnnotationLayer={false}
                  />
                </div>
              ))}
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
}
