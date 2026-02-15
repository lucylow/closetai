import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useContent() {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [styledImageUrl, setStyledImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateCaption = useCallback(
    async (outfitDescription: string, tone = "casual", occasion = "casual") => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const res = await api.post<{ caption: string }>("/content/caption", {
          outfitDescription,
          tone,
          occasion,
        });
        setCaption(res.caption);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate caption");
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const suggestHashtags = useCallback(
    async (outfitAttributes: Record<string, string>) => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await api.post<{ hashtags: string[] }>("/content/hashtags", {
          outfitAttributes,
        });
        setHashtags(res.hashtags);
      } catch {
        setHashtags([]);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const generateStyledImage = useCallback(
    async (prompt: string, style = "photorealistic") => {
      if (!user) return null;
      setLoading(true);
      setError("");
      try {
        const blob = await api.blob("/content/generate-image", { prompt, style });
        const url = URL.createObjectURL(blob);
        setStyledImageUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        return url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate image");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  return {
    caption,
    hashtags,
    styledImageUrl,
    loading,
    error,
    generateCaption,
    suggestHashtags,
    generateStyledImage,
    isAuthenticated: !!user,
  };
}
