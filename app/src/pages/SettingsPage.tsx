import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, BellRing, MessagesSquare, Briefcase } from "lucide-react";
import { useSEO } from "@/lib/useSEO";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [opportunities, setOpportunities] = useState(false);
  const [docReplies, setDocReplies] = useState(false);
  const [university, setUniversity] = useState("");

  useSEO({ title: "Settings", description: "Manage notifications and your account." });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { navigate("/login", { replace: true }); return; }
      setUserId(data.user.id);
      setEmail(data.user.email || "");
      const [{ data: subs }, { data: profile }] = await Promise.all([
        supabase.from("notification_subscriptions").select("*").eq("user_id", data.user.id).maybeSingle(),
        supabase.from("profiles").select("university").eq("id", data.user.id).maybeSingle(),
      ]);
      setOpportunities(!!subs?.opportunities);
      setDocReplies(!!subs?.document_replies);
      setUniversity(profile?.university || "");
      setLoading(false);
    })();
  }, [navigate]);

  const save = async (opp: boolean, rep: boolean) => {
    if (!userId) return;
    setOpportunities(opp);
    setDocReplies(rep);
    const { error } = await supabase.from("notification_subscriptions").upsert({
      user_id: userId,
      opportunities: opp,
      document_replies: rep,
    });
    if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Breadcrumbs />
      <div className="container max-w-2xl py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">{email}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><BellRing className="h-5 w-5 text-primary" /> Notifications</CardTitle>
                <CardDescription>Choose what we should ping you about.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <Label className="flex items-center gap-2 font-medium"><MessagesSquare className="h-4 w-4" /> Requests at {university || "your university"}</Label>
                    <p className="text-xs text-muted-foreground mt-1">Auto-on. Get notified when students at your university ask for materials.</p>
                  </div>
                  <Switch checked disabled aria-label="University requests (always on)" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <Label className="flex items-center gap-2 font-medium"><Briefcase className="h-4 w-4" /> Opportunities</Label>
                    <p className="text-xs text-muted-foreground mt-1">Internships, jobs and scholarships posted on UniHub.</p>
                  </div>
                  <Switch checked={opportunities} onCheckedChange={(v) => save(v, docReplies)} />
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <Label className="font-medium">Replies on your documents</Label>
                    <p className="text-xs text-muted-foreground mt-1">When someone comments on something you uploaded.</p>
                  </div>
                  <Switch checked={docReplies} onCheckedChange={(v) => save(opportunities, v)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium">Sign out</p>
                  <p className="text-xs text-muted-foreground">You'll need to sign in with Google again.</p>
                </div>
                <Button variant="outline" onClick={signOut} className="gap-2">
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
