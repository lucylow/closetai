import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWardrobe } from "@/hooks/useWardrobe";

interface TrendExplorerProps {
  trendName: string;
  trendColor?: string;
}

const TrendExplorer = ({ trendName, trendColor }: TrendExplorerProps) => {
  const { items: wardrobe } = useWardrobe();
  const [matchingItems, setMatchingItems] = useState<
    Array<{ id: string; category?: string; color?: string; name?: string }>
  >([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const color = (trendColor || trendName).toLowerCase();
    const matches = wardrobe.filter(
      (item) =>
        (item.extractedAttributes?.color || "").toLowerCase() === color ||
        (item.extractedAttributes?.category || "").toLowerCase() === trendName.toLowerCase() ||
        (item.name || "").toLowerCase().includes(trendName.toLowerCase())
    );
    setMatchingItems(
      matches.map((i) => ({
        id: i.id,
        category: i.extractedAttributes?.category,
        color: i.extractedAttributes?.color,
        name: i.name,
      }))
    );

    const categories = ["dress", "top", "bottom", "outerwear", "shoes"];
    const missing = categories.filter(
      (cat) =>
        !wardrobe.some(
          (i) =>
            (i.extractedAttributes?.category || "").toLowerCase() === cat &&
            (i.extractedAttributes?.color || "").toLowerCase() === color
        )
    );
    setSuggestions(missing.slice(0, 3));
  }, [trendName, trendColor, wardrobe]);

  return (
    <motion.div
      className="trend-explorer rounded-xl border bg-card p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="mb-3 font-semibold">Trend: {trendName}</h3>
      <div className="space-y-3">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Your matching items
          </p>
          {matchingItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {matchingItems.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium"
                >
                  {item.category} ({item.color || "styled"})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have anything in this trend yet.
            </p>
          )}
        </div>
        {suggestions.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Consider adding
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-dashed border-primary/40 px-3 py-1 text-xs text-primary"
                >
                  {(trendColor || trendName)} {cat}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TrendExplorer;
