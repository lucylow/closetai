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
