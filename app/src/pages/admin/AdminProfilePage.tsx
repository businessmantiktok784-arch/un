import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminProfilePage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", data.user.id).maybeSingle();
      setFullName(p?.full_name ?? "");
      setAvatar(p?.avatar_url ?? "");
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").update({ full_name: fullName, avatar_url: avatar }).eq("id", u.user.id);
    setSaving(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Profile updated" });
  };

  const signOutEverywhere = async () => {
    await supabase.auth.signOut({ scope: "global" });
    toast({ title: "Signed out everywhere" });
    nav("/login");
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin Profile</h1>
        <p className="mt-1 text-muted-foreground">Your account details</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Email (from Google)</Label><Input value={email} disabled /></div>
          <div><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>Avatar URL</Label><Input value={avatar} onChange={(e) => setAvatar(e.target.value)} /></div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Security</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Google handles your password. To reset it, change your Google account password directly.</p>
          <Button variant="destructive" onClick={signOutEverywhere}><LogOut className="h-4 w-4 mr-2" /> Sign out on all devices</Button>
        </CardContent>
      </Card>
    </div>
  );
}
