import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Info, Save, RotateCcw } from "lucide-react";
import { useRecommendation } from "@/hooks/useRecommendation";
import { toast } from "sonner";
import OutfitExplanation from "./OutfitExplanation";
import FeedbackPanel from "./FeedbackPanel";
import "./AdvancedOutfitSuggestions.css";

const AdvancedOutfitSuggestions = () => {
  const { getDailyOutfits, rateOutfit, saveOutfit } = useRecommendation();
  const [outfits, setOutfits] = useState<Awaited<ReturnType<typeof getDailyOutfits>>>([]);
  const [loading, setLoading] = useState(false);
  const [explanationOutfit, setExplanationOutfit] = useState<typeof outfits[0] | null>(null);
  useEffect(() => {
    fetchOutfits();
  }, []);

  const fetchOutfits = async () => {
    setLoading(true);
    try {
      const data = await getDailyOutfits(37.7749, -122.4194, "casual");
      setOutfits(data);
    } catch {
      toast.error("Failed to load outfits");
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (outfitId: string, rating: number) => {
    try {
      await rateOutfit(outfitId, rating);
      toast.success("Thanks for your feedback!");
      setOutfits((prev) =>
        prev.map((o) => (o.id === outfitId ? { ...o, userRating: rating } : o))
      );
    } catch {
      toast.error("Failed to submit rating");
    }
  };

  const handleSave = async (outfit: typeof outfits[0]) => {
    try {
      await saveOutfit(outfit);
      toast.success("Outfit saved to your collection!");
    } catch {
      toast.error("Failed to save outfit");
    }
  };

  const handleExplain = (outfit: typeof outfits[0]) => {
    setExplanationOutfit(outfit);
  };

  const score = (o: typeof outfits[0]) => o.totalScore ?? o.trendScore ?? 0.8;

  return (
    <div className="advanced-outfit-suggestions">
      <div className="suggestions-header">
        <h2>Today&apos;s Outfit Suggestions</h2>
        <button
          className="refresh-btn"
          onClick={fetchOutfits}
          disabled={loading}
          type="button"
        >
          <RotateCcw className={loading ? "spin" : ""} size={16} /> Refresh
        </button>
      </div>

      {loading && (
        <div className="loading-spinner">Finding your perfect looks...</div>
      )}

      <div className="outfit-grid">
        {outfits.map((outfit, index) => (
          <motion.div
            key={outfit.id}
            className="outfit-card glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="outfit-items">
              {outfit.items.map((item) => (
                <div key={item.id} className="outfit-item">
                  <img src={item.imageUrl} alt={item.name} />
                  <span>
                    {item.extractedAttributes?.color}{" "}
                    {item.extractedAttributes?.category}
                  </span>
                </div>
              ))}
            </div>

            <div className="outfit-details">
              <p className="outfit-description">{outfit.description}</p>
              <div className="trend-badge">
                Match: {(score(outfit) * 100).toFixed(0)}%
              </div>
            </div>

            <div className="outfit-actions">
              <div className="rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    role="button"
                    tabIndex={0}
                    className={`star ${star <= (outfit.userRating || 0) ? "filled" : ""}`}
                    onClick={() => handleRate(outfit.id, star)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleRate(outfit.id, star)
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <button
                className="icon-btn explain-btn"
                onClick={() => handleExplain(outfit)}
                aria-label="Why this outfit?"
                type="button"
              >
                <Info size={16} />
              </button>
              <button
                className="icon-btn save-btn"
                onClick={() => handleSave(outfit)}
                aria-label="Save outfit"
                type="button"
              >
                <Heart size={16} />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-border/50">
              <FeedbackPanel
                outfitId={outfit.id}
                onFeedbackSubmitted={() =>
                  setOutfits((prev) =>
                    prev.map((o) =>
                      o.id === outfit.id ? { ...o, userRating: 0 } : o
                    )
                  )
                }
              />
            </div>
          </motion.div>
        ))}
      </div>

      <OutfitExplanation
        outfit={explanationOutfit}
        open={!!explanationOutfit}
        onClose={() => setExplanationOutfit(null)}
      />
    </div>
  );
};

export default AdvancedOutfitSuggestions;
