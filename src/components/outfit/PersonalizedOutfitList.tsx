import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, RefreshCw } from "lucide-react";
import { api, getImageUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import "./PersonalizedOutfitList.css";

type Citation = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
};

type MatchingTrend = {
  keyword: string;
  citation: Citation;
};

type OutfitItem = {
  id: string;
  imageUrl: string;
  extractedAttributes?: { category?: string; color?: string; pattern?: string };
};

type Outfit = {
  items: OutfitItem[];
  trendScore: number;
  matchingTrends: MatchingTrend[];
};

const PersonalizedOutfitList = () => {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOutfits = async () => {
    setLoading(true);
    try {
      const data = await api.get<Outfit[]>("/recommendations/personalized-trend");
      setOutfits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setOutfits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOutfits();
  }, [user]);

  if (!user) {
    return (
      <div className="personalized-outfits-gate py-6 text-center text-muted-foreground rounded-2xl border border-dashed border-border">
        <p>Sign in to see your trend-aware outfit recommendations.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="personalized-outfits-loading py-8 text-center text-muted-foreground">
        <RefreshCw className="inline-block animate-spin size-5 mb-2" />
        <p>Crafting your personalized outfits...</p>
      </div>
    );
  }

  if (outfits.length === 0) {
    return (
      <div className="personalized-outfits-empty py-8 text-center text-muted-foreground rounded-2xl border border-dashed border-border">
        <p>Add items to your wardrobe to get trend-aware outfit suggestions.</p>
      </div>
    );
  }

  return (
    <div className="personalized-outfits space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold font-display">Your Trend-Aware Outfits</h2>
        <Button variant="outline" size="sm" onClick={fetchOutfits} disabled={loading} className="rounded-full gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
      <div className="outfit-grid">
        {outfits.map((outfit, idx) => (
          <motion.div
            key={idx}
            className="outfit-card glass-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="outfit-items">
              {outfit.items.map((item) => (
                <div key={item.id} className="outfit-item">
                  <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.extractedAttributes?.category || "Item"}
                  />
                  <span>
                    {item.extractedAttributes?.color || ""}{" "}
                    {item.extractedAttributes?.category || ""}
                  </span>
                </div>
              ))}
            </div>
            <div className="trend-score">
              Trendiness: {(outfit.trendScore * 100).toFixed(0)}%
            </div>
            {outfit.matchingTrends && outfit.matchingTrends.length > 0 && (
              <div className="trend-reasons">
                <h4 className="text-sm font-medium mb-2">Why it&apos;s trending:</h4>
                <ul>
                  {outfit.matchingTrends.slice(0, 3).map((match, i) => (
                    <li key={i}>
                      <strong>{match.keyword}</strong> –{" "}
                      <a
                        href={match.citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="trend-citation-link"
                      >
                        {match.citation.source}
                        <ExternalLink size={10} className="inline ml-0.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedOutfitList;
