import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getImageUrl } from "@/lib/api";
import type { ClothingItem } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { analytics } from "@/services/analytics.service";

type WardrobeItemResponse = {
  id: string;
  imageUrl: string;
  imageKey?: string;
  extractedAttributes: { category?: string; color?: string; pattern?: string; style?: string };
  userTags: string[];
  wearCount: number;
  lastWornDate: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  createdAt: string;
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
    addedAt: r.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    wearCount: r.wearCount ?? 0,
  };
}

export function useWardrobe(category?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wardrobe", user?.id, category],
    queryFn: async () => {
      const params = category && category !== "all" ? `?category=${category}` : "";
      const res = await api.get<WardrobeItemResponse[]>(`/wardrobe${params}`);
      return res.map(toClothingItem);
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (payload: File | { file: File; tags?: string[]; purchaseDate?: string; purchasePrice?: number }) => {
      const file = payload instanceof File ? payload : payload.file;
      const extra = payload instanceof File ? undefined : payload;
      const formExtra: Record<string, string> = {};
      if (extra?.tags?.length) formExtra.tags = JSON.stringify(extra.tags);
      if (extra?.purchaseDate) formExtra.purchaseDate = extra.purchaseDate;
      if (extra?.purchasePrice != null) formExtra.purchasePrice = String(extra.purchasePrice);
      return api.upload<WardrobeItemResponse>("/wardrobe", file, Object.keys(formExtra).length ? formExtra : undefined);
    },
    onSuccess: (data) => {
      analytics.track({ name: "wardrobe_item_added", category: data?.extractedAttributes?.category });
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      queryClient.invalidateQueries({ queryKey: ["wardrobe-stats"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ userTags: string[]; extractedAttributes: Record<string, unknown>; purchaseDate: string | null; purchasePrice: number | null }> }) => {
      return api.patch<WardrobeItemResponse>(`/wardrobe/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      queryClient.invalidateQueries({ queryKey: ["wardrobe-stats"] });
    },
  });

  const recordWearMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post<WardrobeItemResponse>(`/wardrobe/${id}/wear`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      queryClient.invalidateQueries({ queryKey: ["wardrobe-stats"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/wardrobe/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wardrobe"] });
      queryClient.invalidateQueries({ queryKey: ["wardrobe-stats"] });
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["wardrobe-stats", user?.id],
    queryFn: async () => {
      const res = await api.get<{
        totalItems: number;
        wornLast30Days: number;
        avgWearCount: number;
        categoryBreakdown: Record<string, number>;
      }>("/wardrobe/stats");
      return res;
    },
    enabled: !!user,
  });

  return {
    items,
    isLoading,
    stats,
    statsLoading,
    addItem: addMutation.mutateAsync,
    addLoading: addMutation.isPending,
    updateItem: updateMutation.mutateAsync,
    updateLoading: updateMutation.isPending,
    recordWear: recordWearMutation.mutateAsync,
    recordWearLoading: recordWearMutation.isPending,
    deleteItem: deleteMutation.mutateAsync,
    deleteLoading: deleteMutation.isPending,
    isAuthenticated: !!user,
  };
}
