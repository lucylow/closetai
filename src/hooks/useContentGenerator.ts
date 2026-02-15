import { useCallback } from "react";
import { api } from "@/lib/api";

const DEMO_HASHTAGS = [
  "#OOTD",
  "#fashion",
  "#style",
  "#ClosetAI",
  "#AIstylist",
  "#outfit",
  "#wardrobe",
  "#fashiontech",
  "#sustainablefashion",
  "#streetstyle",
];

async function demoStyledImage(outfitDescription: string): Promise<Blob> {
  await new Promise((r) => setTimeout(r, 1500));
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "hsl(260, 30%, 95%)";
    ctx.fillRect(0, 0, 400, 400);
    ctx.fillStyle = "hsl(260, 65%, 58%)";
    ctx.font = "24px sans-serif";
    ctx.fillText("AI Styled Image", 100, 200);
    ctx.font = "14px sans-serif";
    ctx.fillText(outfitDescription.slice(0, 30), 50, 240);
  }
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob || new Blob()), "image/png")
  );
}

export function useContentGenerator() {
  const generateCaption = useCallback(
    async (
      outfitDescription: string,
      tone: string,
      occasion: string
    ): Promise<{ caption: string }> => {
      const hasToken = !!localStorage.getItem("closetai_token");
      if (hasToken) {
        try {
          const res = await api.post<{ caption: string }>("/content/caption", {
            outfitDescription,
            tone,
            occasion,
          });
          return res;
        } catch {
          // Fall through to demo
        }
      }
      await new Promise((r) => setTimeout(r, 800));
      return {
        caption: `✨ Today's #OOTD: ${outfitDescription}. Loving the ${tone} ${occasion} vibe! #AIstylist #ClosetAI #fashion`,
      };
    },
    []
  );

  const suggestHashtags = useCallback(
    async (attributes?: Record<string, unknown>): Promise<{ hashtags: string[] }> => {
      const hasToken = !!localStorage.getItem("closetai_token");
      if (hasToken) {
        try {
          const res = await api.post<{ hashtags: string[] }>("/content/hashtags", {
            outfitAttributes: attributes || {},
          });
          return res;
        } catch {
          // Fall through to demo
        }
      }
      await new Promise((r) => setTimeout(r, 500));
      return { hashtags: DEMO_HASHTAGS };
    },
    []
  );

  const generateStyledImage = useCallback(
    async (outfitDescription: string, style: string): Promise<Blob> => {
      const hasToken = !!localStorage.getItem("closetai_token");
      if (hasToken) {
        try {
          return await api.blob("/content/generate-image", {
            prompt: outfitDescription,
            style: style || "photorealistic",
          });
        } catch {
          // Fall through to demo
        }
      }
      return demoStyledImage(outfitDescription);
    },
    []
  );

  return { generateCaption, suggestHashtags, generateStyledImage };
}
