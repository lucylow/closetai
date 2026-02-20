/**
 * Shared TypeScript types for Creative Shopping Journey
 */

export interface Recommendation {
  id: string;
  score: number;
  items: Array<{
    sku: string;
    name: string;
    imageUrl: string;
    colorHex?: string;
  }>;
  outfitImageUrl?: string;
  caption?: string;
  hashtags?: string[];
  rationale?: string;
  costEstimate?: { total: number; currency: string };
  source: 'market' | 'affiliate' | 'internal';
}

export interface TryonTask {
  taskId: string;
  status: 'pending' | 'success' | 'error';
  result?: {
    compositeUrl: string;
    masks: { [sku: string]: string };
  };
}

export interface GenerateRequest {
  userId?: string;
  seedItemIds: string[];
  context: {
    occasion?: string;
    weather?: string;
    vibe?: string;
  };
  options: {
    numResults?: number;
    includeContent?: boolean;
  };
}

export interface TryonRequest {
  userId?: string;
  baseImageUrl?: string;
  recommendationId?: string;
  transforms?: {
    brightness?: number;
    scale?: number;
    rotation?: number;
  };
  consent: boolean;
}

export interface SeedItem {
  id: string;
  name: string;
  imageUrl: string;
  colorHex?: string;
}

export interface Trend {
  id: string;
  name: string;
  category: string;
  popularity: number;
}