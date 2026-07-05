import { FileText, Users, GraduationCap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { usePlatformStats } from "@/hooks/useLiveData";

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return String(n);
}

export default function StatsBar() {
  const s = usePlatformStats();
  const stats = [
    { label: "Documents", value: fmt(s.documents), icon: FileText },
    { label: "Students", value: fmt(s.students), icon: Users },
    { label: "Universities", value: String(s.universities), icon: GraduationCap },
    { label: "Downloads", value: fmt(s.downloads), icon: TrendingUp },
  ];

  return (
    <section className="border-b bg-card">
      <div className="container grid grid-cols-2 gap-4 py-8 md:grid-cols-4 md:gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
