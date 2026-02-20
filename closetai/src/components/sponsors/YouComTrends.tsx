import React, { useState, useEffect } from "react";
import { Search, Loader2, ExternalLink, Sparkles, TrendingUp, Globe, Zap } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fashionTrends, demoTrendSearchResults, demoCustomSearchResults } from "@/mocks/trends";
import "./YouComTrends.css";

interface TrendReport {
  query: string;
  trends: {
    trendingColors: string[];
    trendingCategories: string[];
    trendingStyles: string[];
    sources?: { url: string; title: string; snippet?: string }[];
  };
  insights: string[];
}

interface TrendsSearchResult {
  trends: { name: string; score: number; direction: string; description: string }[];
  sources: { url: string; title: string; snippet: string }[];
  insights: string[];
  query: string;
  fromApi: boolean;
}

const OCCASIONS = [
  { value: "casual", label: "Casual" },
  { value: "party", label: "Party" },
  { value: "work", label: "Work" },
  { value: "formal", label: "Formal" },
];

const COLOR_MAP: Record<string, string> = {
  lavender: "#e6e6fa",
  terracotta: "#e2725b",
  coral: "#ff7f50",
  "sage green": "#9dc183",
  navy: "#000080",
  "butter yellow": "#FFFACD",
  blush: "#de5d83",
  ivory: "#FFFFF0",
};

