export interface ClothingItem {
  id: string;
  name: string;
  category: "top" | "bottom" | "outerwear" | "dress" | "shoes" | "accessory";
  color: string;
  pattern: string;
  trendScore: number;
  image: string; // emoji placeholder or image URL
  imageUrl?: string; // optional real image URL for demo
  addedAt: string;
  wearCount?: number;
  lastWornDate?: string;
}

export interface OutfitSuggestion {
  id: string;
  items: ClothingItem[];
  trend: string;
  occasion: string;
  description: string;
  score: number;
}

export const SAMPLE_WARDROBE: ClothingItem[] = [
  { id: "1", name: "White T-shirt", category: "top", color: "White", pattern: "Solid", trendScore: 85, image: "/images/wardrobe/white-tee.jpg", imageUrl: "/images/wardrobe/white-tee.jpg", addedAt: "2026-01-15" },
  { id: "2", name: "Blue Jeans", category: "bottom", color: "Blue", pattern: "Solid", trendScore: 62, image: "/images/wardrobe/blue-jeans.jpg", imageUrl: "/images/wardrobe/blue-jeans.jpg", addedAt: "2026-01-10" },
  { id: "3", name: "Leather Jacket", category: "outerwear", color: "Black", pattern: "Solid", trendScore: 94, image: "/images/wardrobe/leather-jacket.jpg", imageUrl: "/images/wardrobe/leather-jacket.jpg", addedAt: "2026-02-01" },
  { id: "4", name: "Floral Dress", category: "dress", color: "Pink", pattern: "Floral", trendScore: 78, image: "/images/wardrobe/floral-dress.jpg", imageUrl: "/images/wardrobe/floral-dress.jpg", addedAt: "2025-12-20" },
  { id: "5", name: "White Sneakers", category: "shoes", color: "White", pattern: "Solid", trendScore: 70, image: "/images/wardrobe/sneakers.jpg", imageUrl: "/images/wardrobe/sneakers.jpg", addedAt: "2026-01-05" },
  { id: "6", name: "Wool Beanie", category: "accessory", color: "Gray", pattern: "Knit", trendScore: 45, image: "/images/wardrobe/wool-beanie.jpg", imageUrl: "/images/wardrobe/wool-beanie.jpg", addedAt: "2025-11-12" },
  { id: "7", name: "Plaid Shirt", category: "top", color: "Red", pattern: "Plaid", trendScore: 88, image: "/images/wardrobe/plaid-shirt.jpg", imageUrl: "/images/wardrobe/plaid-shirt.jpg", addedAt: "2026-01-22" },
  { id: "8", name: "Khaki Chinos", category: "bottom", color: "Beige", pattern: "Solid", trendScore: 59, image: "/images/wardrobe/khaki-chinos.jpg", imageUrl: "/images/wardrobe/khaki-chinos.jpg", addedAt: "2026-01-18" },
  { id: "9", name: "Black Boots", category: "shoes", color: "Black", pattern: "Solid", trendScore: 91, image: "/images/wardrobe/black-boots.jpg", imageUrl: "/images/wardrobe/black-boots.jpg", addedAt: "2025-10-30" },
  { id: "10", name: "Denim Jacket", category: "outerwear", color: "Blue", pattern: "Solid", trendScore: 82, image: "/images/wardrobe/denim-jacket.jpg", imageUrl: "/images/wardrobe/denim-jacket.jpg", addedAt: "2026-02-05" },
  { id: "11", name: "Silk Blouse", category: "top", color: "Cream", pattern: "Solid", trendScore: 76, image: "/images/wardrobe/silk-blouse.jpg", imageUrl: "/images/wardrobe/silk-blouse.jpg", addedAt: "2026-01-28" },
  { id: "12", name: "Sunglasses", category: "accessory", color: "Black", pattern: "Solid", trendScore: 65, image: "/images/wardrobe/sunglasses.jpg", imageUrl: "/images/wardrobe/sunglasses.jpg", addedAt: "2026-02-10" },
];

