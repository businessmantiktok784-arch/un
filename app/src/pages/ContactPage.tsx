import { useSEO } from "@/lib/useSEO";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, MapPin, Clock, Send, CheckCircle2, MessageSquare, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput, sanitizeEmail, checkRateLimit } from "@/lib/security";

const contactInfo = [
  { icon: Mail, label: "Email", value: "support@unihub.app", desc: "We reply within 24 hours" },
  { icon: MapPin, label: "Location", value: "Global", desc: "Online platform serving students worldwide" },
  { icon: Clock, label: "Hours", value: "24/7", desc: "Platform always available" },
  { icon: Phone, label: "Support", value: "help@unihub.app", desc: "Email or contact form" },
];

const subjects = ["General Inquiry", "Bug Report", "Feature Request", "Account Issue", "Partnership", "Other"];

export default function ContactPage() {
  useSEO({ title: "Contact Us", description: "Get in touch with the UniHub team. We respond to questions, partnerships and feedback." });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Rate limiting
    const rateLimit = checkRateLimit(`contact:${form.email}`);
    if (!rateLimit.allowed) {
      toast({ title: "Too many attempts", description: "Please wait before sending another message.", variant: "destructive" });
      return;
    }
    // Validation
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (form.message.length > 5000) {
      toast({ title: "Message too long", description: "Maximum 5000 characters.", variant: "destructive" });
      return;
    }
    // Sanitize inputs
    const cleanName = sanitizeInput(form.name);
    const cleanEmail = sanitizeEmail(form.email);
    const cleanSubject = sanitizeInput(form.subject);
    const cleanMessage = sanitizeInput(form.message);

    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: cleanName, email: cleanEmail, subject: cleanSubject, body: cleanMessage,
    });
    setLoading(false);
    if (error) return toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden bg-hero py-16">
        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <MessageSquare className="mx-auto h-10 w-10 text-primary-foreground mb-4" />
            <h1 className="font-display text-4xl font-bold text-primary-foreground">Contact Us</h1>
            <p className="mt-3 text-primary-foreground/80 max-w-lg mx-auto">
              Have a question, feedback, or partnership idea? We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-5xl py-12">
        <div className="grid gap-8 md:grid-cols-5">
          {/* Contact Info */}
          <div className="md:col-span-2 space-y-4">
            {contactInfo.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <Card>
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{c.label}</p>
                      <p className="text-sm text-foreground">{c.value}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Send us a message</CardTitle>
                <CardDescription>Fill out the form and we'll get back to you shortly.</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                    <h3 className="mt-4 font-display text-xl font-bold text-foreground">Message Sent!</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Thank you for reaching out. We'll respond within 24 hours.</p>
                    <Button className="mt-6" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@university.edu" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={form.subject} onValueChange={(v) => setForm(f => ({ ...f, subject: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select a topic" /></SelectTrigger>
                        <SelectContent>
                          {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="Tell us more..." rows={5} value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={loading}>
                      {loading ? "Sending..." : <><Send className="h-4 w-4" /> Send Message</>}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
