import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUniversities } from "@/hooks/useLiveData";
import { useSEO } from "@/lib/useSEO";
import { isAdminEmail } from "@/lib/adminEmails";
import { sanitizeInput } from "@/lib/security";

export default function OnboardingPage() {
  const { universities } = useUniversities();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [year, setYear] = useState<string>("");

  useSEO({ title: "Welcome — Tell us about you", description: "Quick setup so we can show you the right content." });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) { navigate("/login", { replace: true }); return; }
      setUserId(user.id);
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name || "");
      const { data: profile } = await supabase.from("profiles").select("year_of_study,university,program").eq("id", user.id).maybeSingle();
      if (profile?.year_of_study) {
        // already onboarded — bounce
        if (isAdminEmail(user.email)) { navigate("/admin", { replace: true }); return; }
        navigate("/", { replace: true });
        return;
      }
      setChecking(false);
    })();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!university || !program.trim() || !year) {
      toast({ title: "Fill all three fields", variant: "destructive" });
      return;
    }
    if (program.length > 100) {
      toast({ title: "Program name too long", description: "Maximum 100 characters.", variant: "destructive" });
      return;
    }
    if (fullName.length > 100) {
      toast({ title: "Name too long", description: "Maximum 100 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      university: sanitizeInput(university),
      program: sanitizeInput(program.trim()),
      year_of_study: Number(year),
      full_name: fullName ? sanitizeInput(fullName) : undefined,
    }).eq("id", userId);

    // default opt-in for university-request notifications happens automatically (driven by profile.university).
    // create empty subscriptions row so settings page works.
    await supabase.from("notification_subscriptions").upsert({
      user_id: userId,
      opportunities: false,
      document_replies: false,
    });

    // Sync admin role in case email matches
    try { await supabase.rpc("sync_admin_role"); } catch { /* ignore */ }
    const { data: { user } } = await supabase.auth.getUser();

    setLoading(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome to UniHub!" });
    if (user && isAdminEmail(user.email)) navigate("/admin", { replace: true });
    else navigate("/", { replace: true });
  };

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground leading-none">
            UniHub
          </span>
          <span className="mt-1 h-0.5 w-8 bg-primary rounded-full" />
        </div>
        <Card className="border-0 shadow-elevated">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Tell us about you</CardTitle>
            <CardDescription>Three quick details so we can match you with the right materials.</CardDescription>
          </CardHeader>
          <form onSubmit={submit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>University</Label>
                <Select value={university} onValueChange={setUniversity}>
                  <SelectTrigger><SelectValue placeholder="Select your university" /></SelectTrigger>
                  <SelectContent>
                    {universities.map((u) => (
                      <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="program">Program</Label>
                <Input id="program" value={program} onChange={(e) => setProgram(e.target.value)} placeholder="e.g. BSc Computer Science" />
              </div>
              <div className="space-y-2">
                <Label>Year of study</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((y) => (
                      <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