export const TRENDS = [
  { name: "Oversized Blazers", score: 94, direction: "up" as const, description: "Relaxed tailoring continues to dominate street style and office wear." },
  { name: "Wide-Leg Trousers", score: 88, direction: "up" as const, description: "Comfort meets elegance – flowing silhouettes are in." },
  { name: "Sustainable Linen", score: 82, direction: "up" as const, description: "Eco-conscious fabrics gaining traction across all demographics." },
  { name: "90s Vintage", score: 79, direction: "stable" as const, description: "Nostalgic aesthetics remain a staple in casual fashion." },
  { name: "Monochrome Layering", score: 73, direction: "up" as const, description: "Single-color outfits with textural depth are trending." },
  { name: "Chunky Loafers", score: 68, direction: "down" as const, description: "Platform shoes are slowly being replaced by sleeker silhouettes." },
];

export const OCCASIONS = ["Casual", "Work", "Date Night", "Party", "Outdoor", "Formal"];

/** Dress codes for filtering outfit suggestions (e.g. "Casual Friday") */
export const DRESS_CODES = [
  "Any",
  "Casual Friday",
  "Business Casual",
  "Smart Casual",
  "Business Formal",
  "Creative",
  "Athleisure",
];

export const CATEGORY_LABELS: Record<string, string> = {
  top: "Tops",
  bottom: "Bottoms",
  outerwear: "Outerwear",
  dress: "Dresses",
  shoes: "Shoes",
  accessory: "Accessories",
};

// --- Mock data for demo (from mocks/) ---
import { wardrobeItems } from "@/mocks/wardrobe";
import { fashionTrends } from "@/mocks/trends";
import { dailyOutfits } from "@/mocks/outfits";
import { shoppingAnalysis } from "@/mocks/shopping";
import { businessMetrics } from "@/mocks/business";
import { generatedCaption, suggestedHashtags } from "@/mocks/content";

const MOCK_ITEM_NAMES: Record<string, string> = {
  "item-001": "White Tee",
  "item-002": "Black Jeans",
  "item-003": "Floral Dress",
  "item-004": "Leather Jacket",
  "item-005": "Sneakers",
  "item-006": "Wool Scarf",
  "item-007": "Navy Blazer",
  "item-008": "Silk Blouse",
  "item-009": "Khaki Chinos",
  "item-010": "Summer Hat",
};

/** Convert mock wardrobe items to ClothingItem format for UI compatibility */
export function mockWardrobeToClothingItems(): ClothingItem[] {
  const scoredMap = Object.fromEntries(
    fashionTrends.scoredItems.map((s) => [s.itemId, Math.round(s.trendScore * 100)])
  );
  return wardrobeItems.map((w) => ({
    id: w.id,
    name: MOCK_ITEM_NAMES[w.id] || w.extractedAttributes.category,
    category: w.extractedAttributes.category as ClothingItem["category"],
    color: w.extractedAttributes.color,
    pattern: w.extractedAttributes.pattern,
    trendScore: scoredMap[w.id] ?? 70,
    image: w.imageUrl,
    imageUrl: w.imageUrl,
    addedAt: w.purchaseDate,
    wearCount: w.wearCount,
    lastWornDate: w.lastWornDate,
  }));
}

/** Mock trends in format expected by Trends page */
export const MOCK_TRENDS = [
  { name: "Oversized silhouettes", score: 94, direction: "up" as const, description: "Relaxed tailoring continues to dominate street style and office wear." },
  { name: "Floral prints", score: 88, direction: "up" as const, description: "From the runways to your closet – florals are everywhere this season." },
  { name: "Sustainable linen", score: 82, direction: "up" as const, description: "Eco-conscious fabrics gaining traction across all demographics." },
  { name: "90s vintage", score: 79, direction: "stable" as const, description: "Nostalgic aesthetics remain a staple in casual fashion." },
  { name: "Monochrome styling", score: 73, direction: "up" as const, description: "Single-color outfits with textural depth are trending." },
  { name: "Leather accents", score: 68, direction: "down" as const, description: "Edgy leather pieces add attitude to any outfit." },
];

/** Use mock data for demo - set to true to enable full demo mode */
export const USE_MOCK_DATA = true;

/** Wardrobe items for demo (uses mock data when USE_MOCK_DATA is true) */
export const DEMO_WARDROBE = USE_MOCK_DATA ? mockWardrobeToClothingItems() : SAMPLE_WARDROBE;

/** Trends for demo */
export const DEMO_TRENDS = USE_MOCK_DATA ? MOCK_TRENDS : TRENDS;

/** Re-export mock data for pages that need it directly */
export { dailyOutfits, fashionTrends, shoppingAnalysis, businessMetrics, generatedCaption, suggestedHashtags };
