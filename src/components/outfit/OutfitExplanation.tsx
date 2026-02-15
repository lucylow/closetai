import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

export interface OutfitExplanationData {
  userPreference: string;
  trendInsight: string;
  trendSource: string;
  weatherOccasion: string;
  explanation?: string;
}

interface OutfitExplanationProps {
  outfit: {
    id: string;
    items: Array<{
      id: string;
      name?: string;
      imageUrl?: string;
      extractedAttributes?: { color?: string; category?: string };
    }>;
    occasion?: string;
    weatherTags?: string[];
    description?: string;
  } | null;
  open: boolean;
  onClose: () => void;
}

const OutfitExplanation = ({ outfit, open, onClose }: OutfitExplanationProps) => {
  const [explanation, setExplanation] = useState<OutfitExplanationData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !outfit) return;
    const fetchExplanation = async () => {
      setLoading(true);
      setExplanation(null);
      try {
        const response = await api.post<OutfitExplanationData>("/ai/explain-outfit", {
          outfit: {
            id: outfit.id,
            items: outfit.items,
            occasion: outfit.occasion,
            weatherTags: outfit.weatherTags,
          },
        });
        setExplanation(response);
      } catch {
        setExplanation({
          userPreference: "This outfit was chosen based on your style preferences.",
          trendInsight: "It aligns with current fashion trends.",
          trendSource: "ClosetAI",
          weatherOccasion: `Perfect for ${outfit.occasion || "casual"} occasions.`,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchExplanation();
  }, [outfit?.id, open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Why this outfit?</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {explanation && !loading && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="rounded-xl bg-muted/50 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span>🧑‍🎨</span> Based on your style
              </h4>
              <p className="text-sm text-muted-foreground">{explanation.userPreference}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span>🌍</span> Trending now
              </h4>
              <p className="text-sm text-muted-foreground">{explanation.trendInsight}</p>
              <small className="mt-1 block text-xs text-muted-foreground/80">
                Source: {explanation.trendSource}
              </small>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span>☀️</span> Weather & occasion
              </h4>
              <p className="text-sm text-muted-foreground">{explanation.weatherOccasion}</p>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OutfitExplanation;
