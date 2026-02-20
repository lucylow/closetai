import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import "./TrendsWithCitations.css";

type Citation = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  favicon?: string | null;
  publishedDate?: string | null;
  source: string;
};

type Trend = {
  keyword: string;
  title: string;
  description?: string;
  citationId?: string;
  relevanceScore?: number;
};

type TrendData = {
  trends: Trend[];
  citations: Citation[];
};

const TrendsWithCitations = () => {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const data = await api.get<TrendData>("/trends/with-citations", false);
      setTrendData(data);
    } catch (err) {
      console.error("Failed to fetch trends", err);
      setTrendData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="trends-with-citations-loading py-8 text-center text-muted-foreground">
        <RefreshCw className="inline-block animate-spin size-5 mb-2" />
        <p>Loading trends...</p>
      </div>
    );
  }

  if (!trendData?.trends?.length) {
    return null;
  }

  return (
    <div className="trends-with-citations space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold font-display">Fashion Trends & Insights</h2>
        <Button variant="outline" size="sm" onClick={fetchTrends} disabled={loading} className="rounded-full gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
      <div className="trends-list space-y-5">
        {trendData.trends.map((trend, idx) => {
          const citation = trend.citationId
            ? trendData.citations.find((c) => c.id === trend.citationId)
            : null;
          return (
            <motion.div
              key={trend.citationId ?? idx}
              className="trend-card glass-card p-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <h3 className="font-semibold font-display mb-2">{trend.title || trend.keyword}</h3>
              {trend.description && (
                <p className="text-sm text-muted-foreground mb-3">{trend.description}</p>
              )}
              {citation && (
                <div className="citation">
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="citation-link"
                  >
                    <ExternalLink size={12} />
                    {citation.source}
                  </a>
                  {citation.snippet && (
                    <span className="citation-snippet">&quot;{citation.snippet}&quot;</span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TrendsWithCitations;
