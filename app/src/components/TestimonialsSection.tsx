import { Star, Quote, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useTestimonials } from "@/hooks/useLiveData";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function TestimonialsSection() {
  const { testimonials, loading } = useTestimonials(8);

  return (
    <section className="border-t py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">What Students Say</h2>
          <p className="mt-2 text-muted-foreground">Real voices from Rwandan universities using UniHub</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : testimonials.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No testimonials yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6 pb-5 flex flex-col h-full">
                    <Quote className="h-6 w-6 text-primary/30 mb-3" />
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.quote}"</p>
                    <div className="mt-4 flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {t.photo_url ? <AvatarImage src={t.photo_url} alt={t.student_name} /> : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-display">{initials(t.student_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.student_name}</p>
                        {t.university && <p className="text-xs text-muted-foreground">{t.university}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
