// services/mockApi.ts - Simulated API service for demo mode
import { wardrobeItems } from "@/mocks/wardrobe";
import { currentUser } from "@/mocks/user";
import { dailyOutfits } from "@/mocks/outfits";
import { fashionTrends } from "@/mocks/trends";
import { tryOnResults } from "@/mocks/tryon";
import {
  generatedCaption,
  suggestedHashtags,
  styledImage,
} from "@/mocks/content";
import { shoppingAnalysis } from "@/mocks/shopping";

// Simulate network delay
const delay = (ms = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  // Auth
  login: async (email: string, password: string) => {
    await delay();
    if (email === "demo@closetai.com" && password === "password") {
      return { user: currentUser, token: "mock-jwt-token" };
    }
    throw new Error("Invalid credentials");
  },
  register: async (_email: string, _password: string) => {
    await delay();
    return { user: currentUser, token: "mock-jwt-token" };
  },

  // Wardrobe
  getWardrobe: async () => {
    await delay();
    return wardrobeItems;
  },
  addWardrobeItem: async (formData: FormData) => {
    await delay(1000);
    return {
      id: "item-new",
      ...Object.fromEntries(formData),
    };
  },
  deleteWardrobeItem: async (_id: string) => {
    await delay();
    return { success: true };
  },
  recordWear: async (id: string) => {
    await delay();
    const item = wardrobeItems.find((i) => i.id === id);
    if (item) (item as { wearCount: number }).wearCount++;
    return item;
  },

  // Recommendations
  getDailyOutfits: async (
    _lat?: number,
    _lon?: number,
    occasion?: string
  ) => {
    await delay();
    return occasion
      ? dailyOutfits.filter((o) => o.occasion === occasion)
      : dailyOutfits;
  },
  rateOutfit: async (_outfitId: string, _rating: number) => {
    await delay();
    return { success: true };
  },

  // Fashion research (You.com)
  getFashionReport: async (_occasion?: string) => {
    await delay();
    return fashionTrends;
  },

  // Virtual try-on (Perfect Corp)
  virtualTryOn: async (
    _modelImage: Blob | string,
    _garmentImage: Blob | string,
    _options?: Record<string, unknown>
  ) => {
    await delay(2000);
    const resultUrl =
      tryOnResults["model-default-garment-003"] ||
      tryOnResults["model-default-garment-004"];
    const response = await fetch(resultUrl);
    const blob = await response.blob();
    return blob;
  },

  // Content generation
  generateCaption: async (
    _outfitDescription: string,
    tone: string,
    _occasion?: string
  ) => {
    await delay();
    return {
      caption: generatedCaption[tone] || generatedCaption.casual,
    };
  },
  suggestHashtags: async (_outfitAttributes?: Record<string, unknown>) => {
    await delay();
    return { hashtags: suggestedHashtags };
  },
  generateStyledImage: async (_prompt: string, _style?: string) => {
    await delay(1500);
    const response = await fetch(styledImage);
    const blob = await response.blob();
    return blob;
  },

  // Shopping
  analyzeScreenshot: async (_imageFile: File) => {
    await delay(1200);
    return shoppingAnalysis;
  },
};
