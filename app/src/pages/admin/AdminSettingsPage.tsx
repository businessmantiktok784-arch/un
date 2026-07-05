import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useLiveData";
import { logAdminAction } from "@/lib/adminUtils";

export default function AdminSettingsPage() {
  const { siteSettings, loading: initialLoading } = useSiteSettings();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: "UniHub",
    supportEmail: "support@unihub.app",
    autoApprove: false,
    emailNotifications: true,
    maintenanceMode: false,
    playStoreUrl: "",
    appStoreUrl: "",
    playStoreEnabled: false,
    appStoreEnabled: false,
  });

  useEffect(() => {
    if (siteSettings.platform_name !== null) {
      setSettings({
        platformName: siteSettings.platform_name ?? "UniHub",
        supportEmail: siteSettings.support_email ?? "support@unihub.app",
        autoApprove: siteSettings.auto_approve,
        emailNotifications: siteSettings.email_notifications,
        maintenanceMode: siteSettings.maintenance_mode,
        playStoreUrl: siteSettings.play_store_url ?? "",
        appStoreUrl: siteSettings.app_store_url ?? "",
        playStoreEnabled: siteSettings.play_store_enabled,
        appStoreEnabled: siteSettings.app_store_enabled,
      });
    }
  }, [siteSettings]);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: existing } = await supabase.from("site_settings").select("id").maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase.from("site_settings").update({
        platform_name: settings.platformName,
        support_email: settings.supportEmail,
        auto_approve: settings.autoApprove,
        email_notifications: settings.emailNotifications,
        maintenance_mode: settings.maintenanceMode,
        play_store_url: settings.playStoreUrl || null,
        app_store_url: settings.appStoreUrl || null,
        play_store_enabled: settings.playStoreEnabled,
        app_store_enabled: settings.appStoreEnabled,
        updated_by: user.id,
      }).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("site_settings").insert({
        platform_name: settings.platformName,
        support_email: settings.supportEmail,
        auto_approve: settings.autoApprove,
        email_notifications: settings.emailNotifications,
        maintenance_mode: settings.maintenanceMode,
        play_store_url: settings.playStoreUrl || null,
        app_store_url: settings.appStoreUrl || null,
        play_store_enabled: settings.playStoreEnabled,
        app_store_enabled: settings.appStoreEnabled,
        updated_by: user.id,
      }));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Settings saved", description: "Your changes have been applied." });
    logAdminAction("update_site_settings");
  };

  if (initialLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-muted-foreground">Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="mt-1 text-muted-foreground">Platform configuration and preferences</p>
      </div>

      <Card>
        <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input value={settings.platformName} onChange={(e) => setSettings(s => ({ ...s, platformName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input value={settings.supportEmail} onChange={(e) => setSettings(s => ({ ...s, supportEmail: e.target.value }))} />
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-approve uploads</p>
                <p className="text-xs text-muted-foreground">Automatically approve documents from trusted uploaders</p>
              </div>
              <Switch checked={settings.autoApprove} onCheckedChange={(v) => setSettings(s => ({ ...s, autoApprove: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email notifications</p>
                <p className="text-xs text-muted-foreground">Send email alerts for flagged content</p>
              </div>
              <Switch checked={settings.emailNotifications} onCheckedChange={(v) => setSettings(s => ({ ...s, emailNotifications: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Maintenance mode</p>
                <p className="text-xs text-muted-foreground">Temporarily disable the platform for maintenance</p>
              </div>
              <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => setSettings(s => ({ ...s, maintenanceMode: v }))} />
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2"><Smartphone className="h-4 w-4" /> Mobile App Stores</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> Google Play Store URL</Label>
                <Input placeholder="https://play.google.com/store/apps/details?id=com.unihub.app" value={settings.playStoreUrl} onChange={(e) => setSettings(s => ({ ...s, playStoreUrl: e.target.value }))} />
                <div className="flex items-center gap-2 mt-2">
                  <Switch checked={settings.playStoreEnabled} onCheckedChange={(v) => setSettings(s => ({ ...s, playStoreEnabled: v }))} id="play-store" />
                  <Label htmlFor="play-store" className="text-xs cursor-pointer">Show on website</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> Apple App Store URL</Label>
                <Input placeholder="https://apps.apple.com/app/unihub/id1234567890" value={settings.appStoreUrl} onChange={(e) => setSettings(s => ({ ...s, appStoreUrl: e.target.value }))} />
                <div className="flex items-center gap-2 mt-2">
                  <Switch checked={settings.appStoreEnabled} onCheckedChange={(v) => setSettings(s => ({ ...s, appStoreEnabled: v }))} id="app-store" />
                  <Label htmlFor="app-store" className="text-xs cursor-pointer">Show on website</Label>
                </div>
              </div>
            </div>
          </div>
          <Separator />
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