const YouComTrends: React.FC = () => {
  const { user } = useAuth();
  const [trends, setTrends] = useState<TrendReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState("casual");
  const [query, setQuery] = useState("");
  const [customResults, setCustomResults] = useState<TrendsSearchResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const loadDemoTrends = (occ: string) => {
    const demoData = demoTrendSearchResults[occ] || demoTrendSearchResults.casual;
    setTrends({
      query: `${occ} fashion trends 2026`,
      trends: {
        trendingColors: fashionTrends.trends.trendingColors,
        trendingCategories: fashionTrends.trends.trendingCategories,
        trendingStyles: fashionTrends.trends.trendingStyles,
        sources: demoData.sources as TrendReport["trends"]["sources"],
      },
      insights: demoData.insights,
    });
    setIsDemo(true);
  };

  const fetchTrendReport = async () => {
    setLoading(true);
    setCustomResults(null);
    try {
      if (user) {
        const data = await api.get<TrendReport>(
          `/fashion/report?occasion=${encodeURIComponent(occasion)}`
        );
        setTrends(data);
        setIsDemo(false);
      } else {
        const searchQuery = `${occasion} fashion trends 2026`;
        const data = await api.get<TrendsSearchResult>(
          `/trends?q=${encodeURIComponent(searchQuery)}&limit=10`,
          false
        );
        setTrends({
          query: data.query,
          trends: {
            trendingColors: data.insights
              .flatMap((i) => i.match(/\b(red|blue|green|lavender|terracotta|coral|sage|navy)\b/gi) || [])
              .filter(Boolean)
              .slice(0, 6),
            trendingCategories: ["top", "bottom", "dress", "outerwear"],
            trendingStyles: ["minimalist", "bohemian", "90s vintage", "casual"],
            sources: data.sources,
          },
          insights: data.insights,
        });
        setIsDemo(false);
      }
    } catch {
      loadDemoTrends(occasion);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setTrends(null);
    try {
      const data = await api.get<TrendsSearchResult>(
        `/trends?q=${encodeURIComponent(query)}&limit=10`,
        false
      );
      setCustomResults(data);
      setIsDemo(false);
    } catch {
      const lowerQuery = query.toLowerCase();
      const matchKey = Object.keys(demoCustomSearchResults).find((k) => lowerQuery.includes(k));
      if (matchKey) {
        const demo = demoCustomSearchResults[matchKey];
        setCustomResults({
          query: query,
          trends: demo.trends,
          sources: demo.sources,
          insights: demo.insights,
          fromApi: false,
        });
      } else {
        const fallback = demoCustomSearchResults["street style"];
        setCustomResults({
          query: query,
          trends: fallback.trends.map((t) => ({ ...t, description: t.description.replace("street style", query) })),
          sources: fallback.sources,
          insights: [`Here are trending insights related to "${query}".`, ...fallback.insights.slice(1)],
          fromApi: false,
        });
      }
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendReport();
  }, []);

  return (
    <div className="youcom-trends">
      <h3 className="youcom-title">
        <Search size={20} />
        Fashion Trends via You.com
        {isDemo && (
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
            Demo Data
          </span>
        )}
      </h3>

      <div className="youcom-controls">
        <Select value={occasion} onValueChange={setOccasion}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OCCASIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={fetchTrendReport}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          Get Personalized Trends
        </Button>
      </div>

      <div className="youcom-search">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trends (e.g., sustainable fashion, street style)..."
          onKeyDown={(e) => e.key === "Enter" && handleCustomSearch()}
          className="flex-1"
        />
        <Button
          variant="secondary"
          onClick={handleCustomSearch}
          disabled={loading}
          className="gap-2"
        >
          <Globe size={16} />
          Search
        </Button>
      </div>

      {loading && (
        <div className="youcom-loading">
          <Loader2 size={24} className="animate-spin" />
          <p>Searching fashion trends with You.com AI...</p>
        </div>
      )}

      {trends && !customResults && (
        <div className="trend-results">
          <p className="trend-query">
            <Zap size={14} className="inline text-primary mr-1" />
            Based on: <span className="font-medium">{trends.query}</span>
          </p>
          <div className="trends-sections">
            <div className="trend-section">
              <h4>
                <TrendingUp size={16} className="inline mr-1 text-primary" />
                Hot Colors
              </h4>
              <div className="color-chips">
                {(trends.trends.trendingColors || []).map((color) => (
                  <span
                    key={color}
                    className="color-chip"
                    style={{
                      backgroundColor: COLOR_MAP[color.toLowerCase()] || color,
                    }}
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
            <div className="trend-section">
              <h4>Trending Categories</h4>
              <div className="category-list">
                {(trends.trends.trendingCategories || []).map((cat) => (
                  <span key={cat} className="category-tag">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div className="trend-section">
              <h4>Trending Styles</h4>
              <div className="style-list">
                {(trends.trends.trendingStyles || []).map((style) => (
                  <span key={style} className="style-tag">
                    {style}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="insights">
            <h4>
              <Sparkles size={16} className="inline mr-1 text-primary" />
              AI Style Insights
            </h4>
            <ul>
              {trends.insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
          {trends.trends.sources && trends.trends.sources.length > 0 && (
            <div className="sources">
              <h4>
                <Globe size={16} className="inline mr-1 text-primary" />
                Research Sources
              </h4>
              <ul>
                {trends.trends.sources.slice(0, 5).map((source, idx) => (
                  <li key={idx}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      {source.title}
                      <ExternalLink size={12} className="inline ml-1" />
                    </a>
                    {source.snippet && (
                      <p className="text-xs text-muted-foreground mt-0.5">{source.snippet}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {customResults && (
        <div className="custom-results">
          <h4>Search Results</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Query: &quot;{customResults.query}&quot;
            {isDemo && <span className="ml-1 text-xs text-primary">(demo)</span>}
          </p>

          {customResults.trends && customResults.trends.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold mb-2">Trending Now</h5>
              <div className="grid gap-2">
                {customResults.trends.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-1">
                      <TrendingUp size={14} className={t.direction === "up" ? "text-green-500" : t.direction === "down" ? "text-red-500" : "text-muted-foreground"} />
                      <span className="text-lg font-bold text-primary">{t.score}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{t.name}</span>
                      <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customResults.insights && customResults.insights.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-semibold mb-2">
                <Sparkles size={14} className="inline mr-1 text-primary" />
                Insights for You
              </h5>
              <ul className="space-y-1">
                {customResults.insights.map((ins, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground pl-3 border-l-2 border-primary/30">{ins}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="search-items">
            {customResults.sources?.map((item, idx) => (
              <div key={idx} className="search-item">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="search-item-link"
                >
                  {item.title}
                  <ExternalLink size={12} className="inline ml-1" />
                </a>
                {item.snippet && <p>{item.snippet}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default YouComTrends;
