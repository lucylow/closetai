// src/types.ts
export type SeedItem = {
  id: string;
  name?: string;
  imageUrl: string;
  colorHex?: string | null;
  sku?: string | null;
  metadata?: Record<string, unknown>;
};

export type RecommendationItem = {
  sku: string;
  name: string;
  imageUrl: string;
  price?: number;
  colorHex?: string | null;
};

export type Recommendation = {
  id: string;
  score: number;
  items: RecommendationItem[];
  outfitImageUrl?: string;
  caption?: string;
  hashtags?: string[];
  rationale?: string;
  costEstimate?: { total: number; currency: string } | null;
  source?: "market" | "affiliate" | "internal";
};

export type TryOnTask = {
  taskId: string;
  status: "pending" | "success" | "error";
  result?: {
    compositeUrl: string;
    masks?: Record<string, string>;
  };
};
