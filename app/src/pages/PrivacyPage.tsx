import { useSEO } from "@/lib/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function PrivacyPage() {
  useSEO({ title: "Privacy Policy", description: "How UniHub collects, uses and protects your personal information." });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
          </div>

          <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm">Last updated: today</p>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">1. Information We Collect</h2>
              <p>You sign in with Google. We receive only what Google shares with us:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Account:</strong> Your name, email address and profile picture from Google</li>
                <li><strong>Academic profile you provide:</strong> University, program and year of study</li>
                <li><strong>Activity:</strong> Documents you view, bookmark, download, upload and comment on; credit balance and transactions</li>
                <li><strong>Device:</strong> Browser type, approximate location from IP, and basic analytics</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>To run the platform: authenticate you, sync bookmarks and view history across devices</li>
                <li>To deliver notifications for new requests at your university and replies on your uploads</li>
                <li>To run the credit economy (earning credits for uploads, spending them on downloads)</li>
                <li>To moderate content and enforce our Terms</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">3. Data Sharing</h2>
              <p>We do not sell your personal information. Your name, university and uploads are visible to other signed-in users. We may share data with:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Service providers that host and run UniHub (database, storage, email)</li>
                <li>Law enforcement if required by law</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">4. Data Security</h2>
              <p>Authentication is handled by Google. We never see or store your Google password. Data is transmitted over HTTPS and protected with row-level security so users can only access their own private data.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">5. Your Rights</h2>
              <p>From the Settings page you can:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Export a copy of your personal data</li>
                <li>Update your academic profile</li>
                <li>Mute notification categories</li>
                <li>Delete your account and associated data</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">6. Cookies & Local Storage</h2>
              <p>We use cookies and local storage for sign-in sessions, theme preference, offline document caching and anonymous analytics. You can manage these in your browser settings.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">7. Contact</h2>
              <p>For privacy-related questions, contact <span className="text-primary font-medium">privacy@unihub.dev</span>.</p>
            </section>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
