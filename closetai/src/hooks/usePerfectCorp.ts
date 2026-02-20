import { useState, useCallback } from "react";
import { demoVirtualTryOnGallery, demoAIGeneratedOutfits } from "@/mocks/youcam";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const DEMO_MODE = true;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("closetai_token");
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  return headers;
}

export type TryOnErrorType =
  | "network"
  | "timeout"
  | "credits_exhausted"
  | "server_error"
  | "garment_fetch"
  | "camera"
  | "unknown";

export interface TryOnError {
  type: TryOnErrorType;
  message: string;
  retryable: boolean;
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

function classifyError(err: unknown, context?: string): TryOnError {
  if (err instanceof TypeError && (
    err.message.includes("Failed to fetch") ||
    err.message.includes("NetworkError") ||
    err.message.includes("Load failed")
  )) {
    return {
      type: "network",
      message: "Network connection issue. Please check your internet and try again.",
      retryable: true,
    };
  }

  if (err instanceof DOMException && err.name === "AbortError") {
    return {
      type: "timeout",
      message: "The request took too long. Please try again.",
      retryable: true,
    };
  }

  if (err instanceof Error) {
    if (err.message.includes("credits") || err.message.includes("402")) {
      return {
        type: "credits_exhausted",
        message: "AI credits are currently exhausted. Try again later or contact support.",
        retryable: false,
      };
    }
    if (context === "garment_fetch") {
      return {
        type: "garment_fetch",
        message: `Could not load garment image: ${err.message}`,
        retryable: true,
      };
    }
    return {
      type: "unknown",
      message: err.message || "Something went wrong. Please try again.",
      retryable: true,
    };
  }

  return {
    type: "unknown",
    message: "An unexpected error occurred. Please try again.",
    retryable: true,
  };
}

const REQUEST_TIMEOUT_MS = 60_000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function usePerfectCorp() {
  const [loading, setLoading] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<TryOnError | null>(null);

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
      setErrorDetails(null);

      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 1500));
        const match = demoVirtualTryOnGallery.find((v) => v.category === category) || demoVirtualTryOnGallery[0];
        const url = match.resultImage;
        setLastUrl(url);
        setLoading(false);
        return { url };
      }

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
        const res = await fetchWithTimeout(url, {
          method: "POST",
          headers: getAuthHeaders(),
          body: form,
        });

        if (res.status === 402) {
          const data = await res.json().catch(() => ({}));
          const msg =
            data?.error || "API credits exhausted for Perfect Corp — cannot generate try-on right now.";
          const errObj: TryOnError = { type: "credits_exhausted", message: msg, retryable: false };
          setError(msg);
          setErrorDetails(errObj);
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
          const errObj: TryOnError = {
            type: "server_error",
            message: "The try-on service is temporarily unavailable. Please try again in a moment.",
            retryable: true,
          };
          setError(errObj.message);
          setErrorDetails(errObj);
          throw new Error(errObj.message);
        }

        const data = await res.json().catch(() => ({}));
        const errMsg = (data as { error?: string })?.error || res.statusText || "Try-on failed";
        const errObj: TryOnError = {
          type: "server_error",
          message: errMsg,
          retryable: res.status >= 500,
        };
        setError(errMsg);
        setErrorDetails(errObj);
        throw new Error(errMsg);
      } catch (err) {
        const classified = classifyError(err);
        setError(classified.message);
        setErrorDetails(classified);
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
      setErrorDetails(null);

      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 2000));
        const lower = prompt.toLowerCase();
        let match = demoAIGeneratedOutfits[0];
        if (lower.includes("blazer") || lower.includes("work") || lower.includes("professional")) match = demoAIGeneratedOutfits.find((o) => o.occasion === "Work") || match;
        else if (lower.includes("floral") || lower.includes("dress") || lower.includes("brunch")) match = demoAIGeneratedOutfits.find((o) => o.occasion === "Brunch") || match;
        else if (lower.includes("leather") || lower.includes("edge") || lower.includes("weekend")) match = demoAIGeneratedOutfits.find((o) => o.occasion === "Weekend") || match;
        const url = match.imageUrl;
        setLastUrl(url);
        setLoading(false);
        return { url, generatedImageUrl: url };
      }

      try {
        const res = await fetchWithTimeout(`${API_BASE}/tryon/generate-image`, {
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
          const errObj: TryOnError = { type: "credits_exhausted", message: msg, retryable: false };
          setError(msg);
          setErrorDetails(errObj);
          throw new Error(msg);
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errMsg =
            (data as { error?: string })?.error || res.statusText || "Generation failed";
          const errObj: TryOnError = {
            type: "server_error",
            message: errMsg,
            retryable: res.status >= 500,
          };
          setError(errMsg);
          setErrorDetails(errObj);
          throw new Error(errMsg);
        }

        const data = (await res.json()) as GenerateImageResponse;
        const url = data.url || data.generatedImageUrl;
        if (url) setLastUrl(url);
        return data;
      } catch (err) {
        const classified = classifyError(err);
        setError(classified.message);
        setErrorDetails(classified);
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
      const res = await fetchWithTimeout(`${API_BASE}/tryon/measure`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: form,
      }, 30_000);
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
      const res = await fetchWithTimeout(`${API_BASE}/tryon/share`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: form,
      }, 30_000);
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

  const clearError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

  return {
    loading,
    error,
    errorDetails,
    lastUrl,
    virtualTryOn,
    generateImage,
    estimateMeasurements,
    shareTryOn,
    clearError,
  };
}
