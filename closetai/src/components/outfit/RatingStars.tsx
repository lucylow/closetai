import { useState, useEffect } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  initialRating?: number;
  onRate: (rating: number) => void;
}

const RatingStars = ({ initialRating = 0, onRate }: RatingStarsProps) => {
  const [rating, setRating] = useState(initialRating);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const handleClick = (value: number) => {
    setRating(value);
    onRate(value);
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
          aria-label={`Rate ${star} stars`}
        >
          <Star
            size={24}
            className={
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground"
            }
          />
        </button>
      ))}
    </div>
  );
};

export default RatingStars;
