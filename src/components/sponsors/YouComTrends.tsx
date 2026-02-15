import React, { useState, useEffect } from "react";
import { Search, Loader2, ExternalLink } from "lucide-react";
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
import { fashionTrends } from "@/mocks/trends";
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

const YouComTrends: React.FC = () => {
  const { user } = useAuth();
  const [trends, setTrends] = useState<TrendReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState("casual");
  const [query, setQuery] = useState("");
  const [customResults, setCustomResults] = useState<TrendsSearchResult | null>(null);

  // Fetch personalized trend report (uses /fashion/report when auth, else /trends)
  const fetchTrendReport = async () => {
    setLoading(true);
    setCustomResults(null);
    try {
      if (user) {
        const data = await api.get<TrendReport>(
          `/fashion/report?occasion=${encodeURIComponent(occasion)}`
        );
        setTrends(data);
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
      }
    } catch (err) {
      console.error("Failed to fetch trends", err);
      setTrends({
        query: `${occasion} fashion trends`,
        trends: fashionTrends.trends,
        insights: fashionTrends.insights,
      });
    } finally {
      setLoading(false);
    }
  };

  // Custom search via trends API
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
    } catch (err) {
      console.error("Search failed", err);
      setCustomResults(null);
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
          ) : null}
          Get Personalized Trends
        </Button>
      </div>

      <div className="youcom-search">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Or search trends..."
          onKeyDown={(e) => e.key === "Enter" && handleCustomSearch()}
          className="flex-1"
        />
        <Button
          variant="secondary"
          onClick={handleCustomSearch}
          disabled={loading}
          className="gap-2"
        >
          Search
        </Button>
      </div>

      {loading && (
        <div className="youcom-loading">
          <Loader2 size={24} className="animate-spin" />
          <p>Fetching live trends...</p>
        </div>
      )}

      {trends && !customResults && (
        <div className="trend-results">
          <p className="trend-query">Based on: {trends.query}</p>
          <div className="trends-sections">
            <div className="trend-section">
              <h4>Hot Colors</h4>
              <div className="color-chips">
                {(trends.trends.trendingColors || []).map((color) => (
                  <span
                    key={color}
                    className="color-chip"
                    style={{
                      backgroundColor:
                        color === "lavender"
                          ? "#e6e6fa"
                          : color === "terracotta"
                          ? "#e2725b"
                          : color === "coral"
                          ? "#ff7f50"
                          : color === "sage green"
                          ? "#9dc183"
                          : color === "navy"
                          ? "#000080"
                          : color,
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
            <h4>Personalized Insights</h4>
            <ul>
              {trends.insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
          {trends.trends.sources && trends.trends.sources.length > 0 && (
            <div className="sources">
              <h4>Sources</h4>
              <ul>
                {trends.trends.sources.slice(0, 3).map((source, idx) => (
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
          </p>
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
