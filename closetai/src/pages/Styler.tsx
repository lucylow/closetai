import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, Shirt, Footprints, Crown, CheckCircle, Flame, User, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_WARDROBE, TRENDS, OCCASIONS, CATEGORY_LABELS, type ClothingItem } from "@/lib/data";

const Styler = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [occasion, setOccasion] = useState("Casual");
  const [outfit, setOutfit] = useState<{ items: ClothingItem[]; trend: string; desc: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleItem = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  }, []);

  const generate = async () => {
    if (selected.size === 0) return;
    setIsGenerating(true);
    // Simulate AI processing
    await new Promise(r => setTimeout(r, 1200));
    const items = SAMPLE_WARDROBE.filter(i => selected.has(i.id));
    const trend = TRENDS[Math.floor(Math.random() * TRENDS.length)];
    const descs = [
      `A relaxed ${occasion.toLowerCase()} look combining ${items.map(i => i.name.toLowerCase()).join(" & ")}. The ${trend.name.toLowerCase()} vibe ties it all together.`,
      `Perfect for a ${occasion.toLowerCase()} outing — your ${items[0]?.name.toLowerCase()} anchors this outfit with a ${trend.name.toLowerCase()} edge.`,
      `Effortlessly styled: ${items.map(i => i.name.toLowerCase()).join(", ")} create a cohesive ${occasion.toLowerCase()} outfit with ${trend.name.toLowerCase()} influence.`,
    ];
    setOutfit({
      items,
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
        <h1 className="text-3xl font-bold font-display gradient-text">AI Outfit Styler</h1>
        <p className="text-muted-foreground mt-1">Select items and let AI create the perfect outfit.</p>
      </div>

      {/* Occasion selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <CloudSun size={14} /> Occasion
        </label>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map(o => (
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

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Closet items */}
        <div className="flex-[2] glass-card p-6 space-y-4">
          <h3 className="font-semibold font-display flex items-center gap-2">
            <Shirt size={18} className="text-primary" /> Select Items (max 4)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SAMPLE_WARDROBE.map(item => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`rounded-2xl p-4 text-center transition-all border-2 ${
                  selected.has(item.id)
                    ? "border-primary bg-primary/10 scale-[1.02] shadow-md"
                    : "border-transparent bg-card hover:shadow-sm"
                }`}
              >
                <div className="text-3xl mb-2">{item.image}</div>
                <span className="text-xs font-medium block truncate">{item.name}</span>
                <span className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[item.category]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Result panel */}
        <div className="flex-1 space-y-4 min-w-[280px]">
          {/* Virtual try-on */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold font-display flex items-center gap-2">
              <User size={18} className="text-primary" /> Virtual Try‑On
            </h3>
            <div className="relative bg-muted rounded-2xl h-52 flex items-center justify-center overflow-hidden">
              <div className="text-6xl opacity-30">🧍</div>
              <AnimatePresence>
                {outfit && outfit.items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: i * 0.15 }}
                    className="absolute text-4xl"
                    style={{ top: `${20 + i * 35}px`, left: `${50 + (i % 2) * 20}%`, transform: "translateX(-50%)" }}
                  >
                    {item.image}
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

          {/* AI suggestion */}
          <div className="glass-card p-6 space-y-3">
            <h3 className="font-semibold font-display flex items-center gap-2">
              <Sparkles size={18} className="text-secondary" /> AI Suggestion
            </h3>
            <AnimatePresence mode="wait">
              {outfit ? (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {outfit.items.map(i => (
                      <span key={i.id} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">{i.name}</span>
                    ))}
                  </div>
                  <p className="text-sm text-center">{outfit.desc}</p>
                  <div className="flex justify-center">
                    <span className="trend-badge"><Flame size={12} /> {outfit.trend}</span>
                  </div>
                  <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle size={12} className="text-accent" /> Virtual try‑on ready
                  </p>
                </motion.div>
              ) : (
                <motion.p key="empty" className="text-sm text-muted-foreground text-center py-4">
                  Select items and click "Style Me" to get AI outfit suggestions.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <Button onClick={generate} disabled={selected.size === 0 || isGenerating} className="w-full rounded-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            <Sparkles size={16} /> {isGenerating ? "Styling..." : "Style Me"}
          </Button>
          <Button variant="outline" onClick={reset} className="w-full rounded-full border-primary/30 gap-2">
            <RotateCcw size={14} /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Styler;
