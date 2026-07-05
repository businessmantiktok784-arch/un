import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type AppRole, canManageRole, getManageableRoles } from "@/lib/rbac";
import { Search, Shield, UserCheck, UserX, Loader2, Plus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logAdminAction } from "@/lib/adminUtils";

interface StaffMember {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string | null; full_name: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("moderator");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { role: myRole } = useRole();

  const manageableRoles = myRole ? getManageableRoles(myRole) : [];

  useEffect(() => {
    loadStaff();
    const ch = supabase.channel("admin-staff").on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => { loadStaff(); }).on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => { loadStaff(); }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function loadStaff() {
    setLoading(true);
    try {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("*")
        .in("role", ["moderator", "staff", "manager", "org_admin", "admin", "super_admin"])
        .order("created_at", { ascending: false });

      if (roles) {
        // Get user details for each role
        const userIds = roles.map((r) => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

        setStaff(
          roles.map((r) => ({
            ...r,
            email: profileMap.get(r.user_id)?.email ?? undefined,
            full_name: profileMap.get(r.user_id)?.full_name ?? undefined,
            avatar_url: profileMap.get(r.user_id)?.avatar_url ?? undefined,
          })) as StaffMember[]
        );
      }
    } catch (err) {
      console.error("Error loading staff:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .order("created_at", { ascending: false })
      .limit(100);
    setUsers(data ?? []);
  }

  async function handleAddStaff() {
    if (!selectedUser || !selectedRole) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: selectedUser,
        role: selectedRole,
      });

      if (error) throw error;

      await logAdminAction("assign_role", "user_roles", selectedUser, { role: selectedRole });

      toast({ title: "Role assigned", description: `User has been assigned the ${ROLE_LABELS[selectedRole]} role.` });
      setShowAddDialog(false);
      setSelectedUser("");
      setSelectedRole("moderator");
      loadStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveRole(staffId: string, userId: string, role: AppRole) {
    if (!myRole || !canManageRole(myRole, role)) {
      toast({ title: "Permission denied", description: "You cannot remove this role.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", staffId);
      if (error) throw error;

      await logAdminAction("remove_role", "user_roles", userId, { role });

      toast({ title: "Role removed" });
      loadStaff();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  const filteredStaff = staff.filter(
    (s) =>
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.role.includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Staff & Roles</h1>
          <p className="mt-1 text-muted-foreground">Manage team members and their permissions</p>
        </div>
        <Button
          onClick={() => { setShowAddDialog(true); loadUsers(); }}
          className="gap-2 rounded-xl"
        >
          <Plus className="h-4 w-4" /> Add Staff Member
        </Button>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Team Members</CardTitle>
              <CardDescription>{filteredStaff.length} staff members</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {filteredStaff.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {member.full_name?.[0] ?? member.email?.[0] ?? "?"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.full_name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{member.email ?? "No email"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-lg text-xs">
                        {ROLE_LABELS[member.role]}
                      </Badge>
                      {myRole && canManageRole(myRole, member.role) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleRemoveRole(member.id, member.user_id, member.role)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {filteredStaff.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No staff members found</p>
                  </div>
                )}
              </div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* Role Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {manageableRoles.map((role, i) => (
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="rounded-2xl shadow-soft h-full">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">{ROLE_LABELS[role]}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{ROLE_DESCRIPTIONS[role]}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Assign a role to an existing user</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">User</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name ?? u.email ?? u.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {manageableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleAddStaff} disabled={saving || !selectedUser} className="rounded-xl gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
