import { useCallback } from "react";
import { api, getImageUrl } from "@/lib/api";

export interface ProcessedItem {
  id: string;
  name: string;
  imageUrl: string;
  extractedAttributes?: { color?: string; category?: string; pattern?: string; style?: string };
  userTags?: string[];
}

export function useImageProcessing() {
  const uploadAndProcess = useCallback(async (file: File): Promise<ProcessedItem> => {
    const token = localStorage.getItem("closetai_token");
    if (token) {
      const item = await api.upload<{
        id: string;
        imageUrl: string;
        extractedAttributes?: { color?: string; category?: string; pattern?: string; style?: string };
        userTags?: string[];
      }>("/wardrobe", file);
      return {
        id: item.id,
        name: file.name.replace(/\.[^/.]+$/, ""),
        imageUrl: getImageUrl(item.imageUrl) || item.imageUrl,
        extractedAttributes: item.extractedAttributes || {},
        userTags: item.userTags || [],
      };
    }
    // Fallback mock when not authenticated
    await new Promise((r) => setTimeout(r, 1500));
    const url = URL.createObjectURL(file);
    const id = Date.now().toString();
    return {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""),
      imageUrl: url,
      extractedAttributes: {
        color: ["Black", "White", "Blue", "Red", "Gray"][Math.floor(Math.random() * 5)],
        category: ["top", "bottom", "outerwear", "dress", "shoes", "accessory"][
          Math.floor(Math.random() * 6)
        ],
      },
      userTags: [],
    };
  }, []);

  const removeBackground = useCallback(async (file: File): Promise<Blob> => {
    await new Promise((r) => setTimeout(r, 800));
    return file;
  }, []);

  const extractAttributes = useCallback(
    async (file: File) => {
      await new Promise((r) => setTimeout(r, 600));
      return {
        color: "Blue",
        category: "top",
        pattern: "Solid",
      };
    },
    []
  );

  return { uploadAndProcess, removeBackground, extractAttributes };
}
