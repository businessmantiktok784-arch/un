import { useSEO } from "@/lib/useSEO";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen, Users, Globe, Target, Heart } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: BookOpen,
    title: "Curated Resources",
    description: "Access a growing library of past exams, notes, and assignments organized by university and course.",
  },
  {
    icon: Users,
    title: "Student Community",
    description: "Join thousands of students sharing knowledge and helping each other succeed academically.",
  },
  {
    icon: Globe,
    title: "Multi-University",
    description: "Resources from universities worldwide, expanding to serve more institutions every day.",
  },
  {
    icon: Target,
    title: "Quality Verified",
    description: "All uploaded documents are reviewed by our team to ensure accuracy and relevance.",
  },
  {
    icon: Heart,
    title: "Free to Use",
    description: "Browse and download basic resources for free. Credit system for premium content keeps us running.",
  },
  {
    icon: GraduationCap,
    title: "By Students, For Students",
    description: "Built with student needs in mind, designed to make academic resource sharing simple and effective.",
  },
];

const stats = [
  { label: "Founded", value: "2024" },
  { label: "Universities", value: "6+" },
  { label: "Mission", value: "Open Access" },
];

export default function AboutPage() {
  useSEO({
    title: "About UniHub",
    description: "Learn about UniHub — the academic resource platform built for students worldwide.",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12 lg:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="flex flex-col items-center mb-4">
            <span className="font-display text-3xl font-bold tracking-tight text-foreground leading-none">
              UniHub
            </span>
            <span className="mt-1 h-0.5 w-10 bg-primary rounded-full" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight mb-4">
            About Our Platform
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            UniHub is a student-driven academic resource platform that makes it easy to share and access
            past exams, notes, and assignments from universities worldwide. We believe every student deserves
            access to quality study materials.
          </p>

          <div className="flex items-center justify-center gap-8 mt-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="h-full rounded-3xl shadow-soft card-lift border-0">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center max-w-3xl mx-auto"
        >
          <h2 className="font-display text-2xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground mb-8">
            Our platform connects students with the resources they need. Browse by university, search by course code,
            or upload your own materials to help others. Every contribution makes the platform better for everyone.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="rounded-2xl bg-primary/10 px-6 py-3 text-sm font-medium text-primary">
              Browse Resources
            </div>
            <div className="rounded-2xl bg-primary/10 px-6 py-3 text-sm font-medium text-primary">
              Upload Documents
            </div>
            <div className="rounded-2xl bg-primary/10 px-6 py-3 text-sm font-medium text-primary">
              Request Materials
            </div>
            <div className="rounded-2xl bg-primary/10 px-6 py-3 text-sm font-medium text-primary">
              Bookmark Favorites
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
