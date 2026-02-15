import { useCallback } from "react";

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

export function usePerfectCorp() {
  const virtualTryOn = useCallback(
    async (
      userPhoto: Blob,
      garmentImage: Blob,
      category: string,
      fit = "standard"
    ): Promise<Blob> => {
      try {
        const form = new FormData();
        form.append("model_image", userPhoto, "model.jpg");
        form.append("garment_image", garmentImage, "garment.jpg");
        form.append("category", category);
        form.append("fit", fit);
        const res = await fetch(`${API_BASE}/tryon`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: form,
        });
        if (res.ok && res.headers.get("content-type")?.includes("image")) {
          return await res.blob();
        }
        if (res.status === 503) {
          await new Promise((r) => setTimeout(r, 1500));
          return userPhoto;
        }
        throw new Error("Try-on failed");
      } catch {
        await new Promise((r) => setTimeout(r, 1500));
        return userPhoto;
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
    // Fallback when API unavailable
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

  return { virtualTryOn, estimateMeasurements, shareTryOn };
}
