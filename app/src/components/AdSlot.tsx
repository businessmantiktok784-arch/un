import { useEffect, useRef } from "react";

/**
 * Google AdSense slot.
 *
 * Setup:
 * 1. Get your Publisher ID from https://www.google.com/adsense (e.g. ca-pub-XXXXXXXXXXXXXXXX)
 * 2. Set VITE_ADSENSE_CLIENT in your env to that ID.
 * 3. Create ad units in AdSense → Ads → By ad unit, copy each slot ID.
 * 4. Pass the slot id via the `slot` prop. While VITE_ADSENSE_CLIENT is empty,
 *    a soft "Ad space" placeholder is shown so the layout is preserved.
 */
interface AdSlotProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  layout?: string;
  className?: string;
  /** Min height in px so layout doesn't jump while ad loads. */
  minHeight?: number;
}

const CLIENT_ID = (import.meta.env.VITE_ADSENSE_CLIENT as string | undefined) || "";

let scriptInjected = false;
function ensureAdsenseScript() {
  if (scriptInjected || !CLIENT_ID || typeof document === "undefined") return;
  scriptInjected = true;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`;
  document.head.appendChild(s);
}

export default function AdSlot({ slot, format = "auto", layout, className = "", minHeight = 120 }: AdSlotProps) {
  const ref = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    ensureAdsenseScript();
    try {
      // @ts-expect-error adsbygoogle is injected globally by AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* AdSense will retry on next render */
    }
  }, [slot]);

  if (!CLIENT_ID) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed bg-muted/30 text-xs text-muted-foreground ${className}`}
        style={{ minHeight }}
        aria-hidden="true"
      >
        Ad space
      </div>
    );
  }

  return (
    <ins
      ref={ref}
      className={`adsbygoogle block ${className}`}
      style={{ display: "block", minHeight }}
      data-ad-client={CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-ad-layout={layout}
      data-full-width-responsive="true"
    />
  );
}
