import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cookie, X, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { getConsent, setConsent, hasMadeChoice, type ConsentState } from "@/lib/cookieConsent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [state, setState] = useState<ConsentState>(getConsent());

  useEffect(() => {
    if (!hasMadeChoice()) {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (next: ConsentState) => {
    setConsent(next);
    setState(next);
    setVisible(false);
    setShowPrefs(false);
  };

  const acceptAll = () => save({ essential: true, analytics: true, marketing: true });
  const essentialOnly = () => save({ essential: true, analytics: false, marketing: false });
  const saveCustom = () => save(state);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-4 left-4 right-4 z-[200] mx-auto max-w-lg rounded-xl border bg-card p-4 shadow-elevated sm:left-4 sm:right-auto sm:bottom-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Cookie className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">We use cookies</p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                We use essential cookies to run the platform. With your consent, we also use analytics and marketing cookies.{" "}
                <Link to="/privacy" className="text-primary hover:underline">Learn more</Link>
              </p>

              {showPrefs && (
                <div className="mt-3 space-y-2 rounded-lg border bg-background/60 p-3">
                  <Row label="Essential" desc="Authentication and security. Always on." checked disabled />
                  <Row
                    label="Analytics"
                    desc="Anonymous usage stats to improve the platform."
                    checked={state.analytics}
                    onChange={(v) => setState({ ...state, analytics: v })}
                  />
                  <Row
                    label="Marketing"
                    desc="Personalised content and campaign measurement."
                    checked={state.marketing}
                    onChange={(v) => setState({ ...state, marketing: v })}
                  />
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {showPrefs ? (
                  <>
                    <Button size="sm" onClick={saveCustom} className="h-8 text-xs">Save preferences</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowPrefs(false)} className="h-8 text-xs">Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" onClick={acceptAll} className="h-8 text-xs">Accept All</Button>
                    <Button size="sm" variant="outline" onClick={essentialOnly} className="h-8 text-xs">Essential Only</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowPrefs(true)} className="h-8 gap-1 text-xs">
                      <Settings2 className="h-3 w-3" /> Customize
                    </Button>
                  </>
                )}
              </div>
            </div>
            <button onClick={essentialOnly} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={(v) => onChange?.(!!v)} />
    </div>
  );
}
