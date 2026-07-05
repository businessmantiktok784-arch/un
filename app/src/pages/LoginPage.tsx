import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/lib/useSEO";
import { checkRateLimit } from "@/lib/security";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-2 13.3-5.2l-6.1-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.1 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.4-.4-3.5z"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bootChecking, setBootChecking] = useState(true);
  const redirectTo = (location.state as any)?.from || "/";

  useSEO({ title: "Sign In", description: "Sign in with Google to access UniHub — your academic resource platform." });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) { setBootChecking(false); return; }
      try { await supabase.rpc("sync_admin_role"); } catch { /* ignore */ }
      const [{ data: profile }, { data: roleRow }] = await Promise.all([
        supabase.from("profiles").select("year_of_study").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["super_admin","org_admin","manager","staff","moderator"]).maybeSingle(),
      ]);
      if (cancelled) return;
      if (roleRow) { navigate("/admin", { replace: true }); return; }
      if (!profile?.year_of_study) { navigate("/onboarding", { replace: true }); return; }
      navigate(redirectTo, { replace: true });
    })();
    return () => { cancelled = true; };
  }, [navigate, redirectTo]);

  const handleGoogle = async () => {
    // Rate limiting
    const rateLimit = checkRateLimit(`login:${window.location.hostname}`);
    if (!rateLimit.allowed) {
      toast({ title: "Too many attempts", description: `Please try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/login",
        },
      });
      if (error) {
        toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      setBootChecking(true);
    } catch (e: any) {
      toast({ title: "Sign-in failed", description: e?.message || "Try again.", variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/" className="mb-8 flex flex-col items-center group">
          <span className="font-display text-2xl font-bold text-foreground leading-none">
            UniHub
          </span>
          <span className="mt-0.5 h-0.5 w-8 bg-primary rounded-full" />
        </Link>
        <Card className="border-0 shadow-elevated rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="font-display text-2xl text-center">Welcome back</CardTitle>
            <CardDescription>
              Sign in to access your bookmarks, history, and upload content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-3 rounded-2xl h-12"
              onClick={handleGoogle}
              disabled={loading || bootChecking}
            >
              {loading || bootChecking ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Link to="/">
              <Button variant="ghost" className="w-full rounded-2xl gap-2">
                <ArrowLeft className="h-4 w-4" /> Continue as Guest
              </Button>
            </Link>

            <p className="text-center text-xs text-muted-foreground pt-2">
              By continuing you agree to our <Link to="/terms" className="underline hover:text-foreground transition-colors">Terms</Link> and{" "}
              <Link to="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
