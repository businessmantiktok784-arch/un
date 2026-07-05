import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useUniversities } from "@/hooks/useLiveData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminUtils";

interface Course {
  id: string;
  course_code: string;
  title: string;
  university: string;
  faculty?: string;
  docs_count?: number;
}

export default function AdminCoursesPage() {
  const { universities } = useUniversities();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newCourse, setNewCourse] = useState({ course_code: "", title: "", faculty: "", university: "" });
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("courses").select("*").order("title");
    setCourses((data ?? []) as Course[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = courses.filter(c =>
    c.course_code.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!newCourse.course_code || !newCourse.title) {
      toast({ title: "Missing fields", description: "Course code and name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("courses").insert({
      course_code: newCourse.course_code,
      title: newCourse.title,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Course added", description: `${newCourse.course_code} - ${newCourse.title}` });
    setNewCourse({ course_code: "", title: "", faculty: "", university: "" });
    setAddOpen(false);
    logAdminAction("add_course", "courses", newCourse.course_code);
    load();
  };

  const handleDelete = async (id: string) => {
    const course = courses.find(c => c.id === id);
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Course deleted", description: `${course?.course_code} has been removed.`, variant: "destructive" });
    setDeleteId(null);
    logAdminAction("delete_course", "courses", course?.course_code);
    load();
  };

  const handleSaveEdit = async () => {
    if (!editCourse) return;
    setSaving(true);
    const { error } = await supabase.from("courses").update({
      course_code: editCourse.course_code,
      title: editCourse.title,
    }).eq("id", editCourse.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Course updated", description: `${editCourse.course_code} has been saved.` });
    setEditCourse(null);
    logAdminAction("edit_course", "courses", editCourse.course_code);
    load();
  };

  const deleteCourse = courses.find(c => c.id === deleteId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Course Management</h1>
        <p className="mt-1 text-muted-foreground">Manage courses and academic programs</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search courses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Add New Course</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Course Code</Label><Input placeholder="e.g. CSC 3201" value={newCourse.course_code} onChange={(e) => setNewCourse(p => ({ ...p, course_code: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Course Name</Label><Input placeholder="e.g. Operating Systems" value={newCourse.title} onChange={(e) => setNewCourse(p => ({ ...p, title: e.target.value }))} /></div>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Add Course
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium font-mono">{course.course_code}</TableCell>
                <TableCell>{course.title}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditCourse({ ...course })}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(course.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No courses found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editCourse} onOpenChange={(o) => !o && setEditCourse(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Edit Course</DialogTitle></DialogHeader>
          {editCourse && (
            <div className="space-y-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Course Code</Label><Input value={editCourse.course_code} onChange={(e) => setEditCourse({ ...editCourse, course_code: e.target.value })} /></div>
                <div className="space-y-2"><Label>Course Name</Label><Input value={editCourse.title} onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })} /></div>
              </div>
              <Button className="w-full" onClick={handleSaveEdit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteCourse?.course_code} - {deleteCourse?.title}" will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
