import { useState } from "react";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/contexts/CreditContext";

interface StarRatingProps {
  initialRating: number;
  totalRatings?: number;
  onRate?: (rating: number) => void;
}

export default function StarRating({ initialRating, totalRatings = 0, onRate }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(initialRating);
  const [count, setCount] = useState(totalRatings);
  const { isLoggedIn } = useCredits();
  const { toast } = useToast();

  const handleRate = (rating: number) => {
    if (!isLoggedIn) {
      toast({ title: "Sign in required", description: "Log in to rate this document.", variant: "destructive" });
      return;
    }
    if (userRating) {
      toast({ title: "Already rated", description: "You've already rated this document." });
      return;
    }
    setUserRating(rating);
    const newCount = count + 1;
    const newAvg = (avgRating * count + rating) / newCount;
    setAvgRating(newAvg);
    setCount(newCount);
    onRate?.(rating);
    toast({ title: "Thanks for rating!", description: `You gave this document ${rating} star${rating > 1 ? "s" : ""}.` });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => !userRating && setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => handleRate(star)}
            className="p-0.5 transition-transform hover:scale-110"
            disabled={!!userRating}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= (hovered || userRating || Math.round(avgRating))
                  ? "fill-accent text-accent"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count} ratings)</span>
    </div>
  );
}
