// Centralised cookie consent gating
export type ConsentCategory = "essential" | "analytics" | "marketing";
export type ConsentState = Record<ConsentCategory, boolean>;

const STORAGE_KEY = "unihub_cookie_consent_v2";
const LEGACY_KEY = "unihub_cookies_accepted";

const DEFAULTS: ConsentState = { essential: true, analytics: false, marketing: false };

export function getConsent(): ConsentState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ConsentState>;
      return { ...DEFAULTS, ...parsed, essential: true };
    }
    // migrate legacy
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === "true") return { essential: true, analytics: true, marketing: true };
    if (legacy === "essential") return { ...DEFAULTS };
  } catch {
    // ignore
  }
  return DEFAULTS;
}

export function setConsent(state: ConsentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, essential: true }));
    window.dispatchEvent(new CustomEvent("unihub:consent-changed", { detail: state }));
  } catch {
    // ignore
  }
}

export function hasConsent(category: ConsentCategory): boolean {
  return getConsent()[category];
}

export function hasMadeChoice(): boolean {
  if (typeof window === "undefined") return true;
  return !!localStorage.getItem(STORAGE_KEY) || !!localStorage.getItem(LEGACY_KEY);
}
