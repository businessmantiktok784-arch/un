import { useSEO } from "@/lib/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function TermsPage() {
  useSEO({ title: "Terms of Service", description: "UniHub terms of service governing use of the platform." });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Terms of Service</h1>
          </div>

          <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm">Last updated: today</p>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p>By accessing or using UniHub, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">2. Accounts &amp; Sign-In</h2>
              <p>UniHub uses Google Sign-In only. You must use a real Google account that you control and provide accurate university, program and year of study during onboarding. You are responsible for everything that happens under your account.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">3. Content Guidelines</h2>
              <p>Users may upload academic resources such as past exams, notes, assignments and study guides as PDF files. The following are prohibited:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Uploading copyrighted material without permission</li>
                <li>Sharing live or ongoing examination papers</li>
                <li>Uploading malicious, obscene or offensive content</li>
                <li>Impersonating other users or institutions</li>
                <li>Using the platform to facilitate academic dishonesty</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">4. Intellectual Property</h2>
              <p>Users retain ownership of content they upload. By uploading, you grant UniHub a non-exclusive license to display, distribute and make the content available to other users on the platform.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">5. Content Moderation</h2>
              <p>Uploads are reviewed by admins before going live. UniHub may remove any content that violates these terms. Users can report content from any document page.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">6. Credits</h2>
              <p>You earn credits by uploading approved documents and spend credits to download documents you do not own. Credits have no monetary value, cannot be transferred between accounts and may be revoked for abuse.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">7. Limitation of Liability</h2>
              <p>UniHub is provided "as is." We do not guarantee the accuracy or quality of user-uploaded content. Use academic resources at your own discretion.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">8. Termination</h2>
              <p>We may suspend or terminate accounts that violate these terms. You may delete your account at any time from the Settings page.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">9. Contact</h2>
              <p>For questions about these terms, contact us at <span className="text-primary font-medium">support@unihub.dev</span>.</p>
            </section>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
