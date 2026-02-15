import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export type TrendSource = {
  url: string;
  title: string;
  favicon?: string | null;
  date?: string | null;
};

export type Trend = {
  title: string;
  description?: string;
  url?: string;
  snippet?: string;
  source?: string;
  favicon?: string | null;
  relevance?: number;
  relevance_score?: number;
  insights?: { text: string; confidence?: number; keywords?: string[] }[];
};

export type FashionTrendsData = {
  query: string;
  timestamp: string;
  trends: Trend[];
  sources: TrendSource[];
  meta?: { rateInfo?: { limit?: string; remaining?: string; reset?: string }; fallback?: boolean };
};

export type FashionTrendsResponse = {
  success: boolean;
  data: FashionTrendsData;
  meta?: { rateInfo?: unknown; fallback?: boolean };
};

export function useFashionTrends({
  category = "all",
  season = null,
  limit = 12,
}: {
  category?: string;
  season?: string | null;
  limit?: number;
} = {}) {
  const [trends, setTrends] = useState<FashionTrendsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = {
          category,
          limit,
        };
        if (season) params.season = season;
        if (force) params.force = "true";
        const query = new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)])
        ).toString();
        const res = await api.get<FashionTrendsResponse>(
          `/trends/fashion?${query}`,
          false
        );
        const payload = res?.data ?? res;
        setTrends(typeof payload === "object" && "trends" in payload ? payload : null);
      } catch (err) {
        setError(
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error || (err as Error).message || "Failed to fetch trends"
        );
      } finally {
        setLoading(false);
      }
    },
    [category, season, limit]
  );

  useEffect(() => {
    fetch(false);
  }, [fetch]);

  return { trends, loading, error, refresh: () => fetch(true) };
}
