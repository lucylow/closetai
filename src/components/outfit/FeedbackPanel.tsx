import React, { useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const feedbackOptions = [
  { emoji: "❤️", label: "Love it!", type: "like" as const },
  { emoji: "👍", label: "Nice", type: "like" as const },
  { emoji: "🤔", label: "Not sure", type: "neutral" as const },
  { emoji: "👎", label: "Not for me", type: "dislike" as const },
  { emoji: "❄️", label: "Too formal", type: "dislike" as const, reason: "formal" },
  { emoji: "☀️", label: "Too casual", type: "dislike" as const, reason: "casual" },
];

interface FeedbackPanelProps {
  outfitId: string;
  onFeedbackSubmitted?: () => void;
}

const FeedbackPanel = ({ outfitId, onFeedbackSubmitted }: FeedbackPanelProps) => {
  const [selected, setSelected] = useState<(typeof feedbackOptions)[number] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const rating =
        selected.type === "like" ? 5 : selected.type === "neutral" ? 3 : 1;
      await api.post("/recommendations/rate", {
        outfitId,
        rating,
        reason: selected.reason,
      });
      toast.success("Thanks for your feedback!");
      setSelected(null);
      onFeedbackSubmitted?.();
    } catch {
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-panel space-y-3">
      <p className="text-sm font-medium">What do you think?</p>
      <div className="flex flex-wrap gap-2">
        {feedbackOptions.map((opt) => (
          <motion.button
            key={opt.label}
            type="button"
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all ${
              selected?.label === opt.label
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSelected(opt)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-base">{opt.emoji}</span>
            <span>{opt.label}</span>
          </motion.button>
        ))}
      </div>
      {selected && (
        <Button
          size="sm"
          onClick={submitFeedback}
          disabled={submitting}
          className="rounded-full"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      )}
    </div>
  );
};

export default FeedbackPanel;
