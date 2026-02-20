import React, { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Search, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFashionTrends } from "@/hooks/useFashionTrends";
import "./FashionTrends.css";

const CATEGORIES = [
  { value: "all", label: "All Trends" },
  { value: "colors", label: "Colors" },
  { value: "clothing", label: "Clothing" },
  { value: "accessories", label: "Accessories" },
  { value: "sustainable", label: "Sustainable" },
];

function FashionTrends({ category: initialCategory = "all" }: { category?: string }) {
  const [activeTab, setActiveTab] = useState(initialCategory);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { trends, loading, error, refresh } = useFashionTrends({
    category: activeTab,
    limit: 15,
  });

  const copyCitation = (title: string, url: string) => {
    const text = `${title} — ${url}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(url);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="fashion-trends-loading py-8 text-center text-muted-foreground">
        <Search className="inline-block animate-pulse size-6 mb-2" />
        <p>Loading trends...</p>
      </div>
    );
  }

  if (error) {
    return <div className="fashion-trends-error text-destructive py-4">{error}</div>;
  }

  if (!trends) return null;

  return (
    <div className="fashion-trends space-y-6">
      <div className="fashion-trends-header">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold font-display">Fashion Trends</h2>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2"
            onClick={() => refresh()}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh (force)
          </Button>
        </div>
        <div className="fashion-trends-tabs flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={activeTab === cat.value ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setActiveTab(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
        <div className="fashion-trends-source text-sm text-muted-foreground flex flex-wrap items-center gap-2">
          <span>Powered by You.com real-time search</span>
          <span className="update-time">
            Query: <em>{trends.query}</em> — Updated: {new Date(trends.timestamp).toLocaleString()}
          </span>
          {trends.meta?.rateInfo?.remaining != null && (
            <span className="rate-info text-xs">API remaining: {trends.meta.rateInfo.remaining}</span>
          )}
          {trends.meta?.fallback && (
            <span className="text-amber-600 dark:text-amber-400">(Fallback data)</span>
          )}
        </div>
      </div>

      <div className="fashion-trends-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.trends.map((trend, index) => (
          <motion.div
            key={index}
            className="fashion-trend-card glass-card p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="trend-header flex justify-between items-start gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {trend.favicon && (
                  <img
                    src={trend.favicon}
                    alt=""
                    width={20}
                    height={20}
                    className="rounded shrink-0"
                  />
                )}
                <a
                  href={trend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold font-display truncate hover:underline"
                >
                  {trend.title}
                </a>
              </div>
              {(trend.relevance_score != null || trend.relevance != null) && (
                <span className="trend-score text-sm text-primary font-medium shrink-0">
                  {(trend.relevance_score ?? trend.relevance ?? 0)}%
                </span>
              )}
            </div>

            {trend.description && (
              <p className="trend-description text-sm text-muted-foreground mb-3">
                {trend.description}
              </p>
            )}

            {trend.insights && trend.insights.length > 0 && (
              <div className="trend-insights mb-3">
                <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Key Insights
                </h4>
                <ul className="space-y-1">
                  {trend.insights.slice(0, 2).map((insight, i) => (
                    <li key={i} className="text-sm">
                      <span className="insight-text">{insight.text}</span>
                      {insight.keywords && insight.keywords.length > 0 && (
                        <div className="insight-keywords flex flex-wrap gap-1 mt-2">
                          {insight.keywords.map((kw) => (
                            <span key={kw} className="keyword-tag text-xs px-2 py-0.5 rounded-full bg-muted">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="trend-footer flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                {trend.url && trend.source && (
                  <a
                    href={trend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Read source
                    <ExternalLink size={10} />
                  </a>
                )}
                {trend.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 gap-1"
                    onClick={() => copyCitation(trend.title, trend.url!)}
                  >
                    {copiedId === trend.url ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    Copy citation
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {trends.sources && trends.sources.length > 0 && (
        <div className="trends-sources">
          <h4 className="text-sm font-medium mb-2">Sources (for judge verification)</h4>
          <div className="sources-list flex flex-wrap gap-2">
            {trends.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-item inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm"
              >
                {source.favicon && (
                  <img src={source.favicon} alt="" className="source-favicon size-4" />
                )}
                <span className="source-title truncate max-w-[180px]">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <footer className="text-xs text-muted-foreground mt-4">
        Source: live search (You.com). Each trend includes its original source for judge verification.
      </footer>
    </div>
  );
}

export default FashionTrends;
