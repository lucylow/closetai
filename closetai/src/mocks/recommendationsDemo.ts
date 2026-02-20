/**
 * Recommendations Mock Data
 */

export interface RecommendationItem {
  sku: string;
  name: string;
  imageUrl: string;
  price: number;
  brand: string;
}

export interface Recommendation {
  id: string;
  score: number;
  items: RecommendationItem[];
  outfitComposite: string;
  caption: string;
  hashtags: string[];
  rationale: string;
  costEstimate: { total: number; currency: string };
  affiliateUrl: string;
  source: string;
}
