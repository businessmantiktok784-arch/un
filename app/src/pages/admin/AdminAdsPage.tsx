import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Eye, MousePointer, TrendingUp, Plus, Image, Settings, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

// Placeholder for Google Ads integration
// This page is designed to support future Google Ads integration

export default function AdminAdsPage() {
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [googleAdsConnected, setGoogleAdsConnected] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-3xl font-bold">Ad Manager</h1>
          <Badge variant="secondary" className="rounded-lg text-[10px] uppercase tracking-wider">Coming Soon</Badge>
        </div>
        <p className="text-muted-foreground">Manage advertising across the platform. Google Ads integration ready.</p>
      </div>

      {/* Enable Ads Toggle */}
      <Card className="rounded-2xl shadow-soft border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Enable Advertising</p>
                <p className="text-xs text-muted-foreground">Show ads across the platform</p>
              </div>
            </div>
            <Switch checked={adsEnabled} onCheckedChange={setAdsEnabled} />
          </div>
        </CardContent>
      </Card>

      {adsEnabled && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Connection Status */}
          <Card className="rounded-2xl shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Megaphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Google AdSense</p>
                    <p className="text-xs text-muted-foreground">
                      {googleAdsConnected ? "Connected and serving ads" : "Connect your Google AdSense account"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={googleAdsConnected ? "outline" : "default"}
                  onClick={() => setGoogleAdsConnected(!googleAdsConnected)}
                  className="rounded-xl"
                >
                  {googleAdsConnected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Impressions", value: "—", icon: Eye, desc: "Last 30 days" },
              { label: "Clicks", value: "—", icon: MousePointer, desc: "Last 30 days" },
              { label: "CTR", value: "—", icon: TrendingUp, desc: "Click-through rate" },
              { label: "Revenue", value: "—", icon: BarChart3, desc: "Estimated earnings" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="rounded-2xl shadow-soft">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <stat.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">{stat.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Ad Placements */}
          <Tabs defaultValue="placements" className="space-y-4">
            <TabsList className="rounded-xl">
              <TabsTrigger value="placements" className="rounded-lg">Placements</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg">Settings</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="placements" className="space-y-4">
              <Card className="rounded-2xl shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Ad Placements</CardTitle>
                  <CardDescription>Configure where ads appear on the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Homepage Banner", location: "Top of homepage", type: "Banner", enabled: true },
                    { name: "Sidebar Ad", location: "Document detail sidebar", type: "Display", enabled: true },
                    { name: "Search Results", location: "Between search results", type: "Native", enabled: false },
                    { name: "Mobile Interstitial", location: "Full-screen mobile ad", type: "Interstitial", enabled: false },
                  ].map((placement, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{placement.name}</p>
                          <p className="text-xs text-muted-foreground">{placement.location} · {placement.type}</p>
                        </div>
                      </div>
                      <Switch defaultChecked={placement.enabled} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="rounded-2xl shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Ad Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium">Google AdSense Publisher ID</Label>
                    <Input placeholder="pub-xxxxxxxxxxxxxxxx" className="mt-1 rounded-xl" />
                    <p className="text-xs text-muted-foreground mt-1">Your AdSense publisher ID</p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Ad Density</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">Low</span>
                      <input type="range" min="1" max="5" defaultValue="3" className="flex-1" />
                      <span className="text-xs text-muted-foreground">High</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card className="rounded-2xl shadow-soft">
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                  <p className="text-sm font-medium">Analytics will appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect Google AdSense to view detailed analytics</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {!adsEnabled && (
        <Card className="rounded-2xl shadow-soft border-dashed">
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-sm font-medium">Advertising is disabled</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Enable advertising to start monetizing the platform. Google AdSense integration is ready for future connection.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
