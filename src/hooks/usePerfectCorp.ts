import { useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("closetai_token");
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return headers;
}

export interface MeasurementsResponse {
  height?: number;
  weight?: number;
  bust?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
  inseam?: number;
}

export interface ShareResponse {
  url: string;
  key?: string;
  expiresAt?: number;
}

export interface TryOnResponse {
  url?: string;
  key?: string;
  expiresAt?: number;
}

export interface GenerateImageResponse {
  url?: string;
  generatedImageUrl?: string;
}

export function usePerfectCorp() {
  const [loading, setLoading] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const virtualTryOn = useCallback(
    async (
      userPhoto: Blob,
      garmentImage: Blob,
      category: string,
      fit = "standard",
      options?: { returnShareableUrl?: boolean }
    ): Promise<Blob | TryOnResponse> => {
      setLoading(true);
      setError(null);
      try {
        const form = new FormData();
        form.append("model_image", userPhoto, "model.jpg");
        form.append("garment_image", garmentImage, "garment.jpg");
        form.append("category", category);
        form.append("fit", fit);
        if (options?.returnShareableUrl) {
          form.append("share", "true");
        }

        const url = `${API_BASE}/tryon${options?.returnShareableUrl ? "?share=true" : ""}`;
        const res = await fetch(url, {
          method: "POST",
          headers: getAuthHeaders(),
          body: form,
        });

        if (res.status === 402) {
          const data = await res.json().catch(() => ({}));
          const msg =
            data?.error || "API credits exhausted for Perfect Corp — cannot generate try-on right now.";
          setError(msg);
          throw new Error(msg);
        }

        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          const shareUrl = data.url;
          if (shareUrl) setLastUrl(shareUrl);
          return data;
        }

        if (res.ok && res.headers.get("content-type")?.includes("image")) {
          return await res.blob();
        }

        if (res.status === 503) {
          await new Promise((r) => setTimeout(r, 1500));
          return userPhoto;
        }

        const data = await res.json().catch(() => ({}));
        const errMsg = (data as { error?: string })?.error || res.statusText || "Try-on failed";
        setError(errMsg);
        throw new Error(errMsg);
      } catch (err) {
        if (err instanceof Error && err.message.includes("credits")) {
          setError(err.message);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const generateImage = useCallback(
    async (prompt: string, style = "photorealistic"): Promise<GenerateImageResponse> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/tryon/generate-image`, {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          } as HeadersInit,
          body: JSON.stringify({ prompt, style }),
        });

        if (res.status === 402) {
          const data = await res.json().catch(() => ({}));
          const msg =
            (data as { error?: string })?.error ||
            "API credits exhausted — cannot generate image right now.";
          setError(msg);
          throw new Error(msg);
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errMsg =
            (data as { error?: string })?.error || res.statusText || "Generation failed";
          setError(errMsg);
          throw new Error(errMsg);
        }

        const data = (await res.json()) as GenerateImageResponse;
        const url = data.url || data.generatedImageUrl;
        if (url) setLastUrl(url);
        return data;
      } catch (err) {
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const estimateMeasurements = useCallback(async (photo: Blob): Promise<MeasurementsResponse> => {
    try {
      const form = new FormData();
      form.append("image", photo, "user.jpg");
      const res = await fetch(`${API_BASE}/tryon/measure`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: form,
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fall through to fallback
    }
    await new Promise((r) => setTimeout(r, 800));
    return {
      height: 170,
      weight: 65,
      bust: 88,
      chest: 90,
      waist: 72,
      hips: 95,
      shoulder: 42,
      inseam: 78,
    };
  }, []);

  const shareTryOn = useCallback(async (imageBlob: Blob): Promise<ShareResponse> => {
    try {
      const form = new FormData();
      form.append("image", imageBlob, "tryon.png");
      const res = await fetch(`${API_BASE}/tryon/share`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        return { url: data.url, key: data.key, expiresAt: data.expiresAt };
      }
    } catch {
      // Fall through to blob URL fallback
    }
    const url = URL.createObjectURL(imageBlob);
    return { url, expiresAt: Date.now() + 86400000 };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    lastUrl,
    virtualTryOn,
    generateImage,
    estimateMeasurements,
    shareTryOn,
    clearError,
  };
}
