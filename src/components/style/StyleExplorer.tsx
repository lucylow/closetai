import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink, Sparkles, ArrowLeft } from "lucide-react";
import { api, getImageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Citation = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  favicon?: string | null;
};

type AdviceEntry = {
  citationId: string;
  tips: string[];
};

type AdviceData = {
  item: {
    id: string;
    imageUrl: string;
    attributes?: { color?: string; category?: string; pattern?: string; style?: string };
  };
  query: string;
  advice: AdviceEntry[];
  citations: Citation[];
};

const StyleExplorer = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<{ id: string; imageUrl: string; extractedAttributes?: Record<string, string> } | null>(null);
  const [adviceData, setAdviceData] = useState<AdviceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [occasion, setOccasion] = useState("");
  const [vibe, setVibe] = useState("");

  useEffect(() => {
    if (!itemId || !user) return;
    const fetchItem = async () => {
      try {
        const data = await api.get<{ id: string; imageUrl: string; extractedAttributes?: Record<string, string> }>(
          `/wardrobe/${itemId}`
        );
        setItem(data);
      } catch (err) {
        console.error(err);
        toast.error("Could not load item. You may need to log in.");
        setItem(null);
      }
    };
    fetchItem();
  }, [itemId, user]);

  const fetchAdvice = async () => {
    if (!itemId) return;
    setLoading(true);
    setAdviceData(null);
    try {
      const params = new URLSearchParams();
      if (occasion) params.append("occasion", occasion);
      if (vibe) params.append("vibe", vibe);
      const data = await api.get<AdviceData>(
        `/style/advice/${itemId}?${params.toString()}`
      );
      setAdviceData(data);
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch styling advice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/wardrobe")} className="gap-2">
          <ArrowLeft size={16} /> Back to Wardrobe
        </Button>
        <div className="glass-card rounded-3xl p-12 text-center">
          <p className="text-muted-foreground">
            Please log in to explore styling ideas for your wardrobe items.
          </p>
        </div>
      </div>
    );
  }

  if (!itemId) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/wardrobe")} className="gap-2">
          <ArrowLeft size={16} /> Back to Wardrobe
        </Button>
        <div className="glass-card rounded-3xl p-12 text-center text-muted-foreground">
          No item selected. Choose an item from your wardrobe to get styling ideas.
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/wardrobe")} className="gap-2">
          <ArrowLeft size={16} /> Back to Wardrobe
        </Button>
        <div className="glass-card rounded-3xl p-12 text-center">
          <p className="text-muted-foreground">Loading item...</p>
        </div>
      </div>
    );
  }

  const attrs = item.extractedAttributes || {};
  const attrLabel = [attrs.color, attrs.pattern, attrs.category, attrs.style]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/wardrobe")} className="gap-2 -ml-2">
        <ArrowLeft size={16} /> Back to Wardrobe
      </Button>

      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center">
        <div className="shrink-0">
          <img
            src={getImageUrl(item.imageUrl)}
            alt="Clothing item"
            className="w-40 h-40 sm:w-48 sm:h-48 object-cover rounded-2xl"
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold font-display gradient-text">
            Style Your {attrs.category || "Item"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {attrLabel || "Your wardrobe piece"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center p-4 sm:p-6 rounded-3xl bg-muted/50 border border-border/50">
        <select
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          className="flex-1 min-w-[140px] px-4 py-2.5 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Any occasion</option>
          <option value="casual">Casual</option>
          <option value="work">Work</option>
          <option value="party">Party</option>
          <option value="date">Date night</option>
          <option value="formal">Formal</option>
        </select>
        <select
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          className="flex-1 min-w-[140px] px-4 py-2.5 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Any vibe</option>
          <option value="edgy">Edgy</option>
          <option value="minimalist">Minimalist</option>
          <option value="bohemian">Bohemian</option>
          <option value="preppy">Preppy</option>
          <option value="romantic">Romantic</option>
        </select>
        <Button
          onClick={fetchAdvice}
          disabled={loading}
          className="rounded-full gap-2 shrink-0"
        >
          <Sparkles size={16} className={loading ? "animate-pulse" : ""} />
          {loading ? "Searching..." : "Get Styling Ideas"}
        </Button>
      </div>

      {loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="inline-block animate-pulse size-10 mb-3 text-primary" />
          <p>Searching for creative ideas from fashion blogs & magazines...</p>
        </div>
      )}

      {adviceData && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <p className="text-sm text-muted-foreground italic">
            <strong>We searched:</strong> &quot;{adviceData.query}&quot;
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adviceData.advice.map((adv, idx) => {
              const citation = adviceData.citations.find((c) => c.id === adv.citationId);
              return (
                <motion.div
                  key={adv.citationId}
                  className="glass-card rounded-2xl p-5 hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <div className="space-y-2">
                    {adv.tips.map((tip, i) => (
                      <p key={i} className="text-sm leading-relaxed">
                        • {tip}
                      </p>
                    ))}
                  </div>
                  {citation && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        <ExternalLink size={12} />
                        {citation.source}
                      </a>
                      {citation.snippet && (
                        <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
                          &quot;{citation.snippet}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {!adviceData && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles size={48} className="mx-auto mb-4 opacity-40" />
          <p className="font-medium">Ready to explore?</p>
          <p className="text-sm mt-1">
            Click &quot;Get Styling Ideas&quot; to see how fashion bloggers and magazines style similar pieces.
          </p>
        </div>
      )}
    </div>
  );
};

export default StyleExplorer;
