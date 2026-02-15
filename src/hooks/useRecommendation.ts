import { useCallback } from "react";
import { api, getImageUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/services/analytics.service";
import { SAMPLE_WARDROBE, TRENDS } from "@/lib/data";
import type { ClothingItem } from "@/lib/data";

export interface OutfitItem {
  id: string;
  name: string;
  imageUrl: string;
  extractedAttributes?: { color?: string; category?: string };
}

export interface DailyOutfit {
  id: string;
  items: OutfitItem[];
  description: string;
  trendScore: number;
  totalScore?: number;
  occasion?: string;
  weatherTags?: string[];
  trend?: string;
  userRating?: number;
}

const mockOutfits = (): DailyOutfit[] => {
  const items = SAMPLE_WARDROBE.slice(0, 4).map((i) => ({
    id: i.id,
    name: i.name,
    imageUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${i.id}`,
    extractedAttributes: { color: i.color, category: i.category },
  }));
  const trend = TRENDS[Math.floor(Math.random() * TRENDS.length)];
  return [
    {
      id: "o1",
      items,
      description: `A relaxed look combining ${items.map((i) => i.name).join(" & ")}. The ${trend.name.toLowerCase()} vibe ties it all together.`,
      trendScore: 0.85,
    },
    {
      id: "o2",
      items: items.slice(0, 3).map((i, idx) => ({ ...i, id: `${i.id}-2-${idx}` })),
      description: `Effortlessly styled with ${trend.name.toLowerCase()} influence.`,
      trendScore: 0.78,
    },
    {
      id: "o3",
      items: items.slice(1, 4).map((i, idx) => ({ ...i, id: `${i.id}-3-${idx}` })),
      description: `Perfect casual combo with a ${trend.name.toLowerCase()} edge.`,
      trendScore: 0.72,
    },
  ];
};

function toOutfitItem(r: {
  id: string;
  imageUrl?: string;
  extractedAttributes?: { color?: string; category?: string };
  userTags?: string[];
}): OutfitItem {
  const name = r.userTags?.[0] || r.extractedAttributes?.category || "Item";
  return {
    id: r.id,
    name: typeof name === "string" ? name : "Item",
    imageUrl: getImageUrl(r.imageUrl || ""),
    extractedAttributes: r.extractedAttributes,
  };
}

export function useRecommendation() {
  const { user } = useAuth();

  const getDailyOutfits = useCallback(
    async (lat?: number, lng?: number, occasion?: string): Promise<DailyOutfit[]> => {
      if (user) {
        try {
          const params = new URLSearchParams();
          if (lat != null) params.set("lat", String(lat));
          if (lng != null) params.set("lon", String(lng));
          if (occasion) params.set("occasion", occasion);
          const res = await api.get<Array<{
            id: string;
            items: Array<{ id: string; imageUrl?: string; extractedAttributes?: Record<string, string>; userTags?: string[] }>;
            description: string;
            totalScore: number;
            occasion?: string;
            weatherTags?: string[];
            trend?: string;
          }>>(`/recommendations/daily?${params.toString()}`);
          const outfits = res.map((o) => ({
            id: o.id,
            items: o.items.map(toOutfitItem),
            description: o.description,
            trendScore: o.totalScore ?? 0.8,
            totalScore: o.totalScore,
            occasion: o.occasion,
            weatherTags: o.weatherTags,
            trend: o.trend,
          }));
          analytics.track({ name: "outfit_generated", occasion, itemCount: outfits[0]?.items?.length });
          return outfits;
        } catch {
          return mockOutfits();
        }
      }
      await new Promise((r) => setTimeout(r, 600));
      return mockOutfits();
    },
    [user]
  );

  const rateOutfit = useCallback(
    async (outfitId: string, rating: number, reason?: string) => {
      analytics.track({ name: "outfit_rated", outfitId, rating });
      if (user) {
        await api.post("/recommendations/rate", { outfitId, rating, reason });
        return { success: true, outfitId, rating };
      }
      await new Promise((r) => setTimeout(r, 300));
      return { success: true, outfitId, rating };
    },
    [user]
  );

  const saveOutfit = useCallback(
    async (outfit: DailyOutfit) => {
      if (user) {
        const itemIds = outfit.items.map((i) => i.id);
        await api.post("/recommendations/save", {
          items: itemIds,
          occasion: outfit.occasion || "casual",
          weatherTags: outfit.weatherTags,
        });
        return { success: true, outfitId: outfit.id };
      }
      await new Promise((r) => setTimeout(r, 400));
      return { success: true, outfitId: outfit.id };
    },
    [user]
  );

  return { getDailyOutfits, rateOutfit, saveOutfit };
}
