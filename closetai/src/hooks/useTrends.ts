import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type TrendItem = {
  name: string;
  score: number;
  direction: "up" | "down" | "stable";
  description: string;
};

export type TrendSource = {
  url: string;
  title: string;
  snippet: string;
};

export type TrendsResponse = {
  trends: TrendItem[];
  sources: TrendSource[];
  insights: string[];
  query: string;
  fromApi: boolean;
};

export function useTrends(query = "latest fashion trends 2026") {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trends", query, user?.id],
    queryFn: async () => {
      const res = await api.get<TrendsResponse>(
        `/trends?q=${encodeURIComponent(query)}&limit=10`,
        !!user // send auth for personalized tips when logged in
      );
      return res;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    trends: data?.trends ?? [],
    sources: data?.sources ?? [],
    insights: data?.insights ?? [],
    fromApi: data?.fromApi ?? false,
    isLoading,
    error,
    refetch,
  };
}
