import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Flame, Search, ExternalLink, RefreshCw } from "lucide-react";
import { useTrends } from "@/hooks/useTrends";
import { DEMO_TRENDS, fashionTrends } from "@/lib/data";
import { Button } from "@/components/ui/button";
import TrendExplorer from "@/components/trends/TrendExplorer";
import TrendsWithCitations from "@/components/trends/TrendsWithCitations";
import { YouComTrends } from "@/components/sponsors";

const directionIcon = (d: string) => {
  if (d === "up") return <TrendingUp size={16} className="text-accent" />;
  if (d === "down") return <TrendingDown size={16} className="text-destructive" />;
  return <Minus size={16} className="text-muted-foreground" />;
};

const TrendsPage = () => {
  const [searchQuery, setSearchQuery] = useState("latest fashion trends 2026");
  const { trends: apiTrends, sources: apiSources, insights: apiInsights, fromApi, isLoading, refetch } = useTrends(searchQuery);
  const trends = (apiTrends?.length ?? 0) > 0 ? apiTrends : DEMO_TRENDS;
  const sources = (apiSources?.length ?? 0) > 0 ? apiSources : fashionTrends.trends.sources;
  const insights = (apiInsights?.length ?? 0) > 0 ? apiInsights : fashionTrends.insights;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display gradient-text">Fashion Trends</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Search size={14} /> {fromApi ? "Live insights from You.com" : "Demo trends (add YOUCOM_API_KEY for live data)"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="rounded-full gap-2">
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {/* Trend cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-3" />
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {trends.map((trend, i) => (
          <motion.div
            key={trend.name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-6 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Flame size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold font-display">{trend.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    {directionIcon(trend.direction)}
                    <span className="text-muted-foreground capitalize">{trend.direction}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{trend.score}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${trend.score}%` }}
                transition={{ delay: i * 0.08 + 0.3, duration: 0.6 }}
              />
            </div>

            <p className="text-sm text-muted-foreground">{trend.description}</p>

            <TrendExplorer
              trendName={trend.name}
              trendColor={trend.description?.match(/\b(navy|sage|cream|lavender|terracotta|black|white)\b/i)?.[0]}
            />

            <a href="#" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View sources <ExternalLink size={10} />
            </a>
          </motion.div>
        ))}
      </div>
      )}

      {/* Insight cards */}
      <div className="space-y-4">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="glass p-6 space-y-2"
            style={{ borderRadius: "2rem" }}
          >
            <h2 className="text-lg font-bold font-display flex items-center gap-2">
              <Flame size={18} className="text-primary" /> AI Style Insight
            </h2>
            <p className="text-muted-foreground">{insight}</p>
          </motion.div>
        ))}
      </div>

      {/* You.com enhanced trend research */}
      <YouComTrends />

      {/* Trends with full citations (research-grade) */}
      <TrendsWithCitations />

      {/* Trend sources */}
      <div className="glass-card p-6">
        <h3 className="font-semibold font-display mb-4">Sources</h3>
        <div className="grid gap-3">
          {sources.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <ExternalLink size={16} className="text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-sm">{s.title}</div>
                <p className="text-xs text-muted-foreground">{s.snippet}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendsPage;
