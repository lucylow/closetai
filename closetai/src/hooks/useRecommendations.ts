import { useQuery } from "@tanstack/react-query";
import { api, getImageUrl } from "@/lib/api";
import type { ClothingItem } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";

type WardrobeItemResponse = {
  id: string;
  imageUrl: string;
  extractedAttributes: { category?: string; color?: string; pattern?: string };
  userTags: string[];
};

type OutfitResponse = {
  id: string;
  items: WardrobeItemResponse[];
  occasion: string;
  description: string;
  totalScore: number;
  trend: string;
};

function toClothingItem(r: WardrobeItemResponse): ClothingItem {
  const cat = (r.extractedAttributes?.category || "top") as ClothingItem["category"];
  const emojis: Record<string, string> = {
    top: "👕",
    bottom: "👖",
    outerwear: "🧥",
    dress: "👗",
    shoes: "👟",
    accessory: "🧢",
  };
  const name = r.userTags?.[0] || r.extractedAttributes?.category || "Item";
  return {
    id: r.id,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    category: cat,
    color: (r.extractedAttributes?.color || "Unknown").charAt(0).toUpperCase() + (r.extractedAttributes?.color || "").slice(1),
    pattern: (r.extractedAttributes?.pattern || "Solid").charAt(0).toUpperCase() + (r.extractedAttributes?.pattern || "").slice(1),
    trendScore: 70,
    image: emojis[cat] || "👕",
    imageUrl: getImageUrl(r.imageUrl),
    addedAt: "",
  };
}

export type DailyOutfit = {
  id: string;
  items: ClothingItem[];
  occasion: string;
  description: string;
  totalScore: number;
  trend: string;
};

/** Raw recommendation engine response (POST /recommendations/recommend) */
export type TrendRecommendationResult = {
  userId: string;
  generatedAt: string;
  trendInsights: {
    summary: string;
    details: { title: string; url: string; relevance?: number }[];
    fetchedAt?: string;
    sourceCount?: number;
    rateInfo?: unknown;
  };
  outfits: {
    rank: number;
    items: { id: string; category: string; color: string; imageUrl?: string; trendScore: number; name?: string }[];
    score: number;
    avgTrend: number;
    styleScore: number;
    occasion: string | null;
    weather: { condition: string; temp?: number } | null;
    matchedTrends: { trend: string; url: string; relevance: number }[];
    reason: string;
  }[];
};

/** Fetch trend-aware outfit recommendations (raw engine format). Example:
 * const result = await fetchTrendRecommendations(wardrobe, { occasion: "work", weather: { condition: "cold", temp: 8 } });
 */
export async function fetchTrendRecommendations(
  wardrobe: { id: string; category?: string; color?: string; style?: string; pattern?: string; imageUrl?: string; tags?: string[]; wear_count?: number; wearCount?: number; extractedAttributes?: Record<string, unknown> }[],
  options?: { occasion?: string; weather?: { condition: string; temp?: number }; userId?: string }
): Promise<TrendRecommendationResult> {
  return api.post<TrendRecommendationResult>("/recommendations/recommend", {
    userId: options?.userId ?? "user123",
    wardrobe,
    occasion: options?.occasion ?? "work",
    weather: options?.weather ?? { condition: "cold", temp: 8 },
  });
}

export function useRecommendations(occasion = "casual") {
  const { user } = useAuth();

  const { data: dailyOutfits = [], isLoading } = useQuery({
    queryKey: ["recommendations", user?.id, occasion],
    queryFn: async () => {
      const res = await api.get<OutfitResponse[]>(`/recommendations/daily?occasion=${encodeURIComponent(occasion)}`);
      return res.map((o) => ({
        id: o.id,
        items: o.items.map(toClothingItem),
        occasion: o.occasion,
        description: o.description,
        totalScore: o.totalScore,
        trend: o.trend,
      }));
    },
    enabled: !!user,
  });

  return {
    dailyOutfits,
    isLoading,
    isAuthenticated: !!user,
  };
}
