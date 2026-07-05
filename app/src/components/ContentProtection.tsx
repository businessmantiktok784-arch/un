import { useEffect } from "react";

/**
 * Prevents text selection, right-click, and screenshot shortcuts on protected pages.
 * Wrap around content that should be protected.
 */
export default function ContentProtection({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const preventContext = (e: MouseEvent) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      // Block PrintScreen, Ctrl+P, Ctrl+S, Ctrl+Shift+S, Ctrl+C
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && ["p", "s", "c", "u"].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ["i", "s", "c"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("contextmenu", preventContext);
    document.addEventListener("keydown", preventKeys);
    return () => {
      document.removeEventListener("contextmenu", preventContext);
      document.removeEventListener("keydown", preventKeys);
    };
  }, []);

  return (
    <div
      className="select-none"
      style={{ WebkitUserSelect: "none", MozUserSelect: "none" } as React.CSSProperties}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
