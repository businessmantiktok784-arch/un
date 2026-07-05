import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Search, Users, FileText, Loader2, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { logAdminAction } from "@/lib/adminUtils";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "university" | "company" | "institution";
  country: string | null;
  city: string | null;
  website: string | null;
  logo_url: string | null;
  created_at: string;
  member_count?: number;
  document_count?: number;
}

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", type: "university" as const, country: "", city: "", website: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadOrgs(); const ch = supabase.channel("admin-orgs").on("postgres_changes", { event: "*", schema: "public", table: "universities" }, () => { loadOrgs(); }).subscribe(); return () => { supabase.removeChannel(ch); }; }, []);

  async function loadOrgs() {
    setLoading(true);
    try {
      // For now, map universities table to organizations view
      // In a full implementation, you'd have a separate organizations table
      const { data: universities } = await supabase
        .from("universities")
        .select("*")
        .order("name");

      if (universities) {
        // Get counts
        const { data: docs } = await supabase
          .from("documents")
          .select("university")
          .eq("status", "approved");

        const docCounts: Record<string, number> = {};
        docs?.forEach((d: any) => {
          docCounts[d.university] = (docCounts[d.university] ?? 0) + 1;
        });

        const { data: profiles } = await supabase
          .from("profiles")
          .select("university");

        const memberCounts: Record<string, number> = {};
        profiles?.forEach((p: any) => {
          if (p.university) {
            memberCounts[p.university] = (memberCounts[p.university] ?? 0) + 1;
          }
        });

        setOrgs(universities.map((u) => ({
          id: u.id,
          name: u.name,
          slug: u.abbr?.toLowerCase() ?? u.name.toLowerCase().replace(/\s+/g, "-"),
          description: u.description,
          type: "university" as const,
          country: u.country,
          city: u.city,
          website: u.website,
          logo_url: u.logo_url,
          created_at: u.created_at,
          member_count: memberCounts[u.name] ?? 0,
          document_count: docCounts[u.name] ?? 0,
        })));
      }
    } catch (err) {
      console.error("Error loading orgs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name || !form.slug) return;
    setSaving(true);
    try {
      if (editing) {
        await supabase.from("universities").update({
          name: form.name,
          abbr: form.slug.toUpperCase(),
          description: form.description,
          country: form.country,
          city: form.city,
          website: form.website,
        }).eq("id", editing.id);
        await logAdminAction("update_organization", "universities", editing.id, { name: form.name });
      } else {
        const { data } = await supabase.from("universities").insert({
          name: form.name,
          abbr: form.slug.toUpperCase(),
          description: form.description,
          country: form.country,
          city: form.city,
          website: form.website,
          campuses: [],
        }).select("id").single();
        await logAdminAction("create_organization", "universities", data?.id, { name: form.name });
      }

      toast({ title: editing ? "Organization updated" : "Organization created" });
      setShowAdd(false);
      setEditing(null);
      setForm({ name: "", slug: "", description: "", type: "university", country: "", city: "", website: "" });
      loadOrgs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await supabase.from("universities").delete().eq("id", id);
      await logAdminAction("delete_organization", "universities", id);
      toast({ title: "Organization deleted" });
      loadOrgs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.country?.toLowerCase().includes(search.toLowerCase()) ||
      o.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Organizations</h1>
          <p className="mt-1 text-muted-foreground">Manage universities, companies, and institutions</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: "", slug: "", description: "", type: "university", country: "", city: "", website: "" }); setShowAdd(true); }} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Add Organization
        </Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((org, index) => (
                <motion.div
                  key={org.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{org.name}</p>
                        <Badge variant="outline" className="rounded-lg text-[10px] uppercase">
                          {org.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{org.city}{org.city && org.country ? ", " : ""}{org.country}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{org.member_count ?? 0}</span>
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{org.document_count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg"
                      onClick={() => { setEditing(org); setForm({ name: org.name, slug: org.slug, description: org.description ?? "", type: org.type, country: org.country ?? "", city: org.city ?? "", website: org.website ?? "" }); setShowAdd(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      onClick={() => handleDelete(org.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No organizations found</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Organization" : "Add Organization"}</DialogTitle>
            <DialogDescription>Create or update an organization on the platform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., University of Kigali" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Slug / Abbreviation</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g., UK" className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" className="rounded-xl mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" className="rounded-xl mt-1" />
              </div>
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="rounded-xl mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name} className="rounded-xl gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
