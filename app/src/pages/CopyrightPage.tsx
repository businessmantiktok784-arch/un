import { useSEO } from "@/lib/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Copyright } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function CopyrightPage() {
  useSEO({ title: "Copyright Policy", description: "Copyright policy for content shared on UniHub." });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Copyright className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Copyright Policy</h1>
          </div>

          <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm">Last updated: March 1, 2025</p>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">1. Respect for Copyright</h2>
              <p>UniHub respects intellectual property rights and expects its users to do the same. All uploaded content must comply with applicable copyright laws in Worldwide and internationally.</p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">2. Permitted Content</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Your own original notes, summaries, and study guides</li>
                <li>Past examination papers that are publicly available or shared with instructor permission</li>
                <li>Collaborative academic work with consent from all contributors</li>
                <li>Content released under open or Creative Commons licenses</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">3. Prohibited Content</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Textbook chapters or full textbooks without publisher permission</li>
                <li>Proprietary course materials exclusively owned by institutions</li>
                <li>Content from other platforms without proper attribution</li>
                <li>Any content that infringes on third-party intellectual property</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">4. Reporting Copyright Concerns</h2>
              <p>If you believe content on UniHub infringes your copyright, contact us with the details (your name, the content in question, proof of ownership, and a description of the infringement) and our team will review within 5 business days.</p>
              <Button asChild className="mt-2">
                <Link to="/contact">Contact us</Link>
              </Button>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">5. Enforcement</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Promptly remove or disable access to infringing content</li>
                <li>Notify the uploader of the claim</li>
                <li>Issue warnings or suspend accounts for repeat violations</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-foreground">6. User Responsibility</h2>
              <p>By uploading content, you certify that you have the right to share it. You agree to indemnify UniHub against any claims arising from content you upload.</p>
            </section>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}

