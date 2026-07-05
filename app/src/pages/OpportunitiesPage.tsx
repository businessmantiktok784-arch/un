import { useSEO } from "@/lib/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Clock, ExternalLink, Search, Bell, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOpportunities } from "@/hooks/useLiveData";
import { supabase } from "@/integrations/supabase/client";

const typeColors: Record<string, string> = {
  Internship: "bg-primary/10 text-primary",
  "Full-time": "bg-secondary text-secondary-foreground",
  Traineeship: "bg-accent/20 text-accent-foreground",
};

export default function OpportunitiesPage() {
  useSEO({ title: "Internships & Jobs in Rwanda", description: "Browse internships, graduate jobs, and career opportunities for university students." });
  const { opportunities, loading } = useOpportunities();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [subscribed, setSubscribed] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const fields = [...new Set(opportunities.map(o => o.category).filter(Boolean))] as string[];
  const types = [...new Set(opportunities.map(o => o.type).filter(Boolean))] as string[];

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notification_subscriptions")
        .select("opportunities")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setSubscribed(data.opportunities);
    })();
  }, []);

  const filtered = opportunities
    .filter((o) => selectedField === "all" || o.category === selectedField)
    .filter((o) => selectedType === "all" || o.type === selectedType)
    .filter((o) => !searchQuery || o.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSubscribe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to subscribe to alerts." });
      return;
    }
    const next = !subscribed;
    await supabase
      .from("notification_subscriptions")
      .upsert({ user_id: user.id, opportunities: next }, { onConflict: "user_id" });
    setSubscribed(next);
    toast({ title: next ? "Subscribed!" : "Unsubscribed", description: next ? "You'll receive notifications for new opportunities." : "You won't receive job alerts." });
  };

  const handleApply = (opp: { id: string; link: string | null }) => {
    setApplied((prev) => new Set(prev).add(opp.id));
    toast({ title: "Redirecting to application!", description: `Opening career page...` });
    if (opp.link) window.open(opp.link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Opportunities</h1>
            <p className="mt-1 text-muted-foreground">Internships, jobs, and traineeships for students</p>
          </div>
          <Button variant={subscribed ? "secondary" : "outline"} className="gap-2 shrink-0" onClick={handleSubscribe}>
            <Bell className={`h-4 w-4 ${subscribed ? "fill-current" : ""}`} />
            {subscribed ? "Subscribed to Alerts" : "Subscribe to Alerts"}
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by title or company..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={selectedField} onValueChange={setSelectedField}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Field" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              {fields.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="mt-8 space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {filtered.map((opp, i) => (
              <motion.div key={opp.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="group rounded-xl border bg-card p-5 shadow-soft transition-all hover:shadow-elevated">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-lg font-semibold text-foreground">{opp.title}</h3>
                      {opp.type && <Badge variant="secondary" className={typeColors[opp.type] || ""}>{opp.type}</Badge>}
                      {opp.category && <Badge variant="outline" className="text-xs">{opp.category}</Badge>}
                      {opp.featured && (
                        <Badge className="text-xs gap-1 bg-amber-100 text-amber-700 border border-amber-200">
                          <Sparkles className="h-3 w-3" /> Featured
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">{opp.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {opp.country && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{opp.country}</span>}
                      {opp.deadline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  {applied.has(opp.id) ? (
                    <Button variant="secondary" size="sm" className="gap-1.5 shrink-0" disabled>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => handleApply(opp)}>
                      Apply <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">No opportunities found. Try different filters.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
