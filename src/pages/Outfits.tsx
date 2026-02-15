import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, Shirt, CheckCircle, Flame, User, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_WARDROBE, DEMO_TRENDS, OCCASIONS, CATEGORY_LABELS, dailyOutfits, type ClothingItem } from "@/lib/data";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useRecommendations } from "@/hooks/useRecommendations";
import AdvancedOutfitSuggestions from "@/components/outfit/AdvancedOutfitSuggestions";
import PersonalizedOutfitList from "@/components/outfit/PersonalizedOutfitList";

const Outfits = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [occasion, setOccasion] = useState("Casual");
  const [outfit, setOutfit] = useState<{ items: ClothingItem[]; trend: string; desc: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { items: wardrobeItems, isAuthenticated } = useWardrobe();
  const { dailyOutfits: apiOutfits, isLoading: outfitsLoading } = useRecommendations(occasion.toLowerCase());
  const items = isAuthenticated ? wardrobeItems : DEMO_WARDROBE;
  const todayPicks = isAuthenticated ? apiOutfits : dailyOutfits;

  const toggleItem = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  }, []);

  const generate = async () => {
    if (selected.size === 0) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    const selectedItems = items.filter((i) => selected.has(i.id));
    const trend = DEMO_TRENDS[Math.floor(Math.random() * DEMO_TRENDS.length)];
    const descs = [
      `A relaxed ${occasion.toLowerCase()} look combining ${selectedItems.map((i) => i.name.toLowerCase()).join(" & ")}. The ${trend.name.toLowerCase()} vibe ties it all together.`,
      `Perfect for a ${occasion.toLowerCase()} outing — your ${selectedItems[0]?.name.toLowerCase()} anchors this outfit with a ${trend.name.toLowerCase()} edge.`,
      `Effortlessly styled: ${selectedItems.map((i) => i.name.toLowerCase()).join(", ")} create a cohesive ${occasion.toLowerCase()} outfit with ${trend.name.toLowerCase()} influence.`,
    ];
    setOutfit({
      items: selectedItems,
      trend: trend.name,
      desc: descs[Math.floor(Math.random() * descs.length)],
    });
    setIsGenerating(false);
  };

  const reset = () => {
    setSelected(new Set());
    setOutfit(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display gradient-text">AI Outfit Recommendations</h1>
        <p className="text-muted-foreground mt-1">Select items and let AI create the perfect outfit.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <CloudSun size={14} /> Occasion
        </label>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              onClick={() => setOccasion(o)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                occasion === o
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Daily outfit suggestions from AI */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-semibold font-display flex items-center gap-2">
          <Sparkles size={18} className="text-primary" /> Today&apos;s Picks
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(outfitsLoading ? [] : todayPicks).map((o) => {
            const outfitItems = Array.isArray(o.items) && o.items.length > 0 && typeof o.items[0] === "string"
              ? (o.items as string[]).map((id) => items.find((i) => i.id === id)).filter(Boolean) as ClothingItem[]
              : (o.items as ClothingItem[]);
            return (
              <div
                key={o.id}
                className="p-4 rounded-2xl bg-muted/50 space-y-2"
              >
                <div className="flex gap-2 flex-wrap">
                  {outfitItems.map((item) => (
                    <div key={item.id} className="w-10 h-10 rounded-lg overflow-hidden bg-card">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">{item.image}</div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium">{o.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{o.occasion}</span>
                  <span>·</span>
                  <span>{Math.round((o.totalScore ?? 0.8) * 100)}% match</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-[2] glass-card p-6 space-y-4">
          <h3 className="font-semibold font-display flex items-center gap-2">
            <Shirt size={18} className="text-primary" /> Select Items (max 4)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`rounded-2xl p-4 text-center transition-all border-2 ${
                  selected.has(item.id)
                    ? "border-primary bg-primary/10 scale-[1.02] shadow-md"
                    : "border-transparent bg-card hover:shadow-sm"
                }`}
              >
                <div className="mb-2 aspect-square rounded-xl overflow-hidden bg-muted">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">{item.image}</div>
                  )}
                </div>
                <span className="text-xs font-medium block truncate">{item.name}</span>
                <span className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[item.category]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4 min-w-[280px]">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold font-display flex items-center gap-2">
              <User size={18} className="text-primary" /> Virtual Try‑On
            </h3>
            <div className="relative bg-muted rounded-2xl h-52 flex items-center justify-center overflow-hidden">
              <div className="text-6xl opacity-30">🧍</div>
              <AnimatePresence>
                {outfit &&
                  outfit.items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ delay: i * 0.15 }}
                      className="absolute w-16 h-16 rounded-xl overflow-hidden shadow-lg"
                      style={{
                        top: `${20 + i * 40}px`,
                        left: `${50 + (i % 2) * 25}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl bg-muted">{item.image}</div>
                      )}
                    </motion.div>
                  ))}
              </AnimatePresence>
              {isGenerating && (
                <div className="absolute inset-0 bg-card/60 flex items-center justify-center">
                  <Sparkles size={28} className="text-primary animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 space-y-3">
            <h3 className="font-semibold font-display flex items-center gap-2">
              <Sparkles size={18} className="text-secondary" /> AI Suggestion
            </h3>
            <AnimatePresence mode="wait">
              {outfit ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="flex flex-wrap gap-2 justify-center">
                    {outfit.items.map((i) => (
                      <span
                        key={i.id}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {i.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-center">{outfit.desc}</p>
                  <div className="flex justify-center">
                    <span className="trend-badge">
                      <Flame size={12} /> {outfit.trend}
                    </span>
                  </div>
                  <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle size={12} className="text-accent" /> Virtual try‑on ready
                  </p>
                </motion.div>
              ) : (
                <motion.p key="empty" className="text-sm text-muted-foreground text-center py-4">
                  Select items and click &quot;Style Me&quot; to get AI outfit suggestions.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <Button
            onClick={generate}
            disabled={selected.size === 0 || isGenerating}
            className="w-full rounded-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <Sparkles size={16} /> {isGenerating ? "Styling..." : "Style Me"}
          </Button>
          <Button variant="outline" onClick={reset} className="w-full rounded-full border-primary/30 gap-2">
            <RotateCcw size={14} /> Reset
          </Button>
        </div>
      </div>

      {/* Advanced Outfit Suggestions */}
      <div className="mt-12 border-t border-border pt-8">
        <h2 className="text-xl font-semibold font-display mb-4">Today&apos;s AI Suggestions</h2>
        <AdvancedOutfitSuggestions />
      </div>

      {/* Trend-Aware Outfits (personalized with citations) */}
      <div className="mt-12 border-t border-border pt-8">
        <PersonalizedOutfitList />
      </div>
    </div>
  );
};

export default Outfits;
