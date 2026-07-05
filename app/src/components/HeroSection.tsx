import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, BookOpen, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { usePlatformStats } from "@/hooks/useLiveData";

interface MediaItem {
  type: "image" | "video";
  src: string;
}

const heroMedia: MediaItem[] = [
  { type: "video", src: "/hero/8198511-hd_1920_1080_25fps.mp4" },
  { type: "video", src: "/hero/8199329-hd_1920_1080_25fps.mp4" },
  { type: "video", src: "/hero/8199364-hd_1920_1080_25fps.mp4" },
  { type: "video", src: "/hero/8199372-hd_1920_1080_25fps.mp4" },
  { type: "image", src: "/hero/brooke-cagle--uHVRvDr7pg-unsplash.jpg" },
  { type: "image", src: "/hero/dominic-kurniawan-suryaputra-r0U2y0HhdGE-unsplash.jpg" },
  { type: "image", src: "/hero/priscilla-du-preez-XkKCui44iM0-unsplash.jpg" },
];

export default function HeroSection() {
  const { documents, students, universities, downloads } = usePlatformStats();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);

  const advance = useRef(() => {});
  advance.current = () => setCurrentIdx(prev => (prev + 1) % heroMedia.length);

  useEffect(() => {
    const item = heroMedia[currentIdx];
    const delay = item.type === "video" ? 8000 : 3000;
    const timer = setTimeout(() => advance.current(), delay);
    return () => clearTimeout(timer);
  }, [currentIdx]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/browse?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <section className="relative overflow-hidden pb-16 lg:pb-24">
      {/* Background slideshow */}
      {heroMedia.map((item, i) =>
        item.type === "video" ? (
          <video
            key={item.src}
            src={item.src}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
            style={{ opacity: i === currentIdx ? 1 : 0 }}
          />
        ) : (
          <div
            key={item.src}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${item.src})`,
              opacity: i === currentIdx ? 1 : 0,
            }}
          />
        )
      )}
      <div className="absolute inset-0 bg-black/50" />

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center pt-24 lg:pt-32">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs font-medium text-white shadow-soft"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {documents.toLocaleString()} resources available
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]"
          >
            Your Academic
            <span className="relative">
              <span className="relative z-10 text-blue-300"> Resource </span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-400/20 -rotate-1 rounded-sm" />
            </span>
            Hub
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-base text-white/80 leading-relaxed sm:text-lg"
          >
            Share and download past exams, notes, and assignments from universities worldwide. Built by students, for students.
          </motion.p>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onSubmit={handleSearch}
            className="mx-auto mt-8 max-w-xl"
          >
            <div className="relative flex items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-elevated focus-within:ring-2 focus-within:ring-blue-400/40 transition-all">
              <Search className="absolute left-4 h-5 w-5 text-white/60 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by course, university, or document type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 w-full rounded-2xl bg-transparent pl-12 pr-32 text-sm outline-none text-white placeholder:text-white/50"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 rounded-xl gap-1.5 shadow-soft"
              >
                Search <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.form>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/browse">
              <Button size="lg" className="rounded-2xl gap-2 shadow-soft text-base px-6">
                <BookOpen className="h-4 w-4" /> Browse Resources
              </Button>
            </Link>
            <Link to="/upload">
              <Button size="lg" className="rounded-2xl gap-2 text-base px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
                <TrendingUp className="h-4 w-4" /> Upload
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 sm:gap-12"
          >
            {[
              { value: documents > 0 ? `${(documents / 1000).toFixed(1)}k+` : "—", label: "Documents" },
              { value: students > 0 ? students.toLocaleString() : "—", label: "Students" },
              { value: universities > 0 ? universities.toString() : "—", label: "Universities" },
              { value: downloads > 0 ? `${(downloads / 1000).toFixed(1)}k+` : "—", label: "Downloads" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
