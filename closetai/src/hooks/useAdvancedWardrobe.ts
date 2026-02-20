import { useState, useCallback, useEffect } from "react";
import { DEMO_WARDROBE } from "@/lib/data";
import type { ClothingItem } from "@/lib/data";

export interface WardrobeItem extends ClothingItem {
  imageUrl?: string;
  extractedAttributes?: { color?: string; category?: string };
  userTags?: string[];
  wearCount?: number;
  lastWornDate?: string;
  purchaseDate?: string;
  createdAt?: string;
}

const toWardrobeItem = (i: ClothingItem): WardrobeItem => ({
  ...i,
  imageUrl: i.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${i.id}`,
  extractedAttributes: { color: i.color, category: i.category },
  userTags: [],
  wearCount: i.wearCount ?? Math.floor(Math.random() * 10),
  lastWornDate: i.lastWornDate,
  purchaseDate: i.addedAt,
  createdAt: i.addedAt,
});

export function useAdvancedWardrobe() {
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(() =>
    DEMO_WARDROBE.map(toWardrobeItem)
  );
  const [loading, setLoading] = useState(false);

  const fetchWardrobe = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setWardrobe((prev) =>
      prev.length ? prev : DEMO_WARDROBE.map(toWardrobeItem)
    );
    setLoading(false);
  }, []);

  const addItem = useCallback(async (item: Partial<WardrobeItem>) => {
    const newItem: WardrobeItem = {
      id: Date.now().toString(),
      name: item.name || "New Item",
      category:
        (item.extractedAttributes?.category as WardrobeItem["category"]) ||
        "top",
      color: item.extractedAttributes?.color || "Unknown",
      pattern: "Solid",
      trendScore: 70,
      image: "👕",
      addedAt: new Date().toISOString().slice(0, 10),
      imageUrl:
        item.imageUrl ||
        `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`,
      extractedAttributes: item.extractedAttributes || {},
      userTags: item.userTags || [],
      wearCount: 0,
      purchaseDate: item.purchaseDate,
      createdAt: new Date().toISOString(),
      ...item,
    };
    setWardrobe((prev) => [...prev, newItem]);
    return newItem;
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<WardrobeItem>) => {
    setWardrobe((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setWardrobe((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const bulkDelete = useCallback(async (ids: string[]) => {
    setWardrobe((prev) => prev.filter((i) => !ids.includes(i.id)));
  }, []);

  const filterItems = useCallback(
    (filters: { category?: string; color?: string; tags?: string[] }) => {
      return wardrobe.filter((i) => {
        if (
          filters.category &&
          i.extractedAttributes?.category !== filters.category
        )
          return false;
        if (
          filters.color &&
          i.extractedAttributes?.color !== filters.color
        )
          return false;
        if (
          filters.tags?.length &&
          !filters.tags.every((t) => i.userTags?.includes(t))
        )
          return false;
        return true;
      });
    },
    [wardrobe]
  );

  useEffect(() => {
    fetchWardrobe();
  }, [fetchWardrobe]);

  return {
    wardrobe,
    loading,
    fetchWardrobe,
    addItem,
    updateItem,
    deleteItem,
    bulkDelete,
    filterItems,
  };
}
