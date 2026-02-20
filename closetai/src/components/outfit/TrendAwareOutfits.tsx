import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ExternalLink } from "lucide-react";
import { api, getImageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { ClothingItem } from "@/lib/data";
import { DEMO_WARDROBE } from "@/lib/data";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useAuth } from "@/contexts/AuthContext";
import "./TrendAwareOutfits.css";

type MatchedTrend = {
  trend: string;
  relevance?: number;
  source?: string;
  favicon?: string | null;
  title?: string;
};

type OutfitItem = {
  id: string;
  imageUrl?: string;
  extractedAttributes?: { category?: string; color?: string; pattern?: string; style?: string };
  name?: string;
  category?: string;
  color?: string;
};

type Outfit = {
  items: OutfitItem[];
  trendScore: number;
  occasion: string;
  weather: string;
  matchedTrends?: MatchedTrend[];
  reason?: string;
};

type TrendInsights = {
  summary: string;
  details?: { trend: string; insight: string; source: string }[];
  lastUpdated?: string;
};

type TrendAwareResponse = {
  outfits: Outfit[];
  trendInsights: TrendInsights;
  citation: string;
};

const OCCASIONS = [
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "party", label: "Party" },
  { value: "work", label: "Work" },
];

function toWardrobePayload(items: ClothingItem[]): OutfitItem[] {
  return items.map((i) => ({
    id: i.id,
    imageUrl: i.imageUrl,
    name: i.name,
    category: i.category,
    color: i.color,
    extractedAttributes: {
      category: i.category,
      color: i.color,
      pattern: i.pattern,
      style: undefined,
    },
  }));
}

interface TrendAwareOutfitsProps {
  wardrobe?: ClothingItem[];
  onOutfitSelect?: (outfit: Outfit) => void;
}

const TrendAwareOutfits: React.FC<TrendAwareOutfitsProps> = ({
  wardrobe: propWardrobe,
  onOutfitSelect,
}) => {
  const { user } = useAuth();
  const { items: wardrobeItems } = useWardrobe();
  const items = propWardrobe ?? (user ? wardrobeItems : DEMO_WARDROBE);

  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [trendInsights, setTrendInsights] = useState<TrendInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<number | null>(null);
  const [occasion, setOccasion] = useState("casual");

  const generateTrendAwareOutfits = async () => {
    setLoading(true);
    setOutfits([]);
    setTrendInsights(null);
    try {
      const wardrobePayload = toWardrobePayload(items);
      const res = await api.post<{ success: boolean; data: TrendAwareResponse }>(
        "/trends/outfits/trend-aware",
        {
          wardrobe: wardrobePayload,
          occasion,
          weather: { condition: "any", temp: 70 },
        },
        !!user
      );
      const payload = res.data;
      setOutfits(payload?.outfits ?? []);
      setTrendInsights(payload?.trendInsights ?? null);
    } catch (err) {
      console.error("Failed to generate outfits:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trend-aware-outfits space-y-6">
      <div className="outfit-filters flex flex-wrap items-center gap-4">
        <select
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          className="h-10 rounded-full border border-input bg-background px-4 text-sm"
        >
          {OCCASIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <Button
          onClick={generateTrendAwareOutfits}
          disabled={loading || items.length === 0}
          className="generate-btn gap-2 rounded-full"
        >
          <Sparkles size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Analyzing Trends..." : "Generate Trend-Aware Outfits"}
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Add items to your wardrobe to generate trend-aware outfit recommendations.
        </p>
      )}

      {outfits.length > 0 && (
        <>
          {trendInsights && (
            <div className="trend-insights-banner glass-card p-4 flex gap-4">
              <span className="insights-icon text-2xl">✨</span>
              <div className="insights-text flex-1 min-w-0">
                <strong className="text-sm">Trend Insights:</strong>
                <p className="text-sm text-muted-foreground mt-1">
                  {trendInsights.summary}
                </p>
                {trendInsights.details?.map((detail, i) => (
                  <div key={i} className="trend-detail text-xs mt-2">
                    • {detail.insight}{" "}
                    <a
                      href={detail.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      [Source]
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="outfits-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outfits.map((outfit, index) => (
              <motion.div
                key={index}
                className={`outfit-card glass-card p-5 cursor-pointer transition-all ${
                  selectedOutfit === index ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => {
                  setSelectedOutfit(index);
                  onOutfitSelect?.(outfit);
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="outfit-score flex flex-col items-end mb-3">
                  <span className="score-label text-xs text-muted-foreground">Trend Score</span>
                  <span className="score-value text-2xl font-bold text-primary">
                    {outfit.trendScore}%
                  </span>
                </div>

                <div className="outfit-items flex flex-wrap gap-2">
                  {outfit.items.map((item, i) => (
                    <div key={i} className="outfit-item flex flex-col items-center gap-1">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted">
                        {item.imageUrl ? (
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.extractedAttributes?.category || "Item"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            👕
                          </div>
                        )}
                      </div>
                      <span className="text-xs truncate max-w-[80px]">
                        {item.extractedAttributes?.color || item.color}{" "}
                        {item.extractedAttributes?.category || item.category}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="outfit-meta flex gap-2 mt-3">
                  <span className="occasion-tag text-xs px-2 py-1 rounded-full bg-muted">
                    {outfit.occasion}
                  </span>
                  <span className="weather-tag text-xs px-2 py-1 rounded-full bg-muted">
                    {outfit.weather}
                  </span>
                </div>

                {outfit.matchedTrends && outfit.matchedTrends.length > 0 && (
                  <div className="matched-trends mt-2 space-y-1">
                    {outfit.matchedTrends.slice(0, 3).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {t.favicon && (
                          <img src={t.favicon} alt="" className="size-3 rounded" />
                        )}
                        <span className="text-muted-foreground">{t.trend}</span>
                        {t.source && (
                          <a
                            href={t.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline shrink-0"
                          >
                            [Source]
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {outfit.reason && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3" title={outfit.reason}>
                    {outfit.reason}
                  </p>
                )}
                {outfit.reason && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3" title={outfit.reason}>
                    {outfit.reason}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          <div className="citation-footer text-center text-xs text-muted-foreground">
            <p>
              Trend data sourced from You.com real-time search.{" "}
              <a
                href="https://you.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Learn more
                <ExternalLink size={10} />
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TrendAwareOutfits;
